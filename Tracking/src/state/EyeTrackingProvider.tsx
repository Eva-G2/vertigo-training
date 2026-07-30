import {
  createContext,
  useCallback,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type { EyeTrackingSample } from "@/types/eye-tracking";
import type { FaceLandmarkPoint } from "@/types/face-mesh-frame";
import type {
  PursuitAxis,
  VerticalPursuitDataset,
  VerticalPursuitRecord,
} from "@/services/analytics";
import type {
  ChartJsMovementExport,
  MovementComparisonRecord,
} from "@/services/processing";
import type { FovCalibrationTarget, GazeRecenterBaseline, TrackingService } from "@/services/tracking";
import { TrackingStateManager } from "@/services/tracking/TrackingStateManager";
import { LANDMARKS, extractEyeMetrics } from "@/vision/mediapipe/landmarks";
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
    faceTopNormalizedY: number | null;
    chinNormalizedY: number | null;
  } | null;
  resetCalibration: () => void;
  applyPrepCalibration: (params: {
    kL: number;
    kR: number;
    kLY: number;
    kRY: number;
    leftBaseline?: { x: number; y: number };
    rightBaseline?: { x: number; y: number };
    faceTopNormalizedY?: number | null;
    chinNormalizedY?: number | null;
  }) => void;
  recenterBaseline: () => GazeRecenterBaseline | null;
  recenterTracking: () => GazeRecenterBaseline | null;
  applyRecenterBaseline: (baseline: GazeRecenterBaseline) => void;
  clearRecenterBaseline: () => void;
  exportMovementData: () => ChartJsMovementExport | null;
  downloadMovementJson: () => void;
  getMovementRecords: () => MovementComparisonRecord[];
  startTrackingAnalytics: (
    getTarget: () => number | null,
    axis?: PursuitAxis,
    label?: string,
  ) => void;
  stopTrackingAnalytics: () => VerticalPursuitDataset | null;
  getVerticalPursuitDataset: () => VerticalPursuitDataset | null;
  getVerticalPursuitRecords: () => VerticalPursuitRecord[];
  registerTrackingService: (service: TrackingService | null) => void;
};

export const EyeTrackingContext = createContext<EyeTrackingContextValue | null>(
  null,
);

type EyeTrackingProviderProps = {
  children: ReactNode;
};

let activeTrackingService: TrackingService | null = null;

const LANDMARK_EPSILON = 0.00015;

function faceLandmarksStable(
  previous: FaceLandmarkPoint[] | null,
  next: FaceLandmarkPoint[] | null,
): boolean {
  if (previous === next) {
    return true;
  }

  if (!previous || !next || previous.length !== next.length) {
    return false;
  }

  const indices = [
    LANDMARKS.leftIrisCenter,
    LANDMARKS.rightIrisCenter,
    LANDMARKS.forehead,
    LANDMARKS.chin,
  ];

  for (const index of indices) {
    const a = previous[index];
    const b = next[index];
    if (!a || !b) {
      return false;
    }

    if (
      Math.abs(a.x - b.x) > LANDMARK_EPSILON ||
      Math.abs(a.y - b.y) > LANDMARK_EPSILON
    ) {
      return false;
    }
  }

  return true;
}

