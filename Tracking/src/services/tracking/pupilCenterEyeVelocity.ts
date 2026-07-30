import { LANDMARKS } from "@/vision/mediapipe/landmarks";
import type { MediaPipeLandmark } from "./types";
import {
  ConstantVelocityKalman1D,
  ScalarKalmanFilter,
} from "./kalmanFilter";

/** MediaPipe Face Mesh indices for the two iris / pupil centers. */
export const LEFT_PUPIL_CENTER_LANDMARK_INDEX = LANDMARKS.leftIrisCenter;
export const RIGHT_PUPIL_CENTER_LANDMARK_INDEX = LANDMARKS.rightIrisCenter;

/** @deprecated Prefer {@link LEFT_PUPIL_CENTER_LANDMARK_INDEX}. */
export const PUPIL_CENTER_LANDMARK_INDEX = LEFT_PUPIL_CENTER_LANDMARK_INDEX;

/**
 * Converts normalized Face Mesh displacement to approximate visual degrees.
 * Matches MediaPipe's default virtual-camera vertical FOV.
 */
const NORMALIZED_TO_DEG = 63;

function isFiniteLandmark(
  point: MediaPipeLandmark | undefined,
): point is MediaPipeLandmark {
  return (
    point != null &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y)
  );
}

/**
 * Mean of the left and right pupil centers. Falls back to whichever eye is
 * available when only one landmark is valid.
 */
function meanPupilCenter(
  landmarks: MediaPipeLandmark[],
): { x: number; y: number; z: number } | null {
  const left = landmarks[LEFT_PUPIL_CENTER_LANDMARK_INDEX];
  const right = landmarks[RIGHT_PUPIL_CENTER_LANDMARK_INDEX];
  const leftOk = isFiniteLandmark(left);
  const rightOk = isFiniteLandmark(right);

  if (!leftOk && !rightOk) {
    return null;
  }

  if (!leftOk) {
    return {
      x: right.x,
      y: right.y,
      z: Number.isFinite(right.z) ? right.z! : 0,
    };
  }

  if (!rightOk) {
    return {
      x: left.x,
      y: left.y,
      z: Number.isFinite(left.z) ? left.z! : 0,
    };
  }

  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
    z:
      ((Number.isFinite(left.z) ? left.z! : 0) +
        (Number.isFinite(right.z) ? right.z! : 0)) /
      2,
  };
}

/**
 * Tracks eye velocity for the VOR graph from the mean of both pupil centers.
 *
 * Pipeline (mirrors {@link NasalRootHeadVelocityTracker}):
 * 1. Mean of left (468) and right (473) iris centers
 * 2. Constant-velocity Kalman filter on that mean position (x, y, z)
 * 3. Velocity = magnitude of displacement / Δt (from filtered positions)
 * 4. Scalar Kalman smooth on the resulting speed (°/s)
 */
export class PupilCenterEyeVelocityTracker {
  private readonly xFilter = new ConstantVelocityKalman1D();
  private readonly yFilter = new ConstantVelocityKalman1D();
  private readonly zFilter = new ConstantVelocityKalman1D();
  private readonly speedFilter = new ScalarKalmanFilter(2e-2, 8e-2);
  private previousFiltered: { x: number; y: number; z: number } | null = null;
  private previousTimestampMs: number | null = null;

  reset(): void {
    this.xFilter.reset();
    this.yFilter.reset();
    this.zFilter.reset();
    this.speedFilter.reset();
    this.previousFiltered = null;
    this.previousTimestampMs = null;
  }

  /**
   * Returns Kalman-smoothed eye velocity magnitude in approx. deg/s,
   * or null when both pupils are missing / the first frame has no Δt.
   */
  update(
    landmarks: MediaPipeLandmark[] | undefined,
    timestampMs: number,
  ): number | null {
    if (!landmarks || !Number.isFinite(timestampMs)) {
      this.reset();
      return null;
    }

    const point = meanPupilCenter(landmarks);
    if (!point) {
      this.reset();
      return null;
    }

    const previousTimestamp = this.previousTimestampMs;
    const dtSec =
      previousTimestamp != null
        ? (timestampMs - previousTimestamp) / 1000
        : 0;

    if (previousTimestamp != null && dtSec <= 0) {
      return null;
    }

    const filteredX = this.xFilter.update(point.x, Math.max(dtSec, 1e-4));
    const filteredY = this.yFilter.update(point.y, Math.max(dtSec, 1e-4));
    const filteredZ = this.zFilter.update(point.z, Math.max(dtSec, 1e-4));
    const filtered = {
      x: filteredX.position,
      y: filteredY.position,
      z: filteredZ.position,
    };

    const previous = this.previousFiltered;
    this.previousFiltered = filtered;
    this.previousTimestampMs = timestampMs;

    if (previous == null || previousTimestamp == null || dtSec <= 0) {
      return null;
    }

    const dxDeg = (filtered.x - previous.x) * NORMALIZED_TO_DEG;
    const dyDeg = (filtered.y - previous.y) * NORMALIZED_TO_DEG;
    const dzDeg = (filtered.z - previous.z) * NORMALIZED_TO_DEG;
    const rawSpeedDegPerSec = Math.hypot(dxDeg, dyDeg, dzDeg) / dtSec;

    if (!Number.isFinite(rawSpeedDegPerSec)) {
      return null;
    }

    return this.speedFilter.filter(rawSpeedDegPerSec);
  }
}
