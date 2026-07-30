import type { MediaPipeLandmark } from "./types";
import {
  ConstantVelocityKalman1D,
  ScalarKalmanFilter,
} from "./kalmanFilter";

/** MediaPipe Face Mesh index for the nasal root (bridge of the nose). */
export const NASAL_ROOT_LANDMARK_INDEX = 168;

/**
 * Converts normalized Face Mesh displacement to approximate visual degrees.
 * Matches MediaPipe's default virtual-camera vertical FOV.
 */
const NORMALIZED_TO_DEG = 63;

/**
 * Tracks head velocity for the VOR graph using Nasal Root (168) only.
 *
 * Pipeline:
 * 1. Constant-velocity Kalman filter on landmark position (x, y, z)
 * 2. Velocity = magnitude of displacement / Δt (from filtered positions)
 * 3. Scalar Kalman smooth on the resulting speed (°/s)
 */
export class NasalRootHeadVelocityTracker {
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
   * Returns Kalman-smoothed head velocity magnitude in approx. deg/s,
   * or null when the landmark is missing / the first frame has no Δt.
   */
  update(
    landmarks: MediaPipeLandmark[] | undefined,
    timestampMs: number,
  ): number | null {
    const point = landmarks?.[NASAL_ROOT_LANDMARK_INDEX];
    if (
      !point ||
      !Number.isFinite(point.x) ||
      !Number.isFinite(point.y) ||
      !Number.isFinite(timestampMs)
    ) {
      this.reset();
      return null;
    }

    const z = Number.isFinite(point.z) ? point.z! : 0;
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
    const filteredZ = this.zFilter.update(z, Math.max(dtSec, 1e-4));
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
    const rawSpeedDegPerSec =
      Math.hypot(dxDeg, dyDeg, dzDeg) / dtSec;

    if (!Number.isFinite(rawSpeedDegPerSec)) {
      return null;
    }

    return this.speedFilter.filter(rawSpeedDegPerSec);
  }
}