export function EyeTrackingProvider({ children }: EyeTrackingProviderProps) {
  const [state, dispatch] = useReducer(
    eyeTrackingReducer,
    initialEyeTrackingState,
  );
  const stateRef = useRef(state);
  stateRef.current = state;
  const latestLandmarksRef = useRef<FaceLandmarkPoint[] | null>(null);

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
    activeTrackingService?.endRecordingSession();
    dispatch({ type: "SESSION_END" });
  }, []);

  const startRecording = useCallback(() => {
    activeTrackingService?.startRecording();
    dispatch({ type: "RECORDING_START" });
  }, []);

  const pauseRecording = useCallback(() => {
    activeTrackingService?.pauseRecording();
    dispatch({ type: "RECORDING_PAUSE" });
  }, []);

  const resumeRecording = useCallback(() => {
    activeTrackingService?.resumeRecording();
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
      if (faceLandmarksStable(latestLandmarksRef.current, landmarks)) {
        return;
      }

      latestLandmarksRef.current = landmarks;
      dispatch({ type: "FACE_LANDMARKS_UPDATE", payload: landmarks });
    },
    [],
  );

  const recordMovementSample = useCallback(
    (sample: EyeTrackingSample) => {
      if (!activeTrackingService || !TrackingStateManager.isActive) {
        return;
      }

      const verticalAnalytics =
        activeTrackingService.getVerticalPursuitAnalytics();
      if (verticalAnalytics.isActive()) {
        const model = activeTrackingService.getFovCalibrator().getModel();
        if (model.isCalibrated) {
          verticalAnalytics.setCalibration({
            kL: model.kL,
            kR: model.kR,
            kLY: model.kLY,
            kRY: model.kRY,
            leftBaseline: model.leftBaseline,
            rightBaseline: model.rightBaseline,
          });
        }

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
  >((getTarget, axis = "vertical", label = "Stage 1 Step 1 training") => {
    if (!activeTrackingService) {
      return;
    }

    activeTrackingService.startTracking();
    activeTrackingService.getMovementProcessor().reset();
    activeTrackingService.resetHeadChartBaseline();
    activeTrackingService.scheduleBaselineCapture();
    const model = activeTrackingService.getFovCalibrator().getModel();
    const verticalAnalytics = activeTrackingService.getVerticalPursuitAnalytics();
    verticalAnalytics.setCalibration(
      model.isCalibrated
        ? {
            kL: model.kL,
            kR: model.kR,
            kLY: model.kLY,
            kRY: model.kRY,
            leftBaseline: model.leftBaseline,
            rightBaseline: model.rightBaseline,
          }
        : null,
    );
    verticalAnalytics.start(getTarget, axis);
    const vorAxis = axis === "horizontal" ? "horizontal" : "vertical";
    activeTrackingService.getGazeStabilityService().start(vorAxis);
    dispatch({ type: "VERTICAL_PURSUIT_RESET", payload: axis });

    if (!stateRef.current.session) {
      dispatch({
        type: "SESSION_START",
        payload: {
          id: crypto.randomUUID(),
          startedAt: Date.now(),
          endedAt: null,
          label,
        },
      });
    } else {
      dispatch({ type: "SESSION_LABEL_UPDATE", payload: label });
    }

    dispatch({ type: "RECORDING_START" });
  }, []);

  const stopTrackingAnalytics = useCallback(() => {
    if (!activeTrackingService) {
      return null;
    }

    const dataset = activeTrackingService.getVerticalPursuitAnalytics().stop();
    activeTrackingService.getGazeStabilityService().stop();
    activeTrackingService.pauseRecording();
    dispatch({ type: "VERTICAL_PURSUIT_FINALIZE", payload: dataset });
    dispatch({ type: "RECORDING_PAUSE" });
    return dataset;
  }, []);

  const getVerticalPursuitDataset = useCallback(() => {
    return state.verticalPursuitDataset;
  }, [state.verticalPursuitDataset]);

  const getVerticalPursuitRecords = useCallback(() => {
    const liveRecords =
      activeTrackingService?.getVerticalPursuitAnalytics().getRecords() ?? [];
    if (liveRecords.length > 0) {
      return liveRecords;
    }
    return state.verticalPursuitDataset?.records ?? [];
  }, [state.verticalPursuitDataset]);

  const setPipelineStatus = useCallback((status: VisionPipelineStatus) => {
    dispatch({ type: "PIPELINE_STATUS", payload: status });
  }, []);

  const captureCalibration = useCallback(
    (target: FovCalibrationTarget) => {
      const { latestFaceLandmarks } = stateRef.current;
      if (!activeTrackingService || !latestFaceLandmarks?.length) {
        return;
      }

      const eyeMetrics = extractEyeMetrics(latestFaceLandmarks);
      if (!eyeMetrics) {
        return;
      }

      const forehead = latestFaceLandmarks[LANDMARKS.forehead];
      const chin = latestFaceLandmarks[LANDMARKS.chin];
      const faceTopNormalizedY =
        target.label === "center" && forehead ? forehead.y : undefined;
      const chinNormalizedY =
        target.label === "center" && chin ? chin.y : undefined;

      activeTrackingService.recordCalibrationSample(
        target,
        {
          left: eyeMetrics.leftEye.center,
          right: eyeMetrics.rightEye.center,
        },
        faceTopNormalizedY,
        chinNormalizedY,
      );
      syncCalibrationState();
    },
    [syncCalibrationState],
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
      faceTopNormalizedY: model.faceTopNormalizedY,
      chinNormalizedY: model.chinNormalizedY,
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

  const recenterBaseline = useCallback((): GazeRecenterBaseline | null => {
    const sample = stateRef.current.latestSample;
    if (!sample?.faceDetected || !activeTrackingService) {
      return null;
    }

    return activeTrackingService.recenterBaseline(sample);
  }, []);

  const recenterTracking = useCallback((): GazeRecenterBaseline | null => {
    const sample = stateRef.current.latestSample;
    if (!sample?.faceDetected || !activeTrackingService) {
      return null;
    }

    return activeTrackingService.recenterTracking(sample);
  }, []);

  const applyRecenterBaseline = useCallback(
    (baseline: GazeRecenterBaseline) => {
      activeTrackingService?.setRecenterBaseline(baseline);
    },
    [],
  );

  const clearRecenterBaseline = useCallback(() => {
    activeTrackingService?.clearRecenterBaseline();
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
      recenterBaseline,
      recenterTracking,
      applyRecenterBaseline,
      clearRecenterBaseline,
      exportMovementData,
      downloadMovementJson,
      getMovementRecords,
      startTrackingAnalytics,
      stopTrackingAnalytics,
      getVerticalPursuitDataset,
      getVerticalPursuitRecords,
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
      recenterBaseline,
      recenterTracking,
      applyRecenterBaseline,
      clearRecenterBaseline,
      exportMovementData,
      downloadMovementJson,
      getMovementRecords,
      startTrackingAnalytics,
      stopTrackingAnalytics,
      getVerticalPursuitDataset,
      getVerticalPursuitRecords,
      registerTrackingService,
    ],
  );

  return (
    <EyeTrackingContext.Provider value={value}>
      {children}
    </EyeTrackingContext.Provider>
  );
}
