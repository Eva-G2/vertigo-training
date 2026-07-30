import type { EyeTrackingSample } from "@/types/eye-tracking";
import type { MovementComparisonRecord, SineWaveStimulusConfig } from "@/services/processing";
import { getSineWaveTargetPosition } from "@/services/processing/targetStimulus";
import { normalizedToDegrees } from "@/services/processing/degreesConversion";
import type { VerticalPursuitRecord } from "@/services/analytics";
import type { TrackingFrameSignals } from "@/services/tracking/gazeCompensation";
import {
  horizontalLeftEyeDegrees,
  horizontalRightEyeDegrees,
  normalizedTargetToDegrees,
  STATIC_HORIZONTAL_TARGET_DEG,
  STATIC_VERTICAL_TARGET_DEG,
  verticalLeftEyeDegrees,
  verticalRightEyeDegrees,
  type HorizontalCalibrationParams,
  type VerticalCalibrationParams,
} from "@/services/tracking/trackingDegrees";

export type TrackingGraphAxis = "horizontal" | "vertical";

export type TrackingExerciseMode = "vertical" | "horizontal" | "vergence";

export type TrackingGraphEyeSignal = {
  leftEyeDeg: number;
  rightEyeDeg: number;
};

export type DualStreamTrackingGraphRecord = {
  elapsedSec: number;
  targetDeg: number;
  rawSignal: TrackingGraphEyeSignal;
  correctedSignal: TrackingGraphEyeSignal;
};

export type HorizontalTrackingGraphRecord = DualStreamTrackingGraphRecord;
export type VerticalTrackingGraphRecord = DualStreamTrackingGraphRecord;

export type TrackingGraphDatasets = {
  vertical: VerticalTrackingGraphRecord[];
  horizontal: HorizontalTrackingGraphRecord[];
};

function cloneEyeSignal(signal: TrackingGraphEyeSignal): TrackingGraphEyeSignal {
  return {
    leftEyeDeg: signal.leftEyeDeg,
    rightEyeDeg: signal.rightEyeDeg,
  };
}

function cloneGraphPoint(
  point: DualStreamTrackingGraphRecord,
): DualStreamTrackingGraphRecord {
  return {
    elapsedSec: point.elapsedSec,
    targetDeg: point.targetDeg,
    rawSignal: cloneEyeSignal(point.rawSignal),
    correctedSignal: cloneEyeSignal(point.correctedSignal),
  };
}

function missingCorrectedSignal(): TrackingGraphEyeSignal {
  return {
    leftEyeDeg: Number.NaN,
    rightEyeDeg: Number.NaN,
  };
}

function fromFrameSignals(
  elapsedSec: number,
  signals: TrackingFrameSignals,
): DualStreamTrackingGraphRecord {
  return cloneGraphPoint({
    elapsedSec,
    targetDeg: signals.targetPath,
    rawSignal: {
      leftEyeDeg: signals.rawLeftEye,
      rightEyeDeg: signals.rawRightEye,
    },
    correctedSignal: {
      leftEyeDeg: signals.correctedLeftEye,
      rightEyeDeg: signals.correctedRightEye,
    },
  });
}

function verticalFromSample(
  sample: EyeTrackingSample,
  calibration: VerticalCalibrationParams,
): Pick<DualStreamTrackingGraphRecord, "rawSignal" | "correctedSignal"> {
  const rawSignal: TrackingGraphEyeSignal = {
    leftEyeDeg:
      sample.rawLeftGazeDeg?.vertical ??
      verticalLeftEyeDegrees(sample.leftEye.center.y, calibration),
    rightEyeDeg:
      sample.rawRightGazeDeg?.vertical ??
      verticalRightEyeDegrees(sample.rightEye.center.y, calibration),
  };

  const correctedSignal: TrackingGraphEyeSignal =
    sample.leftEyeCorrected != null && sample.rightEyeCorrected != null
      ? {
          leftEyeDeg: sample.leftEyeCorrected.vertical,
          rightEyeDeg: sample.rightEyeCorrected.vertical,
        }
      : missingCorrectedSignal();

  return { rawSignal: cloneEyeSignal(rawSignal), correctedSignal: cloneEyeSignal(correctedSignal) };
}

function horizontalFromSample(
  sample: EyeTrackingSample,
  calibration: HorizontalCalibrationParams,
): Pick<DualStreamTrackingGraphRecord, "rawSignal" | "correctedSignal"> {
  const rawSignal: TrackingGraphEyeSignal = {
    leftEyeDeg:
      sample.rawLeftGazeDeg?.horizontal ??
      horizontalLeftEyeDegrees(sample.leftEye.center.x, calibration),
    rightEyeDeg:
      sample.rawRightGazeDeg?.horizontal ??
      horizontalRightEyeDegrees(sample.rightEye.center.x, calibration),
  };

  const correctedSignal: TrackingGraphEyeSignal =
    sample.leftEyeCorrected != null && sample.rightEyeCorrected != null
      ? {
          leftEyeDeg: sample.leftEyeCorrected.horizontal,
          rightEyeDeg: sample.rightEyeCorrected.horizontal,
        }
      : missingCorrectedSignal();

  return { rawSignal: cloneEyeSignal(rawSignal), correctedSignal: cloneEyeSignal(correctedSignal) };
}

