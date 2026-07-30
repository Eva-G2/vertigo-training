import type { Step } from "./types";

export const STAGE2_STEP1_VIDEO_SRC = "/videos/S2S1.mp4";
export const STAGE2_STEP2_VIDEO_SRC = "/videos/S2S2.mp4";

/** Timed fixation session while the user performs head turning (Step 2). */
export const STAGE2_SESSION_DURATION_MS = 8000;

export function isStage2TrackingStep(step: Step): boolean {
  return step === 1 || step === 2;
}

export function getStage2DemoVideoSrc(step: Step): string | undefined {
  if (step === 1) return STAGE2_STEP1_VIDEO_SRC;
  if (step === 2) return STAGE2_STEP2_VIDEO_SRC;
  return undefined;
}
