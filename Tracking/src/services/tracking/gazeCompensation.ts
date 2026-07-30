import type { HeadPose } from "@/types/eye-tracking";

/** Raw or corrected gaze expressed in degrees (horizontal = x, vertical = y). */
export type GazeVector = {
  horizontal: number;
  vertical: number;
};

/** Head orientation components derived from the MediaPipe rotation matrix. */
export type HeadRotationVector = {
  yaw: number;
  pitch: number;
  roll: number;
};

/** Baseline captured when the user re-centers at a fixation point. */
export type GazeRecenterBaseline = {
  headRotation: HeadRotationVector;
  leftGazeOffsetDeg: GazeVector;
  rightGazeOffsetDeg: GazeVector;
  compensationOffset: GazeVector;
  capturedAt: number;
};

/** Per-frame tracking signals passed to charts and stage analytics. */
export type TrackingFrameSignals = {
  /** Target stimulus position in degrees for the plotted axis. */
  targetPath: number;
  /** Raw calibrated gaze before head-pose subtraction. */
  rawLeftEye: number;
  rawRightEye: number;
  /** Head-pose compensated ocular rotation (eye-in-orbit). */
  correctedLeftEye: number;
  correctedRightEye: number;
  /** Delta head rotation used for compensation this frame. */
  headRotation: HeadRotationVector;
};

/** Horizontal head-rotation gain applied during gaze isolation. */
export const GAIN_H = 1;

/** Vertical head-rotation gain applied during gaze isolation. */
export const GAIN_V = 1;

/** Session-scoped zero-point offset applied after head-pose isolation. */
let compensationOffset: GazeVector | null = null;

export function headPoseToRotationVector(headPose: HeadPose): HeadRotationVector {
  return {
    yaw: headPose.yaw,
    pitch: headPose.pitch,
    roll: headPose.roll,
  };
}

export function subtractHeadRotation(
  current: HeadRotationVector,
  baseline: HeadRotationVector,
): HeadRotationVector {
  return {
    yaw: current.yaw - baseline.yaw,
    pitch: current.pitch - baseline.pitch,
    roll: current.roll - baseline.roll,
  };
}

function isolateGaze(
  rawGaze: GazeVector,
  headRotationDelta: HeadRotationVector,
): GazeVector {
  return {
    horizontal: rawGaze.horizontal - headRotationDelta.yaw * GAIN_H,
    vertical: rawGaze.vertical - headRotationDelta.pitch * GAIN_V,
  };
}

export function averageGazeVectors(a: GazeVector, b: GazeVector): GazeVector {
  return {
    horizontal: (a.horizontal + b.horizontal) / 2,
    vertical: (a.vertical + b.vertical) / 2,
  };
}

export function getCompensationOffset(): GazeVector | null {
  return compensationOffset ? { ...compensationOffset } : null;
}

export function setCompensationOffset(offset: GazeVector): void {
  compensationOffset = { ...offset };
}

export function clearCompensationOffset(): void {
  compensationOffset = null;
}

/**
 * Captures the current average raw gaze and head rotation delta, stores the
 * resulting isolated gaze as the session zero-point, and anchors corrected
 * gaze to 0° at the fixation pose.
 */
export function recenterTracking(
  averageRawGaze: GazeVector,
  averageHeadRotationDelta: HeadRotationVector,
): GazeVector {
  compensationOffset = isolateGaze(averageRawGaze, averageHeadRotationDelta);

  if (typeof console !== "undefined") {
    console.log(
      `[Compensation] Baseline updated: New Offset = [${compensationOffset.horizontal}, ${compensationOffset.vertical}]`,
    );
  }

  return { ...compensationOffset };
}

/**
 * Isolates ocular rotation from head rotation and normalizes to the session
 * zero-point: (RawGaze - HeadRotationDelta) - compensationOffset
 */
export function getCorrectedGaze(
  rawGaze: GazeVector,
  headRotationDelta: HeadRotationVector,
): GazeVector {
  const isolated = isolateGaze(rawGaze, headRotationDelta);

  if (!compensationOffset) {
    return isolated;
  }

  return {
    horizontal: isolated.horizontal - compensationOffset.horizontal,
    vertical: isolated.vertical - compensationOffset.vertical,
  };
}
