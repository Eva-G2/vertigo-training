/** Target pitch amplitude for nodding (degrees). Matches Stage 2 Step 1 exercise. */
export const HEAD_NOD_TARGET_PITCH_DEG = 20;

export const HEAD_NOD_WAIT_START_MS = 1500;
export const HEAD_NOD_WAIT_END_MS = 500;
export const HEAD_NOD_CYCLES = 20;

/** Delay from recording start (when "Go" disappears) until the first high-pitch beep. */
export const HEAD_NOD_FIRST_BEEP_DELAY_MS = 750;

/** Duration of each nodding beep; the guide holds at extremes for this long. */
export const HEAD_NOD_BEEP_DURATION_MS = 120;

/** Interpolates wait duration from slow (cycle 0) to fast (last cycle). */
export function headNodWaitMsForCycle(cycleIndex: number): number {
  if (HEAD_NOD_CYCLES <= 1) {
    return HEAD_NOD_WAIT_END_MS;
  }

  const progress = cycleIndex / (HEAD_NOD_CYCLES - 1);
  return Math.round(
    HEAD_NOD_WAIT_START_MS +
      (HEAD_NOD_WAIT_END_MS - HEAD_NOD_WAIT_START_MS) * progress,
  );
}

export function headNodCycleDurationMs(cycleIndex: number): number {
  return headNodWaitMsForCycle(cycleIndex) * 2;
}

export function computeHeadNodTotalDurationMs(
  cycles: number = HEAD_NOD_CYCLES,
): number {
  let total = HEAD_NOD_FIRST_BEEP_DELAY_MS;
  for (let cycle = 0; cycle < cycles; cycle += 1) {
    total += headNodCycleDurationMs(cycle);
  }
  return total;
}

export const HEAD_NOD_TOTAL_MS = computeHeadNodTotalDurationMs();

/**
 * Smooth target pitch aligned with nodding beeps.
 * Starts at 0°, rises to +20° at the first beep, then oscillates ±20° with accelerating rhythm.
 */
export function headNodTargetPitchDegAtElapsedMs(elapsedMs: number): number {
  if (elapsedMs <= 0) {
    return 0;
  }

  if (elapsedMs < HEAD_NOD_FIRST_BEEP_DELAY_MS) {
    const progress = elapsedMs / HEAD_NOD_FIRST_BEEP_DELAY_MS;
    return (
      HEAD_NOD_TARGET_PITCH_DEG * Math.sin((Math.PI / 2) * progress)
    );
  }

  let remainingMs = elapsedMs - HEAD_NOD_FIRST_BEEP_DELAY_MS;

  for (let cycle = 0; cycle < HEAD_NOD_CYCLES; cycle += 1) {
    const waitMs = headNodWaitMsForCycle(cycle);

    if (remainingMs < waitMs) {
      return (
        HEAD_NOD_TARGET_PITCH_DEG *
        Math.cos(Math.PI * (remainingMs / waitMs))
      );
    }
    remainingMs -= waitMs;

    if (remainingMs < waitMs) {
      return (
        HEAD_NOD_TARGET_PITCH_DEG *
        Math.cos(Math.PI * (1 + remainingMs / waitMs))
      );
    }
    remainingMs -= waitMs;
  }

  return -HEAD_NOD_TARGET_PITCH_DEG;
}

export function headNodTargetPitchDegAtElapsedSec(elapsedSec: number): number {
  return headNodTargetPitchDegAtElapsedMs(elapsedSec * 1000);
}

export function buildHeadNodPitchTargetSeries(
  elapsedSecValues: number[],
): number[] {
  return elapsedSecValues.map((elapsedSec) =>
    headNodTargetPitchDegAtElapsedSec(elapsedSec),
  );
}
