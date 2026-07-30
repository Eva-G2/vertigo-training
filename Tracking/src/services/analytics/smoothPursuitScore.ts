import type { MovementComparisonRecord } from "@/services/processing/types";
import type { SineWaveStimulusConfig } from "@/services/processing/types";
import {
  MAX_DEVIATION_DEGREES,
  normalizedToDegrees,
} from "@/services/processing/degreesConversion";
import { dynamicTimeWarping } from "./dtw";
import type { DtwResult } from "./types";

function recordToDegreesVector(
  record: MovementComparisonRecord,
  source: "target" | "actual",
  stimulusAmplitude: number,
): number[] {
  if (source === "actual" && record.correctedActual) {
    return [record.correctedActual.x, record.correctedActual.y];
  }

  const point = source === "target" ? record.target : record.actual;
  return [
    normalizedToDegrees(point.x, stimulusAmplitude),
    normalizedToDegrees(point.y, stimulusAmplitude),
  ];
}

function diagonalEuclideanDistance(
  records: MovementComparisonRecord[],
  stimulusAmplitude: number,
): number {
  let total = 0;
  for (const record of records) {
    const target = recordToDegreesVector(record, "target", stimulusAmplitude);
    const actual = recordToDegreesVector(record, "actual", stimulusAmplitude);
    const dx = target[0]! - actual[0]!;
    const dy = target[1]! - actual[1]!;
    total += Math.hypot(dx, dy);
  }
  return total;
}

/**
 * Converts DTW alignment cost into a 0–100% Smooth Pursuit Score.
 * 100% = near-perfect warped alignment; 0% = poor or no tracking.
 */
export function computeSmoothPursuitScore(
  records: MovementComparisonRecord[],
  stimulus: SineWaveStimulusConfig,
  dtwResult: DtwResult,
): {
  score: number;
  averagePointErrorDeg: number;
} {
  if (records.length < 2 || !Number.isFinite(dtwResult.distance)) {
    return { score: 0, averagePointErrorDeg: 0 };
  }

  const targetSeries = records.map((record) =>
    recordToDegreesVector(record, "target", stimulus.amplitude),
  );
  const actualSeries = records.map((record) =>
    recordToDegreesVector(record, "actual", stimulus.amplitude),
  );

  const alignedLength = Math.max(targetSeries.length, actualSeries.length, 1);
  const averagePointErrorDeg = dtwResult.distance / alignedLength;

  const unalignedDistance = diagonalEuclideanDistance(
    records,
    stimulus.amplitude,
  );
  const unalignedAverage =
    unalignedDistance / Math.max(records.length, 1);

  const worstCasePerPoint = MAX_DEVIATION_DEGREES * Math.SQRT2 * 2;
  const referenceError = Math.max(
    unalignedAverage,
    averagePointErrorDeg,
    worstCasePerPoint * 0.25,
  );

  const rawScore = 1 - averagePointErrorDeg / referenceError;
  const score = Math.round(Math.max(0, Math.min(100, rawScore * 100)));

  return { score, averagePointErrorDeg };
}

export function runDtwAnalysis(
  records: MovementComparisonRecord[],
  stimulus: SineWaveStimulusConfig,
): DtwResult {
  const targetSeries = records.map((record) =>
    recordToDegreesVector(record, "target", stimulus.amplitude),
  );
  const actualSeries = records.map((record) =>
    recordToDegreesVector(record, "actual", stimulus.amplitude),
  );

  return dynamicTimeWarping(targetSeries, actualSeries);
}
