import {
  buildSmoothPursuitChirp,
  DEFAULT_SMOOTH_PURSUIT_CHIRP,
  getCompletedCycles,
} from "@/lib/smoothPursuitPath";
import type { MovementComparisonRecord } from "@/services/processing";
import { normalizedToDegrees } from "@/services/processing/degreesConversion";
import { horizontalEyeDegrees, STATIC_HORIZONTAL_TARGET_DEG } from "@/services/tracking/trackingDegrees";
import { headNodTargetPitchDegAtElapsedSec } from "./headNodPacingChart";
import { headTurnTargetYawDegAtElapsedSec } from "./headTurnPacingChart";
import type { VerticalPursuitRecord } from "./VerticalPursuitAnalytics";

export type TrackingSessionAxis =
  | "vertical"
  | "horizontal"
  | "both"
  | "vergence";

/** Head axis used for accuracy when comparing pose to pacing targets. */
export type HeadAccuracyAxis = "pitch" | "yaw";

export type SessionResults = {
  completionRatePct: number;
  accuracyPct: number;
  averageAngleDeg: number;
};

export type ComputeSessionResultsParams = {
  axis: TrackingSessionAxis;
  elapsedSeconds: number;
  viewportHeight: number;
  verticalRecords?: VerticalPursuitRecord[];
  horizontalRecords?: MovementComparisonRecord[];
  horizontalCalibration?: {
    kL: number;
    kR: number;
    leftBaseline: { x: number; y: number };
    rightBaseline: { x: number; y: number };
  };
  stimulusAmplitude?: number;
  accuracyToleranceDeg?: number;
  /** When set, completion is derived from elapsed session time vs this duration. */
  expectedDurationSec?: number;
  /** When set, accuracy compares head pose to the Stage 2 pacing target. */
  headAccuracyAxis?: HeadAccuracyAxis;
};

const DEFAULT_ACCURACY_TOLERANCE_DEG = 15;

export function computeCompletionRatePct(
  elapsedSeconds: number,
  viewportHeight: number,
): number {
  const { totalCycles } = DEFAULT_SMOOTH_PURSUIT_CHIRP;
  const params = buildSmoothPursuitChirp(viewportHeight);
  const completedCycles = getCompletedCycles(
    Math.max(0, elapsedSeconds),
    params.f0,
    params.k,
  );

  return Math.min(
    100,
    Math.round((completedCycles / totalCycles) * 100),
  );
}

export function computeAccuracyPct(
  targetValues: number[],
  eyeValues: number[],
  toleranceDeg = DEFAULT_ACCURACY_TOLERANCE_DEG,
): number {
  const sampleCount = Math.min(targetValues.length, eyeValues.length);
  if (sampleCount === 0) {
    return 0;
  }

  let inWindow = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    const target = targetValues[index]!;
    const eye = eyeValues[index]!;
    if (Math.abs(eye - target) <= toleranceDeg) {
      inWindow += 1;
    }
  }

  return Math.round((inWindow / sampleCount) * 100);
}

function getValidHeadMovementValues(
  records: VerticalPursuitRecord[],
  axis: HeadAccuracyAxis,
): number[] {
  const headValues: number[] = [];

  for (const record of records) {
    const headValue =
      axis === "pitch" ? record.headPitchDeg : record.headYawDeg;
    if (Number.isFinite(headValue)) {
      headValues.push(headValue);
    }
  }

  return headValues;
}

function computeHeadMovementAccuracyPct(
  records: VerticalPursuitRecord[],
  axis: HeadAccuracyAxis,
  toleranceDeg: number,
): number {
  const headValues: number[] = [];
  const targetValues: number[] = [];

  for (const record of records) {
    const headValue =
      axis === "pitch" ? record.headPitchDeg : record.headYawDeg;
    if (!Number.isFinite(headValue)) {
      continue;
    }

    headValues.push(headValue);
    targetValues.push(
      axis === "pitch"
        ? headNodTargetPitchDegAtElapsedSec(record.elapsedSec)
        : headTurnTargetYawDegAtElapsedSec(record.elapsedSec),
    );
  }

  return computeAccuracyPct(targetValues, headValues, toleranceDeg);
}

