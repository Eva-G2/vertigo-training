import { GAIN_H, GAIN_V, type GazeVector } from "./gazeCompensation";
import type { VorHeadPoseDeg } from "./vorFrameNormalization";

/**
 * Isolates eye-in-head rotation by subtracting head movement from absolute gaze.
 * Both inputs must already be in degrees on the same axis convention.
 */
export function calculateEyeInHead(
  gaze: GazeVector,
  headPose: VorHeadPoseDeg,
): GazeVector {
  return {
    horizontal: gaze.horizontal - headPose.yawDeg * GAIN_H,
    vertical: gaze.vertical - headPose.pitchDeg * GAIN_V,
  };
}
