import type { Step } from "./types";
import { getStage2DemoVideoSrc } from "./stage2Steps";
import { getStage3DemoVideoSrc } from "./stage3Steps";

export const STAGE1_STEP3_VIDEO_SRC = "/videos/S1S3(finger).mp4";

export function isStage1TrackingStep(step: Step): boolean {
  return step === 1 || step === 2 || step === 3;
}

export function getStage1DemoVideoSrc(step: Step): string | undefined {
  if (step === 1) return "/videos/S1S1(vertical).mp4";
  if (step === 2) return "/videos/S1S2(horizontal).mp4";
  if (step === 3) return STAGE1_STEP3_VIDEO_SRC;
  return undefined;
}

export function getDemoVideoSrc(stage: number, step: Step): string | undefined {
  if (stage === 1) return getStage1DemoVideoSrc(step);
  if (stage === 2) return getStage2DemoVideoSrc(step);
  if (stage === 3) return getStage3DemoVideoSrc(step);
  return undefined;
}