function applyHeadAccuracyOverride(
  results: SessionResults,
  verticalRecords: VerticalPursuitRecord[],
  headAccuracyAxis: HeadAccuracyAxis | undefined,
  accuracyToleranceDeg: number,
): SessionResults {
  if (!headAccuracyAxis || verticalRecords.length === 0) {
    return results;
  }

  const headValues = getValidHeadMovementValues(
    verticalRecords,
    headAccuracyAxis,
  );

  return {
    ...results,
    accuracyPct: computeHeadMovementAccuracyPct(
      verticalRecords,
      headAccuracyAxis,
      accuracyToleranceDeg,
    ),
    averageAngleDeg: computeAverageAngleDeg(headValues),
  };
}

export function findPeakAndTroughValues(values: number[]): number[] {
  if (values.length === 0) {
    return [];
  }

  if (values.length === 1) {
    return [values[0]!];
  }

  const extrema: number[] = [];

  for (let index = 1; index < values.length - 1; index += 1) {
    const previous = values[index - 1]!;
    const current = values[index]!;
    const next = values[index + 1]!;
    const isPeak = current > previous && current >= next;
    const isTrough = current < previous && current <= next;

    if (isPeak || isTrough) {
      extrema.push(current);
    }
  }

  return extrema;
}

export function computeAverageAngleDeg(eyeValues: number[]): number {
  const extrema = findPeakAndTroughValues(eyeValues);
  if (extrema.length === 0) {
    return 0;
  }

  const amplitudeSum = extrema.reduce(
    (sum, value) => sum + Math.abs(value),
    0,
  );

  return Math.round(amplitudeSum / extrema.length);
}

function computeDualAxisSessionResults(
  verticalRecords: VerticalPursuitRecord[],
  completionRatePct: number,
  accuracyToleranceDeg: number,
): SessionResults {
  const verticalEyeValues = getVerticalEyeValues(verticalRecords);
  const verticalTargetValues = verticalRecords.map((record) => record.targetDeg);
  const horizontalEyeValues = verticalRecords.map(
    (record) =>
      (record.leftEyeHorizontalDeg + record.rightEyeHorizontalDeg) / 2,
  );
  const horizontalTargetValues = verticalRecords.map(
    (record) => record.targetHorizontalDeg,
  );

  const verticalAccuracy = computeAccuracyPct(
    verticalTargetValues,
    verticalEyeValues,
    accuracyToleranceDeg,
  );
  const horizontalAccuracy = computeAccuracyPct(
    horizontalTargetValues,
    horizontalEyeValues,
    accuracyToleranceDeg,
  );

  const verticalAverage = computeAverageAngleDeg(verticalEyeValues);
  const horizontalAverage = computeAverageAngleDeg(horizontalEyeValues);

  return {
    completionRatePct,
    accuracyPct: Math.round((verticalAccuracy + horizontalAccuracy) / 2),
    averageAngleDeg: Math.round((verticalAverage + horizontalAverage) / 2),
  };
}

function computeVideoCompletionRatePct(
  elapsedSeconds: number,
  expectedDurationSec: number,
): number {
  if (expectedDurationSec <= 0) {
    return elapsedSeconds > 0 ? 100 : 0;
  }

  return Math.min(
    100,
    Math.round((Math.max(0, elapsedSeconds) / expectedDurationSec) * 100),
  );
}

function computeVergenceSessionResults(
  verticalRecords: VerticalPursuitRecord[],
  completionRatePct: number,
  accuracyToleranceDeg: number,
): SessionResults {
  const leftEyeValues = verticalRecords.map(
    (record) => record.leftEyeHorizontalDeg,
  );
  const rightEyeValues = verticalRecords.map(
    (record) => record.rightEyeHorizontalDeg,
  );
  const targetValues = verticalRecords.map(() => STATIC_HORIZONTAL_TARGET_DEG);

  const leftAccuracy = computeAccuracyPct(
    targetValues,
    leftEyeValues,
    accuracyToleranceDeg,
  );
  const rightAccuracy = computeAccuracyPct(
    targetValues,
    rightEyeValues,
    accuracyToleranceDeg,
  );

  const convergenceValues = verticalRecords.map(
    (record) =>
      Math.abs(record.leftEyeHorizontalDeg - record.rightEyeHorizontalDeg),
  );

  return {
    completionRatePct,
    accuracyPct: Math.round((leftAccuracy + rightAccuracy) / 2),
    averageAngleDeg: computeAverageAngleDeg(convergenceValues),
  };
}

function getVerticalEyeValues(records: VerticalPursuitRecord[]): number[] {
  return records.map(
    (record) => (record.leftEyeDeg + record.rightEyeDeg) / 2,
  );
}

