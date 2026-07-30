import { useEffect, useMemo, useState } from "react";
import { useEyeTracking } from "@/state";
import { DEFAULT_SINE_STIMULUS } from "@/services/processing";
import {
  SHOULDER_ROTATION_CUE_TIMES_SEC,
  SHOULDER_UP_CUE_TIMES_SEC,
} from "@/lib/pacingMetronome";
import {
  buildHeadEyeVelocityPoints,
  resolveHeadEyeVelocityAxis,
  type HeadEyeVelocityPoint,
} from "@/services/analytics/headEyeVelocityChart";
import {
  isStage2Step1NoddingSession,
  isStage2Step2TurningSession,
  pursuitRecordsToHeadMovementPoints,
  samplesToHeadMovementPoints,
  type HeadMovementGraphPoint,
} from "@/services/analytics/headPoseChart";
import {
  isStage3TrainingSession,
  ShoulderMovementRecorder,
  type ShoulderMovementGraphPoint,
} from "@/services/analytics/shoulderMovementChart";
import {
  buildTrackingGraphDatasets,
  type DualStreamTrackingGraphRecord,
  type TrackingExerciseMode,
  type TrackingGraphDatasets,
} from "./trackingGraphData";

export type TrackingGraphStatus = "ready" | "no_calibration" | "waiting";

export type TrackingGraphStreamSlice = {
  graphPoints: DualStreamTrackingGraphRecord[];
  status: TrackingGraphStatus;
};

export type HeadMovementStreamSlice = {
  points: HeadMovementGraphPoint[];
  status: TrackingGraphStatus;
  showNoddingTarget: boolean;
  showTurningTarget: boolean;
};

export type HeadEyeVelocityStreamSlice = {
  points: HeadEyeVelocityPoint[];
  status: TrackingGraphStatus;
};

export type ShoulderMovementStreamSlice = {
  points: ShoulderMovementGraphPoint[];
  status: TrackingGraphStatus;
  liftCueTimesSec?: number[];
};

export type TrackingDataStream = {
  pursuitAxis: TrackingExerciseMode;
  datasets: TrackingGraphDatasets;
  vertical: TrackingGraphStreamSlice;
  horizontal: TrackingGraphStreamSlice;
  headMovement: HeadMovementStreamSlice;
  headEyeVelocity: HeadEyeVelocityStreamSlice;
  shoulderMovement: ShoulderMovementStreamSlice;
  showShoulderMovement: boolean;
  hasCalibration: boolean;
};

function graphStatus(
  hasCalibration: boolean,
  pointCount: number,
): TrackingGraphStatus {
  if (!hasCalibration) {
    return "no_calibration";
  }

  if (pointCount < 2) {
    return "waiting";
  }

  return "ready";
}

/**
 * Builds every analytics chart dataset from a single eye-tracking snapshot so
 * all graphs update from the same stream in lockstep.
 */
export function useTrackingDataStream(): TrackingDataStream {
  const {
    state,
    getCalibrationFactors,
    getMovementRecords,
    getVerticalPursuitRecords,
  } = useEyeTracking();
  const { calibration, samples, pursuitAxis, session } = state;
  const showShoulderMovement = isStage3TrainingSession(session?.label);
  const [shoulderTick, setShoulderTick] = useState(0);

  useEffect(() => {
    if (!showShoulderMovement) {
      return;
    }

    let frameId = 0;
    const tick = () => {
      setShoulderTick(ShoulderMovementRecorder.getVersion());
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [showShoulderMovement]);

  return useMemo(() => {
    const factors = getCalibrationFactors();
    const pursuitRecords = getVerticalPursuitRecords();
    const movementRecords = getMovementRecords();

    const datasets = buildTrackingGraphDatasets({
      exerciseMode: pursuitAxis,
      pursuitRecords,
      movementRecords,
      samples,
      verticalCalibration: factors
        ? {
            kLY: factors.kLY,
            kRY: factors.kRY,
            leftBaseline: factors.leftBaseline,
            rightBaseline: factors.rightBaseline,
          }
        : null,
      horizontalCalibration: factors
        ? {
            kL: factors.kL,
            kR: factors.kR,
            leftBaseline: factors.leftBaseline,
            rightBaseline: factors.rightBaseline,
          }
        : null,
      stimulus: DEFAULT_SINE_STIMULUS,
    });

    const hasCalibration =
      calibration.isCalibrated ||
      pursuitRecords.length >= 2 ||
      movementRecords.length >= 2;

    const headPoints =
      pursuitRecords.length >= 2
        ? pursuitRecordsToHeadMovementPoints(pursuitRecords)
        : samples.length >= 2
          ? samplesToHeadMovementPoints(samples)
          : [];

    const showNoddingTarget = isStage2Step1NoddingSession(session?.label);
    const showTurningTarget = isStage2Step2TurningSession(session?.label);
    const shoulderPoints =
      showShoulderMovement && shoulderTick >= 0
        ? [...ShoulderMovementRecorder.getPoints()]
        : [];
    const velocityAxis = resolveHeadEyeVelocityAxis({
      showNoddingTarget,
      showTurningTarget,
      pursuitAxis,
    });
    const headEyeVelocityPoints = showShoulderMovement
      ? []
      : buildHeadEyeVelocityPoints(
          headPoints,
          datasets.vertical,
          datasets.horizontal,
          velocityAxis,
        );

    return {
      pursuitAxis,
      datasets,
      hasCalibration,
      showShoulderMovement,
      vertical: {
        graphPoints: datasets.vertical,
        status: graphStatus(hasCalibration, datasets.vertical.length),
      },
      horizontal: {
        graphPoints: datasets.horizontal,
        status: graphStatus(hasCalibration, datasets.horizontal.length),
      },
      headMovement: {
        points: showShoulderMovement ? [] : headPoints,
        status: showShoulderMovement
          ? "waiting"
          : graphStatus(hasCalibration, headPoints.length),
        showNoddingTarget,
        showTurningTarget,
      },
      headEyeVelocity: {
        points: headEyeVelocityPoints,
        status: graphStatus(hasCalibration, headEyeVelocityPoints.length),
      },
      shoulderMovement: {
        points: shoulderPoints,
        liftCueTimesSec:
          session?.label === "Stage 3 Step 1 training"
            ? SHOULDER_UP_CUE_TIMES_SEC
            : session?.label === "Stage 3 Step 2 training"
              ? SHOULDER_ROTATION_CUE_TIMES_SEC
            : undefined,
        status:
          shoulderPoints.length >= 2
            ? "ready"
            : showShoulderMovement
              ? "waiting"
              : "waiting",
      },
    };
  }, [
    calibration.isCalibrated,
    getCalibrationFactors,
    getMovementRecords,
    getVerticalPursuitRecords,
    pursuitAxis,
    samples,
    session?.label,
    showShoulderMovement,
    shoulderTick,
    state.movementRecordCount,
    state.recordingStatus,
    state.verticalPursuitDataset,
    state.verticalPursuitRecordCount,
  ]);
}
