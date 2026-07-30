import type { MovementComparisonRecord, SineWaveStimulusConfig } from "./types";

/** Maximum vestibular deviation shown on ICS-style charts (degrees). */
export const MAX_DEVIATION_DEGREES = 30;

export function normalizedToDegrees(
  value: number,
  stimulusAmplitude: number,
): number {
  if (stimulusAmplitude <= 0) return 0;
  return (value / stimulusAmplitude) * MAX_DEVIATION_DEGREES;
}

export type DeviationBounds = {
  min: number;
  max: number;
};

/**
 * Computes a shared Y-axis range so horizontal and vertical charts
 * scale identically and remain clinically comparable.
 */
export function computeSharedDeviationBounds(
  records: MovementComparisonRecord[],
  stimulus: SineWaveStimulusConfig,
): DeviationBounds {
  const values: number[] = [];

  for (const record of records) {
    values.push(
      normalizedToDegrees(record.target.x, stimulus.amplitude),
      normalizedToDegrees(record.target.y, stimulus.amplitude),
      normalizedToDegrees(record.leftEye.x, stimulus.amplitude),
      normalizedToDegrees(record.leftEye.y, stimulus.amplitude),
      normalizedToDegrees(record.rightEye.x, stimulus.amplitude),
      normalizedToDegrees(record.rightEye.y, stimulus.amplitude),
    );

    if (record.correctedLeftEye) {
      values.push(record.correctedLeftEye.x, record.correctedLeftEye.y);
    }
    if (record.correctedRightEye) {
      values.push(record.correctedRightEye.x, record.correctedRightEye.y);
    }
  }

  const stimulusPeak = normalizedToDegrees(
    stimulus.amplitude,
    stimulus.amplitude,
  );
  const maxAbs = Math.max(
    stimulusPeak * 1.2,
    ...values.map((value) => Math.abs(value)),
    5,
  );

  return { min: -maxAbs, max: maxAbs };
}

export function elapsedSeconds(elapsedMs: number): number {
  return elapsedMs / 1000;
}
