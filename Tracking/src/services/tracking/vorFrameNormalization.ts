import type { EyeTrackingSample } from "@/types/eye-tracking";
import { TRACKING_CHART_GAP } from "@/services/analytics/trackingGapPolicy";
import { averageGazeVectors, type GazeVector } from "./gazeCompensation";

/** Head pitch/yaw in degrees from camera-aligned landmark euler extraction. */
export type VorHeadPoseDeg = {
  pitchDeg: number;
  yawDeg: number;
};

/** Gaze and head pose normalized to degrees on a shared timestamp. */
export type NormalizedVorFrame = {
  timestamp: number;
  /** Binocular absolute gaze from calibrated camera coordinates (degrees). */
  absoluteGazeDeg: GazeVector;
  /** Head-pose compensated gaze anchored to the fixation target (degrees). */
  correctedGazeDeg: GazeVector;
  /** Chart head pose (landmark euler, session baseline relative, degrees). */
  headChartDeg: VorHeadPoseDeg;
};

function isFiniteHeadValue(value: number): boolean {
  return Number.isFinite(value) && value !== TRACKING_CHART_GAP;
}

function correctedGazeFromSample(
  sample: EyeTrackingSample,
): GazeVector | null {
  if (sample.leftEyeCorrected == null || sample.rightEyeCorrected == null) {
    return null;
  }

  return averageGazeVectors(sample.leftEyeCorrected, sample.rightEyeCorrected);
}

/**
 * Ensures gaze and head pose share degrees and a timestamp before VOR calculations.
 *
 * Head motion uses chart euler angles (same as Stage 2 head graphs). Gaze slip
 * uses head-compensated binocular gaze (same as tracking graphs).
 */
export function normalizeVorFrame(
  sample: EyeTrackingSample,
): NormalizedVorFrame | null {
  if (!sample.faceDetected) {
    return null;
  }

  if (sample.rawLeftGazeDeg == null || sample.rawRightGazeDeg == null) {
    return null;
  }

  const correctedGazeDeg = correctedGazeFromSample(sample);
  if (!correctedGazeDeg) {
    return null;
  }

  const headChartDeg: VorHeadPoseDeg = {
    pitchDeg: sample.headChartPitchDeg,
    yawDeg: sample.headChartYawDeg,
  };

  if (
    !isFiniteHeadValue(headChartDeg.pitchDeg) ||
    !isFiniteHeadValue(headChartDeg.yawDeg)
  ) {
    return null;
  }

  return {
    timestamp: sample.timestamp,
    absoluteGazeDeg: averageGazeVectors(
      sample.rawLeftGazeDeg,
      sample.rawRightGazeDeg,
    ),
    correctedGazeDeg,
    headChartDeg,
  };
}

export function axisHeadChartDelta(
  previous: NormalizedVorFrame,
  current: NormalizedVorFrame,
): VorHeadPoseDeg {
  return {
    pitchDeg: current.headChartDeg.pitchDeg - previous.headChartDeg.pitchDeg,
    yawDeg: current.headChartDeg.yawDeg - previous.headChartDeg.yawDeg,
  };
}

export function axisCorrectedGazeDelta(
  previous: NormalizedVorFrame,
  current: NormalizedVorFrame,
): GazeVector {
  return {
    horizontal:
      current.correctedGazeDeg.horizontal -
      previous.correctedGazeDeg.horizontal,
    vertical:
      current.correctedGazeDeg.vertical - previous.correctedGazeDeg.vertical,
  };
}

export function axisValue(
  delta: VorHeadPoseDeg | GazeVector,
  axis: "vertical" | "horizontal",
): number {
  return axis === "vertical"
    ? "pitchDeg" in delta
      ? delta.pitchDeg
      : delta.vertical
    : "pitchDeg" in delta
      ? delta.yawDeg
      : delta.horizontal;
}