export function verticalRecordsToGraphPoints(
  records: Array<{
    elapsedSec: number;
    targetY?: number;
    targetDeg?: number;
    leftEyeDeg: number;
    rightEyeDeg: number;
    vertical?: TrackingFrameSignals;
  }>,
): VerticalTrackingGraphRecord[] {
  return records.map((record) => {
    if (record.vertical) {
      return fromFrameSignals(record.elapsedSec, record.vertical);
    }

    return cloneGraphPoint({
      elapsedSec: record.elapsedSec,
      targetDeg:
        record.targetY != null && Number.isFinite(record.targetY)
          ? normalizedTargetToDegrees(record.targetY)
          : (record.targetDeg ?? STATIC_VERTICAL_TARGET_DEG),
      rawSignal: {
        leftEyeDeg: record.leftEyeDeg,
        rightEyeDeg: record.rightEyeDeg,
      },
      correctedSignal: missingCorrectedSignal(),
    });
  });
}

export function verticalMovementRecordsToGraphPoints(
  records: MovementComparisonRecord[],
  stimulusAmplitude: number,
): VerticalTrackingGraphRecord[] {
  if (records.length === 0) {
    return [];
  }

  const startMs = records[0]!.timestamp;

  return records.map((record) =>
    cloneGraphPoint({
      elapsedSec: (record.timestamp - startMs) / 1000,
      targetDeg: normalizedToDegrees(record.target.y, stimulusAmplitude),
      rawSignal: {
        leftEyeDeg: normalizedToDegrees(record.leftEye.y, stimulusAmplitude),
        rightEyeDeg: normalizedToDegrees(record.rightEye.y, stimulusAmplitude),
      },
      correctedSignal: record.correctedLeftEye != null && record.correctedRightEye != null
        ? {
            leftEyeDeg: record.correctedLeftEye.y,
            rightEyeDeg: record.correctedRightEye.y,
          }
        : missingCorrectedSignal(),
    }),
  );
}

export function verticalSamplesToGraphPoints(
  samples: EyeTrackingSample[],
  calibration: VerticalCalibrationParams,
  stimulus: SineWaveStimulusConfig,
): VerticalTrackingGraphRecord[] {
  if (samples.length === 0) {
    return [];
  }

  const startMs = samples[0]!.timestamp;

  return samples.map((sample) => {
    const elapsedMs = sample.timestamp - startMs;
    const target = getSineWaveTargetPosition(elapsedMs, stimulus);
    const eyes = verticalFromSample(sample, calibration);

    return cloneGraphPoint({
      elapsedSec: elapsedMs / 1000,
      targetDeg: normalizedTargetToDegrees(target.y),
      ...eyes,
    });
  });
}

export type VergenceTrackingGraphRecord = DualStreamTrackingGraphRecord;

export function vergenceRecordsToGraphPoints(
  records: VerticalPursuitRecord[],
): VergenceTrackingGraphRecord[] {
  return records.map((record) => fromFrameSignals(record.elapsedSec, record.horizontal));
}

export function staticCenterHorizontalGraphPoints(
  records: VerticalPursuitRecord[],
): HorizontalTrackingGraphRecord[] {
  return records.map((record) => fromFrameSignals(record.elapsedSec, record.horizontal));
}

export function staticCenterVerticalSamplesToGraphPoints(
  samples: EyeTrackingSample[],
  calibration: VerticalCalibrationParams,
): VerticalTrackingGraphRecord[] {
  if (samples.length === 0) {
    return [];
  }

  const startMs = samples[0]!.timestamp;

  return samples.map((sample) => {
    const eyes = verticalFromSample(sample, calibration);
    return cloneGraphPoint({
      elapsedSec: (sample.timestamp - startMs) / 1000,
      targetDeg: STATIC_VERTICAL_TARGET_DEG,
      ...eyes,
    });
  });
}

export function horizontalPursuitRecordsToGraphPoints(
  records: VerticalPursuitRecord[],
): HorizontalTrackingGraphRecord[] {
  return records.map((record) => fromFrameSignals(record.elapsedSec, record.horizontal));
}

export function verticalPursuitCompanionGraphPoints(
  records: VerticalPursuitRecord[],
): VerticalTrackingGraphRecord[] {
  return records.map((record) => fromFrameSignals(record.elapsedSec, record.vertical));
}

type BuildTrackingGraphDatasetsParams = {
  exerciseMode: TrackingExerciseMode;
  pursuitRecords: VerticalPursuitRecord[];
  movementRecords: MovementComparisonRecord[];
  samples: EyeTrackingSample[];
  verticalCalibration: VerticalCalibrationParams | null;
  horizontalCalibration: HorizontalCalibrationParams | null;
  stimulus: SineWaveStimulusConfig;
};

