import {
  createContext,
  useCallback,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { EyeTrackingSample } from "@/types/eye-tracking";
import type { FaceLandmarkPoint } from "@/types/face-mesh-frame";
import type { VerticalPursuitDataset } from "@/services/analytics";
import type {
  ChartJsMovementExport,
  MovementComparisonRecord,
} from "@/services/processing";
import type { FovCalibrationTarget, TrackingService } from "@/services/tracking";
import type { VisionPipelineStatus } from "@/vision/pipeline/types";
import {
  eyeTrackingReducer,
  initialEyeTrackingState,
} from "./eyeTrackingReducer";
import type { EyeTrackingState } from "./types";

type EyeTrackingContextValue = {
  state: EyeTrackingState;
  startSession: (label?: string) => void;
  endSession: () => void;
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearSamples: () => void;
  ingestSample: (sample: EyeTrackingSample) => void;
  updateFaceLandmarks: (landmarks: FaceLandmarkPoint[] | null) => void;
  recordMovementSample: (sample: EyeTrackingSample) => void;
  setPipelineStatus: (status: VisionPipelineStatus) => void;
  captureCalibration: (target: FovCalibrationTarget) => void;
  runCalibration: () => boolean;
  getCalibrationFactors: () => {
    kL: number;
    kR: number;
    kLY: number;
    kRY: number;
    leftBaseline: { x: number; y: number };
    rightBaseline: { x: number; y: number };
  } | null;
  resetCalibration: () => void;
  applyPrepCalibration: (params: {
    kL: number;
    kR: number;
    kLY: number;
    kRY: number;
    leftBaseline?: { x: number; y: number };
    rightBaseline?: { x: number; y: number };
  }) => void;
  exportMovementData: () => ChartJsMovementExport | null;
  downloadMovementJson: () => void;
  getMovementRecords: () => MovementComparisonRecord[];
  startTrackingAnalytics: (
    getTargetY: () => number | null,
    label?: string,
  ) => void;
  stopTrackingAnalytics: () => VerticalPursuitDataset | null;
  getVerticalPursuitDataset: () => VerticalPursuitDataset | null;
  registerTrackingService: (service: TrackingService | null) => void;
};

export const EyeTrackingContext = createContext<EyeTrackingContextValue | null>(
  null,
);

type EyeTrackingProviderProps = {
  children: ReactNode;
};

let activeTrackingService: TrackingService | null = null;

export function EyeTrackingProvider({ children }: EyeTrackingProviderProps) {
  const [state, dispatch] = useReducer(
    eyeTrackingReducer,
    initialEyeTrackingState,
  );

  const syncCalibrationState = useCallback(() => {
    const model = activeTrackingService?.getFovCalibrator().getModel();
    if (!model) return;

    dispatch({
      type: "CALIBRATION_UPDATE",
      payload: {
        isCalibrated: model.isCalibrated,
        sampleCount: model.samples.length,
      },
    });
  }, []);

  const registerTrackingService = useCallback<
    EyeTrackingContextValue["registerTrackingService"]
  >((service) => {
    activeTrackingService = service;
    if (service) syncCalibrationState();
  }, [syncCalibrationState]);

  const startSession = useCallback((label = "Diagnostic session") => {
    activeTrackingService?.getMovementProcessor().reset();
    dispatch({
      type: "SESSION_START",
      payload: {
        id: crypto.randomUUID(),
        startedAt: Date.now(),
        endedAt: null,
        label,
      },
    });
  }, []);

  const endSession = useCallback(() => {
    activeTrackingService?.getMovementProcessor().stop();
    dispatch({ type: "SESSION_END" });
  }, []);

  const startRecording = useCallback(() => {
    activeTrackingService?.getMovementProcessor().start();
    dispatch({ type: "RECORDING_START" });
  }, []);

  const pauseRecording = useCallback(() => {
    activeTrackingService?.getMovementProcessor().stop();
    dispatch({ type: "RECORDING_PAUSE" });
  }, []);

  const resumeRecording = useCallback(() => {
    activeTrackingService?.getMovementProcessor().start();
    dispatch({ type: "RECORDING_RESUME" });
  }, []);

  const clearSamples = useCallback(() => {
    activeTrackingService?.getMovementProcessor().reset();
    dispatch({ type: "SAMPLES_CLEAR" });
    dispatch({ type: "MOVEMENT_RESET" });
  }, []);

  const ingestSample = useCallback((sample: EyeTrackingSample) => {
    dispatch({ type: "SAMPLE_ADD", payload: sample });
  }, []);

  const updateFaceLandmarks = useCallback(
    (landmarks: FaceLandmarkPoint[] | null) => {
      dispatch({ type: "FACE_LANDMARKS_UPDATE", payload: landmarks });
    },
    [],
  );

  const recordMovementSample = useCallback(
    (sample: EyeTrackingSample) => {
      if (!activeTrackingService) {
        return;
      }

      const verticalAnalytics =
        activeTrackingService.getVerticalPursuitAnalytics();
      if (verticalAnalytics.isActive()) {
        const record = verticalAnalytics.record(sample);
        if (record) {
          dispatch({
            type: "VERTICAL_PURSUIT_RECORD",
            payload: verticalAnalytics.getRecords().length,
          });
        }
        return;
      }

      const processor = activeTrackingService.getMovementProcessor();
      if (!processor.isActive()) {
        return;
      }

      const record = processor.record(sample);

      if (record) {
        dispatch({
          type: "MOVEMENT_RECORD",
          payload: processor.compareAgainstTargetStimulus().length,
        });
      }
    },
    [],
  );

  const startTrackingAnalytics = useCallback<
    EyeTrackingContextValue["startTrackingAnalytics"]
  >((getTargetY, label = "Stage 1 Step 1 training") => {
    if (!activeTrackingService) {
      return;
    }

    activeTrackingService.getMovementProcessor().reset();
    activeTrackingService.getVerticalPursuitAnalytics().start(getTargetY);
    dispatch({ type: "VERTICAL_PURSUIT_RESET" });

    if (!state.session) {
      dispatch({
        type: "SESSION_START",
        payload: {
          id: crypto.randomUUID(),
          startedAt: Date.now(),
          endedAt: null,
          label,
        },
      });
    }

    dispatch({ type: "RECORDING_START" });
  }, [state.session]);

  const stopTrackingAnalytics = useCallback(() => {
    if (!activeTrackingService) {
      return null;
    }

    const dataset = activeTrackingService.getVerticalPursuitAnalytics().stop();
    dispatch({ type: "VERTICAL_PURSUIT_FINALIZE", payload: dataset });
    dispatch({ type: "RECORDING_PAUSE" });
    return dataset;
  }, []);

  const getVerticalPursuitDataset = useCallback(() => {
    return state.verticalPursuitDataset;
  }, [state.verticalPursuitDataset]);

  const setPipelineStatus = useCallback((status: VisionPipelineStatus) => {
    dispatch({ type: "PIPELINE_STATUS", payload: status });
  }, []);

  const captureCalibration = useCallback(
    (target: FovCalibrationTarget) => {
      const sample = state.latestSample;
      if (!sample?.faceDetected || !activeTrackingService) {
        return;
      }

      activeTrackingService.recordCalibrationSample(target, {
        left: sample.leftEye.center,
        right: sample.rightEye.center,
      });
      syncCalibrationState();
    },
    [state.latestSample, syncCalibrationState],
  );

  const runCalibration = useCallback(() => {
    const success = activeTrackingService?.runCalibration() ?? false;
    syncCalibrationState();
    return success;
  }, [syncCalibrationState]);

  const getCalibrationFactors = useCallback(() => {
    const model = activeTrackingService?.getFovCalibrator().getModel();
    if (!model?.isCalibrated) {
      return null;
    }

    return {
      kL: model.kL,
      kR: model.kR,
      kLY: model.kLY,
      kRY: model.kRY,
      leftBaseline: model.leftBaseline,
      rightBaseline: model.rightBaseline,
    };
  }, []);

  const resetCalibration = useCallback(() => {
    activeTrackingService?.resetCalibration();
    dispatch({ type: "CALIBRATION_RESET" });
  }, []);

  const applyPrepCalibration = useCallback<
    EyeTrackingContextValue["applyPrepCalibration"]
  >((params) => {
    activeTrackingService?.injectPrepCalibration(params);
    dispatch({
      type: "CALIBRATION_UPDATE",
      payload: { isCalibrated: true, sampleCount: 0 },
    });
  }, []);

  const exportMovementData = useCallback((): ChartJsMovementExport | null => {
    const processor = activeTrackingService?.getMovementProcessor();
    if (!processor || processor.compareAgainstTargetStimulus().length === 0) {
      return null;
    }
    return processor.toChartJsExport();
  }, []);

  const downloadMovementJson = useCallback(() => {
    const processor = activeTrackingService?.getMovementProcessor();
    if (!processor) return;

    const json = processor.toJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `eye-movement-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, []);

  const getMovementRecords = useCallback((): MovementComparisonRecord[] => {
    return (
      activeTrackingService?.getMovementProcessor().compareAgainstTargetStimulus() ??
      []
    );
  }, []);

  const value = useMemo(
    () => ({
      state,
      startSession,
      endSession,
      startRecording,
      pauseRecording,
      resumeRecording,
      clearSamples,
      ingestSample,
      updateFaceLandmarks,
      recordMovementSample,
      setPipelineStatus,
      captureCalibration,
      runCalibration,
      getCalibrationFactors,
      resetCalibration,
      applyPrepCalibration,
      exportMovementData,
      downloadMovementJson,
      getMovementRecords,
      startTrackingAnalytics,
      stopTrackingAnalytics,
      getVerticalPursuitDataset,
      registerTrackingService,
    }),
    [
      state,
      startSession,
      endSession,
      startRecording,
      pauseRecording,
      resumeRecording,
      clearSamples,
      ingestSample,
      updateFaceLandmarks,
      recordMovementSample,
      setPipelineStatus,
      captureCalibration,
      runCalibration,
      getCalibrationFactors,
      resetCalibration,
      applyPrepCalibration,
      exportMovementData,
      downloadMovementJson,
      getMovementRecords,
      startTrackingAnalytics,
      stopTrackingAnalytics,
      getVerticalPursuitDataset,
      registerTrackingService,
    ],
  );

  return (
    <EyeTrackingContext.Provider value={value}>
      {children}
    </EyeTrackingContext.Provider>
  );
}
