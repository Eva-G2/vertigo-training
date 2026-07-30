import type { GazeVector } from "./gazeCompensation";
import type { VorHeadPoseDeg } from "./vorFrameNormalization";

/** Per-axis scale mapping chart head degrees to gaze degrees. */
export type VorHeadScale = {
  pitch: number;
  yaw: number;
};

export const DEFAULT_VOR_HEAD_SCALE: VorHeadScale = {
  pitch: 1,
  yaw: 1,
};

/** Minimum per-frame chart delta (degrees) before updating scale. */
const MIN_CHART_DELTA_DEG = 0.05;

/** EMA factor for dynamic head scale estimation. */
const HEAD_SCALE_ALPHA = 0.2;

const HEAD_SCALE_MIN = 0.25;
const HEAD_SCALE_MAX = 40;

function clampScale(value: number): number {
  return Math.min(HEAD_SCALE_MAX, Math.max(HEAD_SCALE_MIN, value));
}

function emaScale(previous: number, next: number): number {
  return clampScale(previous * (1 - HEAD_SCALE_ALPHA) + next * HEAD_SCALE_ALPHA);
}

/**
 * Isolates eye-in-head rotation using chart head angles scaled to gaze units.
 */
export function calculateScaledEyeInHead(
  gaze: GazeVector,
  headPose: VorHeadPoseDeg,
  scale: VorHeadScale,
): GazeVector {
  return {
    horizontal: gaze.horizontal - headPose.yawDeg * scale.yaw,
    vertical: gaze.vertical - headPose.pitchDeg * scale.pitch,
  };
}

/**
 * Estimates gaze-to-chart scale from per-frame raw gaze and chart head deltas.
 * When the eye is fixed in the head, |rawGazeDelta| ≈ scale × |headChartDelta|.
 */
export function updateVorHeadScale(
  scale: VorHeadScale,
  rawGazeDelta: GazeVector,
  headChartDelta: VorHeadPoseDeg,
): VorHeadScale {
  let pitch = scale.pitch;
  let yaw = scale.yaw;

  if (Math.abs(headChartDelta.pitchDeg) >= MIN_CHART_DELTA_DEG) {
    const ratio =
      Math.abs(rawGazeDelta.vertical) / Math.abs(headChartDelta.pitchDeg);
    if (Number.isFinite(ratio) && ratio > 0) {
      pitch = emaScale(pitch, ratio);
    }
  }

  if (Math.abs(headChartDelta.yawDeg) >= MIN_CHART_DELTA_DEG) {
    const ratio =
      Math.abs(rawGazeDelta.horizontal) / Math.abs(headChartDelta.yawDeg);
    if (Number.isFinite(ratio) && ratio > 0) {
      yaw = emaScale(yaw, ratio);
    }
  }

  return { pitch, yaw };
}

/** Applies axis scale to a chart head delta (degrees → gaze-comparable degrees). */
export function scaleHeadChartDelta(
  delta: VorHeadPoseDeg,
  scale: VorHeadScale,
): VorHeadPoseDeg {
  return {
    pitchDeg: delta.pitchDeg * scale.pitch,
    yawDeg: delta.yawDeg * scale.yaw,
  };
}