export function buildTrackingGraphDatasets({
  exerciseMode,
  pursuitRecords,
  movementRecords,
  samples,
  verticalCalibration,
  horizontalCalibration,
  stimulus,
}: BuildTrackingGraphDatasetsParams): TrackingGraphDatasets {
  if (pursuitRecords.length >= 2) {
    if (exerciseMode === "vergence") {
      return {
        vertical: verticalPursuitCompanionGraphPoints(pursuitRecords),
        horizontal: staticCenterHorizontalGraphPoints(pursuitRecords),
      };
    }

    if (exerciseMode === "vertical") {
      return {
        vertical: verticalRecordsToGraphPoints(pursuitRecords),
        horizontal: horizontalPursuitRecordsToGraphPoints(pursuitRecords),
      };
    }

    return {
      vertical: verticalPursuitCompanionGraphPoints(pursuitRecords),
      horizontal: horizontalPursuitRecordsToGraphPoints(pursuitRecords),
    };
  }

  if (samples.length >= 2 && verticalCalibration && horizontalCalibration) {
    if (exerciseMode === "vergence") {
      return {
        vertical: staticCenterVerticalSamplesToGraphPoints(
          samples,
          verticalCalibration,
        ),
        horizontal: horizontalSamplesToGraphPoints(samples, horizontalCalibration),
      };
    }

    if (exerciseMode === "vertical") {
      return {
        vertical: verticalSamplesToGraphPoints(
          samples,
          verticalCalibration,
          stimulus,
        ),
        horizontal: horizontalSamplesToGraphPoints(samples, horizontalCalibration),
      };
    }

    return {
      vertical: verticalSamplesToGraphPoints(
        samples,
        verticalCalibration,
        stimulus,
      ),
      horizontal: horizontalSamplesToGraphPoints(samples, horizontalCalibration),
    };
  }

  return {
    vertical: verticalMovementRecordsToGraphPoints(
      movementRecords,
      stimulus.amplitude,
    ),
    horizontal: horizontalRecordsToGraphPoints(
      movementRecords,
      stimulus.amplitude,
    ),
  };
}

export function horizontalSamplesToGraphPoints(
  samples: EyeTrackingSample[],
  calibration: HorizontalCalibrationParams,
): HorizontalTrackingGraphRecord[] {
  if (samples.length === 0) {
    return [];
  }

  const startMs = samples[0]!.timestamp;

  return samples.map((sample) => {
    const eyes = horizontalFromSample(sample, calibration);
    return cloneGraphPoint({
      elapsedSec: (sample.timestamp - startMs) / 1000,
      targetDeg: STATIC_HORIZONTAL_TARGET_DEG,
      ...eyes,
    });
  });
}

export function horizontalRecordsToGraphPoints(
  records: MovementComparisonRecord[],
  stimulusAmplitude: number,
): HorizontalTrackingGraphRecord[] {
  if (records.length === 0) {
    return [];
  }

  const startMs = records[0]!.timestamp;

  return records.map((record) =>
    cloneGraphPoint({
      elapsedSec: (record.timestamp - startMs) / 1000,
      targetDeg: normalizedToDegrees(record.target.x, stimulusAmplitude),
      rawSignal: {
        leftEyeDeg: normalizedToDegrees(record.leftEye.x, stimulusAmplitude),
        rightEyeDeg: normalizedToDegrees(record.rightEye.x, stimulusAmplitude),
      },
      correctedSignal: record.correctedLeftEye != null && record.correctedRightEye != null
        ? {
            leftEyeDeg: record.correctedLeftEye.x,
            rightEyeDeg: record.correctedRightEye.x,
          }
        : missingCorrectedSignal(),
    }),
  );
}

/** Splits cloned graph points into independent raw/corrected series for chart binding. */
export function splitGraphStreams(points: DualStreamTrackingGraphRecord[]): {
  elapsedSec: number[];
  targetDeg: number[];
  rawSignal: TrackingGraphEyeSignal[];
  correctedSignal: TrackingGraphEyeSignal[];
} {
  const cloned = points.map(cloneGraphPoint);

  return {
    elapsedSec: cloned.map((point) => point.elapsedSec),
    targetDeg: cloned.map((point) => point.targetDeg),
    rawSignal: cloned.map((point) => cloneEyeSignal(point.rawSignal)),
    correctedSignal: cloned.map((point) => cloneEyeSignal(point.correctedSignal)),
  };
}

export const VERTICAL_TRACKING_GRAPH_Y_RANGE = {
  min: -60,
  max: 60,
} as const;

export const HORIZONTAL_TRACKING_GRAPH_Y_RANGE = {
  min: -60,
  max: 60,
} as const;

export const TRACKING_GRAPH_Y_RANGE = HORIZONTAL_TRACKING_GRAPH_Y_RANGE;
