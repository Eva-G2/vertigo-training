import type { EyeTrackingSample } from "@/types/eye-tracking";
import { TrackingStateManager } from "@/services/tracking/TrackingStateManager";
import {
  axisCorrectedGazeDelta,
  axisHeadChartDelta,
  axisValue,
  normalizeVorFrame,
  type NormalizedVorFrame,
} from "@/services/tracking/vorFrameNormalization";

export type VorAnalysisAxis = "vertical" | "horizontal";

/** Ignore gain when head speed is below this (deg/s). */
const MIN_HEAD_VELOCITY_DEG_PER_SEC = 0.1;

/** Exponential smoothing factor for displayed VOR gain. */
const GAIN_SMOOTHING_ALPHA = 0.25;

const VOR_DEBUG_LOG_INTERVAL_MS = 500;
let lastVorDebugLogMs = 0;

function logVorDebug(payload: Record<string, number | string | null>): void {
  if (typeof console === "undefined") {
    return;
  }

  const now = performance.now();
  if (now - lastVorDebugLogMs < VOR_DEBUG_LOG_INTERVAL_MS) {
    return;
  }

  lastVorDebugLogMs = now;
  console.log("[VOR]", payload);
}

/**
 * Computes real-time VOR performance while the user fixates on a target.
 *
 * Uses head-compensated gaze slip relative to head chart motion:
 *   gain = 1 - |slip velocity| / |head velocity|
 *
 * When gaze is stabilized on the target, slip ≈ 0 and gain ≈ 1.
 */
export class GazeStabilityService {
  private active = false;
  private axis: VorAnalysisAxis = "vertical";
  private previousFrame: NormalizedVorFrame | null = null;
  private trackingLost = false;
  private vorGain: number | null = null;

  start(axis: VorAnalysisAxis = "vertical"): void {
    this.active = true;
    this.axis = axis;
    this.reset();
  }

  stop(): void {
    this.active = false;
    this.reset();
  }

  isActive(): boolean {
    return this.active;
  }

  setAxis(axis: VorAnalysisAxis): void {
    this.axis = axis;
  }

  getVorGain(): number | null {
    return this.vorGain;
  }

  reset(): void {
    this.previousFrame = null;
    this.trackingLost = false;
    this.vorGain = null;
  }

  /**
   * Updates VOR gain from a tracking sample. Returns null while tracking is
   * lost or head speed is too low so callers never emit a misleading 0.
   */
  update(sample: EyeTrackingSample): number | null {
    if (!TrackingStateManager.isActive) {
      return null;
    }

    if (!this.active) {
      return null;
    }

    const frame = normalizeVorFrame(sample);
    if (!frame) {
      this.trackingLost = true;
      return null;
    }

    if (this.trackingLost || !this.previousFrame) {
      this.trackingLost = false;
      this.previousFrame = frame;
      return null;
    }

    const deltaMs = frame.timestamp - this.previousFrame.timestamp;
    if (deltaMs <= 0) {
      return null;
    }

    const dtSec = deltaMs / 1000;
    const slipDelta = axisCorrectedGazeDelta(this.previousFrame, frame);
    const headChartDelta = axisHeadChartDelta(this.previousFrame, frame);

    const slipDeltaAxis = axisValue(slipDelta, this.axis);
    const headDeltaAxis = axisValue(headChartDelta, this.axis);

    const slipVelocity = slipDeltaAxis / dtSec;
    const headVelocity = headDeltaAxis / dtSec;

    this.previousFrame = frame;

    logVorDebug({
      axis: this.axis,
      slipVelocity,
      headVelocity,
      slipDelta: slipDeltaAxis,
      headDelta: headDeltaAxis,
      deltaMs,
      instantGain:
        Math.abs(headVelocity) >= MIN_HEAD_VELOCITY_DEG_PER_SEC
          ? computeVorGain(slipDeltaAxis, headDeltaAxis)
          : null,
    });

    if (Math.abs(headVelocity) < MIN_HEAD_VELOCITY_DEG_PER_SEC) {
      return null;
    }

    const instantGain = computeVorGain(slipDeltaAxis, headDeltaAxis);
    if (!Number.isFinite(instantGain)) {
      return null;
    }

    this.vorGain =
      this.vorGain == null
        ? instantGain
        : this.vorGain * (1 - GAIN_SMOOTHING_ALPHA) +
          instantGain * GAIN_SMOOTHING_ALPHA;

    return this.vorGain;
  }
}

/** gain = 1 when slip is zero; approaches 0 as slip matches head motion. */
export function computeVorGain(slipDelta: number, headDelta: number): number {
  const headMagnitude = Math.abs(headDelta);
  if (headMagnitude < 1e-9) {
    return Number.NaN;
  }

  const slipRatio = Math.min(1, Math.abs(slipDelta) / headMagnitude);
  return Math.max(0, 1 - slipRatio);
}
