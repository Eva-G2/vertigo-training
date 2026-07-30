import type { EyeTrackingSample } from "@/types/eye-tracking";
import type { VerticalPursuitRecord } from "./VerticalPursuitAnalytics";

/** Fixed y-axis range for head-pose charts (degrees). */
export const HEAD_POSE_CHART_Y_RANGE = {
  min: -50,
  max: 50,
} as const;

export type HeadMovementGraphPoint = {
  elapsedSec: number;
  pitchDeg: number;
  yawDeg: number;
  /** Kalman-smoothed Nasal Root (168) head velocity magnitude (°/s). */
  headVelocityDegPerSec?: number;
  /** Kalman-smoothed mean-of-pupils eye velocity magnitude (°/s). */
  eyeVelocityDegPerSec?: number;
};

/** Clamps to the chart y-axis range only — no compression or dead zone. */
export function normalizeHeadPoseChartDeg(value: number): number {
  if (!Number.isFinite(value)) {
    return Number.NaN;
  }

  return Math.min(
    HEAD_POSE_CHART_Y_RANGE.max,
    Math.max(HEAD_POSE_CHART_Y_RANGE.min, value),
  );
}

export function pursuitRecordsToHeadMovementPoints(
  records: VerticalPursuitRecord[],
): HeadMovementGraphPoint[] {
  return records.map((record) => ({
    elapsedSec: record.elapsedSec,
    pitchDeg: normalizeHeadPoseChartDeg(record.headPitchDeg),
    yawDeg: normalizeHeadPoseChartDeg(record.headYawDeg),
    headVelocityDegPerSec: record.nasalRootHeadVelocityDegPerSec,
    eyeVelocityDegPerSec: record.pupilCenterEyeVelocityDegPerSec,
  }));
}

export function samplesToHeadMovementPoints(
  samples: EyeTrackingSample[],
): HeadMovementGraphPoint[] {
  if (samples.length === 0) {
    return [];
  }

  const startMs = samples[0]!.timestamp;

  return samples.map((sample) => ({
    elapsedSec: (sample.timestamp - startMs) / 1000,
    pitchDeg: normalizeHeadPoseChartDeg(sample.headChartPitchDeg),
    yawDeg: normalizeHeadPoseChartDeg(sample.headChartYawDeg),
    headVelocityDegPerSec: sample.nasalRootHeadVelocityDegPerSec,
    eyeVelocityDegPerSec: sample.pupilCenterEyeVelocityDegPerSec,
  }));
}

/** Parses `Stage N` from a session label such as `Stage 2 Step 1 training`. */
export function parseTrainingStageFromLabel(
  label: string | undefined,
): number | null {
  return parseTrainingStageStepFromLabel(label)?.stage ?? null;
}

/** Parses stage and step from labels such as `Stage 2 Step 1 training`. */
export function parseTrainingStageStepFromLabel(
  label: string | undefined,
): { stage: number; step: number } | null {
  if (!label) {
    return null;
  }

  const match = /Stage\s+(\d+)\s+Step\s+(\d+)/i.exec(label);
  if (!match) {
    return null;
  }

  const stage = Number(match[1]);
  const step = Number(match[2]);
  if (!Number.isFinite(stage) || !Number.isFinite(step)) {
    return null;
  }

  return { stage, step };
}

export function isStage2Step1NoddingSession(label: string | undefined): boolean {
  const parsed = parseTrainingStageStepFromLabel(label);
  return parsed?.stage === 2 && parsed.step === 1;
}

export function isStage2Step2TurningSession(label: string | undefined): boolean {
  const parsed = parseTrainingStageStepFromLabel(label);
  return parsed?.stage === 2 && parsed.step === 2;
}
