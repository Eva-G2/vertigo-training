import {
  WAIST_TURN_BEEP_DURATION_MS,
  WAIST_TURN_CYCLE_MS,
  WAIST_TURN_WAIT_MS,
} from "@/lib/pacingMetronome";
import {
  HEAD_TURN_GUIDE_LEFT_X,
  HEAD_TURN_GUIDE_RIGHT_X,
} from "./headTurnGuideGeometry";

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function holdThenTravel(
  elapsedMs: number,
  fromX: number,
  toX: number,
): number {
  if (elapsedMs <= WAIST_TURN_BEEP_DURATION_MS) {
    return fromX;
  }

  const travelMs = WAIST_TURN_WAIT_MS - WAIST_TURN_BEEP_DURATION_MS;
  const progress = Math.min(
    1,
    (elapsedMs - WAIST_TURN_BEEP_DURATION_MS) / travelMs,
  );
  return lerp(fromX, toX, progress);
}

/** Green guide motion synchronized with the fixed Stage 3 Step 3 audio cues. */
export function waistTurnGuideNormalizedXAtElapsedMs(
  elapsedMs: number,
): number {
  const elapsedInCycle = Math.max(0, elapsedMs) % WAIST_TURN_CYCLE_MS;

  if (elapsedInCycle < WAIST_TURN_WAIT_MS) {
    return holdThenTravel(
      elapsedInCycle,
      HEAD_TURN_GUIDE_LEFT_X,
      HEAD_TURN_GUIDE_RIGHT_X,
    );
  }

  return holdThenTravel(
    elapsedInCycle - WAIST_TURN_WAIT_MS,
    HEAD_TURN_GUIDE_RIGHT_X,
    HEAD_TURN_GUIDE_LEFT_X,
  );
}
