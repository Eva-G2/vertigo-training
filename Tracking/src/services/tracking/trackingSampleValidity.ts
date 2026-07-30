import type { EyeTrackingSample } from "@/types/eye-tracking";
import { TRACKING_CHART_GAP } from "@/services/analytics/trackingGapPolicy";

/** Face mesh landmarks present for this frame. */
export function isTrackingSampleValid(sample: EyeTrackingSample): boolean {
  return sample.faceDetected;
}

export function toChartNumeric(
  value: number | null | undefined,
  trackingValid: boolean,
): number {
  if (!trackingValid || value == null || !Number.isFinite(value)) {
    return TRACKING_CHART_GAP;
  }

  return value;
}
