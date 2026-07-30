/** Target yaw amplitude for turning (degrees). Matches Stage 2 Step 2 exercise. */
export const HEAD_TURN_TARGET_YAW_DEG = 20;

export const HEAD_TURN_WAIT_START_MS = 1500;
export const HEAD_TURN_WAIT_END_MS = 500;
export const HEAD_TURN_CYCLES = 20;

/** Duration of each turning beep; the target holds at extremes for this long. */
export const HEAD_TURN_BEEP_DURATION_MS = 120;

/** Interpolates wait duration from slow (cycle 0) to fast (last cycle). */
export function headTurnWaitMsForCycle(cycleIndex: number): number {
  if (HEAD_TURN_CYCLES <= 1) {
    return HEAD_TURN_WAIT_END_MS;
  }

  const progress = cycleIndex / (HEAD_TURN_CYCLES - 1);
  return Math.round(
    HEAD_TURN_WAIT_START_MS +
      (HEAD_TURN_WAIT_END_MS - HEAD_TURN_WAIT_START_MS) * progress,
  );
}

export function headTurnCycleDurationMs(cycleIndex: number): number {
  return headTurnWaitMsForCycle(cycleIndex) * 2;
}

export function computeHeadTurnTotalDurationMs(
  cycles: number = HEAD_TURN_CYCLES,
): number {
  let total = 0;
  for (let cycle = 0; cycle < cycles; cycle += 1) {
    total += headTurnCycleDurationMs(cycle);
  }
  return total;
}

export const HEAD_TURN_TOTAL_MS = computeHeadTurnTotalDurationMs();

/**
 * Smooth target yaw aligned with turning beeps.
 * Beep 1 (look left) → wait → Beep 2 (look right) → wait → repeat with accelerating rhythm.
 */
export function headTurnTargetYawDegAtElapsedMs(elapsedMs: number): number {
  if (elapsedMs <= 0) {
    return 0;
  }

  let remainingMs = elapsedMs;

  for (let cycle = 0; cycle < HEAD_TURN_CYCLES; cycle += 1) {
    const waitMs = headTurnWaitMsForCycle(cycle);

    if (remainingMs < waitMs) {
      return (
        -HEAD_TURN_TARGET_YAW_DEG *
        Math.cos(Math.PI * (remainingMs / waitMs))
      );
    }
    remainingMs -= waitMs;

    if (remainingMs < waitMs) {
      return (
        -HEAD_TURN_TARGET_YAW_DEG *
        Math.cos(Math.PI * (1 + remainingMs / waitMs))
      );
    }
    remainingMs -= waitMs;
  }

  return -HEAD_TURN_TARGET_YAW_DEG;
}

export function headTurnTargetYawDegAtElapsedSec(elapsedSec: number): number {
  return headTurnTargetYawDegAtElapsedMs(elapsedSec * 1000);
}

export function buildHeadTurnYawTargetSeries(
  elapsedSecValues: number[],
): number[] {
  return elapsedSecValues.map((elapsedSec) =>
    headTurnTargetYawDegAtElapsedSec(elapsedSec),
  );
}
