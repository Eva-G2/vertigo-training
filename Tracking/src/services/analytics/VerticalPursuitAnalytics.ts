import type { EyeTrackingSample } from "@/types/eye-tracking";
import { TrackingStateManager } from "@/services/tracking/TrackingStateManager";
import type {
  HeadRotationVector,
  TrackingFrameSignals,
} from "@/services/tracking/gazeCompensation";
import {
  normalizedTargetToDegrees,
  STATIC_HORIZONTAL_TARGET_DEG,
  STATIC_VERTICAL_TARGET_DEG,
  horizontalLeftEyeDegrees,
  horizontalRightEyeDegrees,
  verticalLeftEyeDegrees,
  verticalRightEyeDegrees,
  type HorizontalCalibrationParams,
  type VerticalCalibrationParams,
} from "@/services/tracking/trackingDegrees";
import { isTrackingSampleValid } from "@/services/tracking/trackingSampleValidity";
import { TRACKING_CHART_GAP } from "./trackingGapPolicy";

export type PursuitCalibrationParams = VerticalCalibrationParams &
  HorizontalCalibrationParams;

export type PursuitAxis = "vertical" | "horizontal" | "vergence";

export type VerticalPursuitRecord = {
  timestamp: number;
  elapsedSec: number;
  /** Normalized viewport target position (-1 top … 1 bottom). */
  targetY?: number;
  /** Normalized viewport target position (-1 left … 1 right). */
  targetX?: number;
  /** Vertical-axis chart signals (target + corrected gaze + head rotation). */
  vertical: TrackingFrameSignals;
  /** Horizontal-axis chart signals (target + corrected gaze + head rotation). */
  horizontal: TrackingFrameSignals;
  /** Calibrated left-eye vertical gaze in degrees (head compensated). */
  leftEyeDeg: number;
  /** Calibrated right-eye vertical gaze in degrees (head compensated). */
  rightEyeDeg: number;
  /** Vertical-axis target mapped to degrees for charting. */
  targetDeg: number;
  /** Horizontal-axis target mapped to degrees for charting. */
  targetHorizontalDeg: number;
  /** Calibrated left-eye horizontal gaze in degrees (head compensated). */
  leftEyeHorizontalDeg: number;
  /** Calibrated right-eye horizontal gaze in degrees (head compensated). */
  rightEyeHorizontalDeg: number;
  /** Head pitch delta from session baseline (degrees, nodding). */
  headPitchDeg: number;
  /** Head yaw delta from session baseline (degrees, turning). */
  headYawDeg: number;
  /**
   * Kalman-smoothed Nasal Root (168) head velocity magnitude (°/s).
   * NaN for tracking gaps.
   */
  nasalRootHeadVelocityDegPerSec: number;
  /**
   * Kalman-smoothed eye velocity magnitude (°/s) from the mean of both
   * pupil centers (468 + 473). NaN for tracking gaps.
   */
  pupilCenterEyeVelocityDegPerSec: number;
};

export type VerticalPursuitDataset = {
  records: VerticalPursuitRecord[];
  startedAt: number;
  endedAt: number;
};

/** Maps viewport pixel Y to a normalized vertical axis (-1 top, 0 center, 1 bottom). */
export function normalizeViewportY(
  pixelY: number,
  viewportHeight: number,
): number | null {
  if (!Number.isFinite(pixelY) || viewportHeight <= 0) {
    return null;
  }

  return (pixelY / viewportHeight - 0.5) * 2;
}

/** Maps viewport pixel X to a normalized horizontal axis (-1 left, 0 center, 1 right). */
export function normalizeViewportX(
  pixelX: number,
  viewportWidth: number,
): number | null {
  if (!Number.isFinite(pixelX) || viewportWidth <= 0) {
    return null;
  }

  return (pixelX / viewportWidth - 0.5) * 2;
}

function zeroHeadRotation(): HeadRotationVector {
  return { yaw: 0, pitch: 0, roll: 0 };
}

function gapFrameSignals(): TrackingFrameSignals {
  const gap = TRACKING_CHART_GAP;
  return {
    targetPath: gap,
    rawLeftEye: gap,
    rawRightEye: gap,
    correctedLeftEye: gap,
    correctedRightEye: gap,
    headRotation: zeroHeadRotation(),
  };
}

