import {
  HEAD_TURN_BEEP_DURATION_MS,
  HEAD_TURN_CYCLES,
  headTurnWaitMsForCycle,
} from "./headTurnPacingChart";

/** Horizontal travel span as a fraction of the video width. */
export const HEAD_TURN_GUIDE_SPAN = 0.8;

export const HEAD_TURN_GUIDE_CENTER_X = 0.5;

export const HEAD_TURN_GUIDE_LEFT_X = (1 - HEAD_TURN_GUIDE_SPAN) / 2;

export const HEAD_TURN_GUIDE_RIGHT_X = 1 - HEAD_TURN_GUIDE_LEFT_X;

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

/** Hold at the cue extreme for the beep, then travel at constant velocity. */
function halfLegPauseThenTravel(
  elapsedInHalfMs: number,
  pauseAtX: number,
  travelToX: number,
  waitMs: number,
): number {
  const travelMs = Math.max(waitMs - HEAD_TURN_BEEP_DURATION_MS, 1);

  if (elapsedInHalfMs < HEAD_TURN_BEEP_DURATION_MS) {
    return pauseAtX;
  }

  const travelElapsed = elapsedInHalfMs - HEAD_TURN_BEEP_DURATION_MS;
  if (travelElapsed < travelMs) {
    return lerp(pauseAtX, travelToX, travelElapsed / travelMs);
  }

  return travelToX;
}

/** Travel at constant velocity, then hold at the cue extreme for the beep. */
function halfLegTravelThenPause(
  elapsedInHalfMs: number,
  travelFromX: number,
  pauseAtX: number,
  waitMs: number,
): number {
  const travelMs = Math.max(waitMs - HEAD_TURN_BEEP_DURATION_MS, 1);

  if (elapsedInHalfMs < travelMs) {
    return lerp(travelFromX, pauseAtX, elapsedInHalfMs / travelMs);
  }

  return pauseAtX;
}

function cueHalf(
  elapsedInHalfMs: number,
  startX: number,
  cueX: number,
  awayX: number,
  waitMs: number,
): number {
  if (startX === cueX) {
    return halfLegPauseThenTravel(elapsedInHalfMs, cueX, awayX, waitMs);
  }

  return halfLegTravelThenPause(elapsedInHalfMs, startX, cueX, waitMs);
}

function cueHalfEndX(startX: number, cueX: number, awayX: number): number {
  return startX === cueX ? awayX : cueX;
}

/**
 * Linear guide motion synced to turning beeps.
 * Pauses at left/right for the beep duration, then travels at constant velocity.
 */
export function headTurnGuideNormalizedXAtElapsedMs(elapsedMs: number): number {
  const centerX = HEAD_TURN_GUIDE_CENTER_X;
  const leftX = HEAD_TURN_GUIDE_LEFT_X;
  const rightX = HEAD_TURN_GUIDE_RIGHT_X;

  if (elapsedMs <= 0) {
    return centerX;
  }

  let remainingMs = elapsedMs;
  let halfStartX = centerX;

  for (let cycle = 0; cycle < HEAD_TURN_CYCLES; cycle += 1) {
    const waitMs = headTurnWaitMsForCycle(cycle);

    if (remainingMs < waitMs) {
      return cueHalf(remainingMs, halfStartX, leftX, rightX, waitMs);
    }
    remainingMs -= waitMs;
    halfStartX = cueHalfEndX(halfStartX, leftX, rightX);

    if (remainingMs < waitMs) {
      return cueHalf(remainingMs, halfStartX, rightX, leftX, waitMs);
    }
    remainingMs -= waitMs;
    halfStartX = cueHalfEndX(halfStartX, rightX, leftX);
  }

  return leftX;
}
