import { MAX_DEVIATION_DEGREES } from "@/services/processing/degreesConversion";

export type AxisCalibration = {
  /** Center coordinate (Cy for vertical, Cx for horizontal). */
  center: number;
  /**
   * Pixel span per degree of gaze.
   * Degrees = (measured - center) / gainFactor
   */
  gainFactor: number;
};

export type VerticalCalibrationParams = {
  kLY: number;
  kRY: number;
  leftBaseline: { x: number; y: number };
  rightBaseline: { x: number; y: number };
};

export type HorizontalCalibrationParams = {
  kL: number;
  kR: number;
  leftBaseline: { x: number; y: number };
  rightBaseline: { x: number; y: number };
};

export function gainFactorFromK(k: number): number {
  if (!Number.isFinite(k) || Math.abs(k) < 1e-9) {
    return 0;
  }
  return 1 / k;
}

/** Converts a raw measured coordinate to degrees using center and gain factor. */
export function measuredToDegrees(
  measured: number,
  calibration: AxisCalibration,
): number {
  if (!Number.isFinite(measured) || calibration.gainFactor === 0) {
    return 0;
  }

  return (measured - calibration.center) / calibration.gainFactor;
}

export function verticalLeftEyeDegrees(
  leftY: number,
  params: VerticalCalibrationParams,
): number {
  return measuredToDegrees(leftY, {
    center: params.leftBaseline.y,
    gainFactor: gainFactorFromK(params.kLY),
  });
}

export function verticalRightEyeDegrees(
  rightY: number,
  params: VerticalCalibrationParams,
): number {
  return measuredToDegrees(rightY, {
    center: params.rightBaseline.y,
    gainFactor: gainFactorFromK(params.kRY),
  });
}

export function verticalEyeDegrees(
  leftY: number,
  rightY: number,
  params: VerticalCalibrationParams,
): number {
  const leftDeg = verticalLeftEyeDegrees(leftY, params);
  const rightDeg = verticalRightEyeDegrees(rightY, params);

  return (leftDeg + rightDeg) / 2;
}

export function horizontalLeftEyeDegrees(
  leftX: number,
  params: HorizontalCalibrationParams,
): number {
  return measuredToDegrees(leftX, {
    center: params.leftBaseline.x,
    gainFactor: gainFactorFromK(params.kL),
  });
}

export function horizontalRightEyeDegrees(
  rightX: number,
  params: HorizontalCalibrationParams,
): number {
  return measuredToDegrees(rightX, {
    center: params.rightBaseline.x,
    gainFactor: gainFactorFromK(params.kR),
  });
}

export function horizontalEyeDegrees(
  leftX: number,
  rightX: number,
  params: HorizontalCalibrationParams,
): number {
  const leftDeg = horizontalLeftEyeDegrees(leftX, params);
  const rightDeg = horizontalRightEyeDegrees(rightX, params);

  return (leftDeg + rightDeg) / 2;
}

/** Horizontal target reference at calibrated screen center (0° deviation). */
export const STATIC_HORIZONTAL_TARGET_DEG = 0;

/** Vertical target reference at calibrated screen center (0° deviation). */
export const STATIC_VERTICAL_TARGET_DEG = 0;

/** Maps normalized pursuit target position (-1…1) to chart degrees (±30°). */
export function normalizedTargetToDegrees(normalized: number): number {
  return normalized * MAX_DEVIATION_DEGREES;
}

export { MAX_DEVIATION_DEGREES as TRACKING_GRAPH_RANGE_DEG };