function buildTrackingFrameSignals(
  targetPath: number,
  rawLeftEye: number,
  rawRightEye: number,
  correctedLeftEye: number,
  correctedRightEye: number,
  headRotation: HeadRotationVector,
): TrackingFrameSignals {
  return {
    targetPath,
    rawLeftEye,
    rawRightEye,
    correctedLeftEye,
    correctedRightEye,
    headRotation,
  };
}

function rawVerticalFromSample(
  sample: EyeTrackingSample,
  calibration: PursuitCalibrationParams,
): {
  leftEyeDeg: number;
  rightEyeDeg: number;
} {
  return {
    leftEyeDeg:
      sample.rawLeftGazeDeg?.vertical ??
      verticalLeftEyeDegrees(sample.leftEye.center.y, calibration),
    rightEyeDeg:
      sample.rawRightGazeDeg?.vertical ??
      verticalRightEyeDegrees(sample.rightEye.center.y, calibration),
  };
}

function rawHorizontalFromSample(
  sample: EyeTrackingSample,
  calibration: PursuitCalibrationParams,
): {
  leftEyeHorizontalDeg: number;
  rightEyeHorizontalDeg: number;
} {
  return {
    leftEyeHorizontalDeg:
      sample.rawLeftGazeDeg?.horizontal ??
      horizontalLeftEyeDegrees(sample.leftEye.center.x, calibration),
    rightEyeHorizontalDeg:
      sample.rawRightGazeDeg?.horizontal ??
      horizontalRightEyeDegrees(sample.rightEye.center.x, calibration),
  };
}

function correctedVerticalFromSample(sample: EyeTrackingSample): {
  leftEyeDeg: number;
  rightEyeDeg: number;
} {
  if (sample.leftEyeCorrected == null || sample.rightEyeCorrected == null) {
    return {
      leftEyeDeg: Number.NaN,
      rightEyeDeg: Number.NaN,
    };
  }

  return {
    leftEyeDeg: sample.leftEyeCorrected.vertical,
    rightEyeDeg: sample.rightEyeCorrected.vertical,
  };
}

function correctedHorizontalFromSample(sample: EyeTrackingSample): {
  leftEyeHorizontalDeg: number;
  rightEyeHorizontalDeg: number;
} {
  if (sample.leftEyeCorrected == null || sample.rightEyeCorrected == null) {
    return {
      leftEyeHorizontalDeg: Number.NaN,
      rightEyeHorizontalDeg: Number.NaN,
    };
  }

  return {
    leftEyeHorizontalDeg: sample.leftEyeCorrected.horizontal,
    rightEyeHorizontalDeg: sample.rightEyeCorrected.horizontal,
  };
}

/**
 * Collects synchronized target/eye vertical samples while smooth pursuit is active.
 */
export class VerticalPursuitAnalytics {
  private active = false;
  private records: VerticalPursuitRecord[] = [];
  private getTarget: (() => number | null) | null = null;
  private axis: PursuitAxis = "vertical";
  private calibration: PursuitCalibrationParams | null = null;
  private startedAt = 0;
  private endedAt = 0;

  start(
    getTarget: () => number | null,
    axis: PursuitAxis = "vertical",
  ): void {
    this.active = true;
    this.records = [];
    this.getTarget = getTarget;
    this.axis = axis;
    this.startedAt = performance.now();
    this.endedAt = 0;
  }

  getAxis(): PursuitAxis {
    return this.axis;
  }

  setCalibration(params: PursuitCalibrationParams | null): void {
    this.calibration = params;
  }

  stop(): VerticalPursuitDataset {
    this.active = false;
    this.endedAt = performance.now();
    this.getTarget = null;

    return {
      records: this.records,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
    };
  }

  isActive(): boolean {
    return this.active;
  }

  private createTrackingGapRecord(
    sample: EyeTrackingSample,
  ): VerticalPursuitRecord {
    const gap = TRACKING_CHART_GAP;
    const signals = gapFrameSignals();

    return {
      timestamp: sample.timestamp,
      elapsedSec: Math.max(0, (sample.timestamp - this.startedAt) / 1000),
      vertical: signals,
      horizontal: signals,
      leftEyeDeg: gap,
      rightEyeDeg: gap,
      targetDeg: gap,
      targetHorizontalDeg: gap,
      leftEyeHorizontalDeg: gap,
      rightEyeHorizontalDeg: gap,
      headPitchDeg: gap,
      headYawDeg: gap,
      nasalRootHeadVelocityDegPerSec: gap,
      pupilCenterEyeVelocityDegPerSec: gap,
    };
  }

