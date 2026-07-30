import type { Step } from "./types";

export const STAGE3_STEP1_VIDEO_SRC = "/videos/S3S1.mp4";
export const STAGE3_STEP2_VIDEO_SRC = "/videos/S3S2.mp4";
export const STAGE3_STEP3_VIDEO_SRC = "/videos/S3S3.mp4";

export const STAGE3_STEPS: Step[] = [1, 2, 3];

export function isStage3Step(step: Step): boolean {
  return step === 1 || step === 2 || step === 3;
}

/** Stage 3 uses live Face Mesh + Pose tracking. */
export function isStage3TrackingStep(step: Step): boolean {
  return isStage3Step(step);
}

export function getStage3DemoVideoSrc(step: Step): string | undefined {
  if (step === 1) return STAGE3_STEP1_VIDEO_SRC;
  if (step === 2) return STAGE3_STEP2_VIDEO_SRC;
  if (step === 3) return STAGE3_STEP3_VIDEO_SRC;
  return undefined;
}
