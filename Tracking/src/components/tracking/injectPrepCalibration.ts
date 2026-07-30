import type { TrackingService } from "@/services/tracking";

export type PrepCalibrationPayload = {
  kL: number;
  kR: number;
  kLY: number;
  kRY: number;
  leftBaseline?: { x: number; y: number } | null;
  rightBaseline?: { x: number; y: number } | null;
  faceTopNormalizedY?: number | null;
  chinNormalizedY?: number | null;
};

/**
 * Injects gain values from the Stage 1 Prep context into the active
 * tracking service without running the on-page calibration routine.
 */
export function injectPrepCalibration(
  trackingService: TrackingService,
  calibration: PrepCalibrationPayload,
): void {
  trackingService.injectPrepCalibration({
    kL: calibration.kL,
    kR: calibration.kR,
    kLY: calibration.kLY,
    kRY: calibration.kRY,
    leftBaseline: calibration.leftBaseline ?? undefined,
    rightBaseline: calibration.rightBaseline ?? undefined,
    faceTopNormalizedY: calibration.faceTopNormalizedY ?? undefined,
    chinNormalizedY: calibration.chinNormalizedY ?? undefined,
  });
}