  record(sample: EyeTrackingSample): VerticalPursuitRecord | null {
    if (!TrackingStateManager.isActive) {
      return null;
    }

    if (!this.active || !this.calibration) {
      return null;
    }

    if (!isTrackingSampleValid(sample)) {
      const gapEntry = this.createTrackingGapRecord(sample);
      this.records.push(gapEntry);
      return gapEntry;
    }

    const targetNormalized = this.getTarget?.();
    if (targetNormalized == null || !Number.isFinite(targetNormalized)) {
      return null;
    }

    const rawVertical = rawVerticalFromSample(sample, this.calibration);
    const rawHorizontal = rawHorizontalFromSample(sample, this.calibration);
    const { leftEyeDeg, rightEyeDeg } = correctedVerticalFromSample(sample);
    const { leftEyeHorizontalDeg, rightEyeHorizontalDeg } =
      correctedHorizontalFromSample(sample);
    const headRotation = sample.headRotationDelta ?? zeroHeadRotation();

    const headPitchDeg = sample.headChartPitchDeg;
    const headYawDeg = sample.headChartYawDeg;
    const nasalRootHeadVelocityDegPerSec =
      sample.nasalRootHeadVelocityDegPerSec;
    const pupilCenterEyeVelocityDegPerSec =
      sample.pupilCenterEyeVelocityDegPerSec;

    const base = {
      timestamp: sample.timestamp,
      elapsedSec: Math.max(0, (sample.timestamp - this.startedAt) / 1000),
      leftEyeDeg,
      rightEyeDeg,
      leftEyeHorizontalDeg,
      rightEyeHorizontalDeg,
      headPitchDeg,
      headYawDeg,
      nasalRootHeadVelocityDegPerSec,
      pupilCenterEyeVelocityDegPerSec,
    };

    const entry: VerticalPursuitRecord =
      this.axis === "vergence"
        ? {
            ...base,
            targetDeg: STATIC_VERTICAL_TARGET_DEG,
            targetHorizontalDeg: STATIC_HORIZONTAL_TARGET_DEG,
            vertical: buildTrackingFrameSignals(
              STATIC_VERTICAL_TARGET_DEG,
              rawVertical.leftEyeDeg,
              rawVertical.rightEyeDeg,
              leftEyeDeg,
              rightEyeDeg,
              headRotation,
            ),
            horizontal: buildTrackingFrameSignals(
              STATIC_HORIZONTAL_TARGET_DEG,
              rawHorizontal.leftEyeHorizontalDeg,
              rawHorizontal.rightEyeHorizontalDeg,
              leftEyeHorizontalDeg,
              rightEyeHorizontalDeg,
              headRotation,
            ),
          }
        : this.axis === "horizontal"
          ? {
              ...base,
              targetX: targetNormalized,
              targetDeg: STATIC_VERTICAL_TARGET_DEG,
              targetHorizontalDeg: normalizedTargetToDegrees(targetNormalized),
              vertical: buildTrackingFrameSignals(
                STATIC_VERTICAL_TARGET_DEG,
                rawVertical.leftEyeDeg,
                rawVertical.rightEyeDeg,
                leftEyeDeg,
                rightEyeDeg,
                headRotation,
              ),
              horizontal: buildTrackingFrameSignals(
                normalizedTargetToDegrees(targetNormalized),
                rawHorizontal.leftEyeHorizontalDeg,
                rawHorizontal.rightEyeHorizontalDeg,
                leftEyeHorizontalDeg,
                rightEyeHorizontalDeg,
                headRotation,
              ),
            }
          : {
              ...base,
              targetY: targetNormalized,
              targetDeg: normalizedTargetToDegrees(targetNormalized),
              targetHorizontalDeg: STATIC_HORIZONTAL_TARGET_DEG,
              vertical: buildTrackingFrameSignals(
                normalizedTargetToDegrees(targetNormalized),
                rawVertical.leftEyeDeg,
                rawVertical.rightEyeDeg,
                leftEyeDeg,
                rightEyeDeg,
                headRotation,
              ),
              horizontal: buildTrackingFrameSignals(
                STATIC_HORIZONTAL_TARGET_DEG,
                rawHorizontal.leftEyeHorizontalDeg,
                rawHorizontal.rightEyeHorizontalDeg,
                leftEyeHorizontalDeg,
                rightEyeHorizontalDeg,
                headRotation,
              ),
            };
    this.records.push(entry);
    return entry;
  }

  getRecords(): VerticalPursuitRecord[] {
    return this.records;
  }
}