function getHorizontalEyeValues(
  records: MovementComparisonRecord[],
  calibration: NonNullable<ComputeSessionResultsParams["horizontalCalibration"]>,
): number[] {
  return records.map((record) =>
    horizontalEyeDegrees(record.leftEye.x, record.rightEye.x, calibration),
  );
}

function getHorizontalTargetValues(
  records: MovementComparisonRecord[],
  stimulusAmplitude: number,
): number[] {
  return records.map((record) =>
    normalizedToDegrees(record.target.x, stimulusAmplitude),
  );
}

export function computeSessionResults(
  params: ComputeSessionResultsParams,
): SessionResults {
  const {
    axis,
    elapsedSeconds,
    viewportHeight,
    verticalRecords = [],
    horizontalRecords = [],
    horizontalCalibration,
    stimulusAmplitude = 1,
    accuracyToleranceDeg = DEFAULT_ACCURACY_TOLERANCE_DEG,
    expectedDurationSec,
    headAccuracyAxis,
  } = params;

  const completionRatePct =
    expectedDurationSec != null && expectedDurationSec > 0
      ? computeVideoCompletionRatePct(elapsedSeconds, expectedDurationSec)
      : computeCompletionRatePct(elapsedSeconds, viewportHeight);

  if (axis === "vergence" && verticalRecords.length > 0) {
    return applyHeadAccuracyOverride(
      computeVergenceSessionResults(
        verticalRecords,
        completionRatePct,
        accuracyToleranceDeg,
      ),
      verticalRecords,
      headAccuracyAxis,
      accuracyToleranceDeg,
    );
  }

  if (axis === "both" && verticalRecords.length > 0) {
    return applyHeadAccuracyOverride(
      computeDualAxisSessionResults(
        verticalRecords,
        completionRatePct,
        accuracyToleranceDeg,
      ),
      verticalRecords,
      headAccuracyAxis,
      accuracyToleranceDeg,
    );
  }

  if (axis === "vertical" && verticalRecords.length > 0) {
    const eyeValues = getVerticalEyeValues(verticalRecords);
    const targetValues = verticalRecords.map((record) => record.targetDeg);

    return applyHeadAccuracyOverride(
      {
        completionRatePct,
        accuracyPct: computeAccuracyPct(
          targetValues,
          eyeValues,
          accuracyToleranceDeg,
        ),
        averageAngleDeg: computeAverageAngleDeg(eyeValues),
      },
      verticalRecords,
      headAccuracyAxis,
      accuracyToleranceDeg,
    );
  }

  if (axis === "horizontal" && verticalRecords.length > 0) {
    const eyeValues = verticalRecords.map(
      (record) =>
        (record.leftEyeHorizontalDeg + record.rightEyeHorizontalDeg) / 2,
    );
    const targetValues = verticalRecords.map(
      (record) => record.targetHorizontalDeg,
    );

    return applyHeadAccuracyOverride(
      {
        completionRatePct,
        accuracyPct: computeAccuracyPct(
          targetValues,
          eyeValues,
          accuracyToleranceDeg,
        ),
        averageAngleDeg: computeAverageAngleDeg(eyeValues),
      },
      verticalRecords,
      headAccuracyAxis,
      accuracyToleranceDeg,
    );
  }

  if (
    axis === "horizontal" &&
    horizontalRecords.length > 0 &&
    horizontalCalibration
  ) {
    const eyeValues = getHorizontalEyeValues(
      horizontalRecords,
      horizontalCalibration,
    );
    const targetValues = getHorizontalTargetValues(
      horizontalRecords,
      stimulusAmplitude,
    );

    return applyHeadAccuracyOverride(
      {
        completionRatePct,
        accuracyPct: computeAccuracyPct(
          targetValues,
          eyeValues,
          accuracyToleranceDeg,
        ),
        averageAngleDeg: computeAverageAngleDeg(eyeValues),
      },
      verticalRecords,
      headAccuracyAxis,
      accuracyToleranceDeg,
    );
  }

  return applyHeadAccuracyOverride(
    {
      completionRatePct,
      accuracyPct: 0,
      averageAngleDeg: 0,
    },
    verticalRecords,
    headAccuracyAxis,
    accuracyToleranceDeg,
  );
}

export function sessionResultsToStepMetrics(
  results: SessionResults,
): {
  completionPct: number;
  accuracyPct: number;
  averageAngleDeg: number;
} {
  return {
    completionPct: results.completionRatePct,
    accuracyPct: results.accuracyPct,
    averageAngleDeg: results.averageAngleDeg,
  };
}
