import {
  HEAD_NOD_CYCLES,
  HEAD_NOD_FIRST_BEEP_DELAY_MS,
  HEAD_NOD_BEEP_DURATION_MS,
  headNodWaitMsForCycle,
} from "./headNodPacingChart";

const CHIN_FALLBACK_OFFSET = 0.14;

export type HeadNodGuideBounds = {
  eyeLevelY: number;
  topY: number;
  bottomY: number;
};

export function computeCalibrationEyeLevelY(
  leftBaseline: { y: number } | null | undefined,
  rightBaseline: { y: number } | null | undefined,
): number | null {
  if (leftBaseline == null || rightBaseline == null) {
    return null;
  }

  return (leftBaseline.y + rightBaseline.y) / 2;
}

export function resolveHeadNodGuideBounds(
  leftBaseline: { y: number } | null | undefined,
  rightBaseline: { y: number } | null | undefined,
  chinNormalizedY: number | null | undefined,
): HeadNodGuideBounds | null {
  const eyeLevelY = computeCalibrationEyeLevelY(leftBaseline, rightBaseline);
  if (eyeLevelY == null) {
    return null;
  }

  const rawChinY =
    chinNormalizedY != null && Number.isFinite(chinNormalizedY)
      ? chinNormalizedY
      : eyeLevelY + CHIN_FALLBACK_OFFSET;
  const bottomY = Math.max(rawChinY, eyeLevelY + 0.02);
  const amplitude = bottomY - eyeLevelY;

  if (amplitude <= 0) {
    return null;
  }

  return {
    eyeLevelY,
    topY: eyeLevelY - amplitude,
    bottomY,
  };
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function halfLegY(
  elapsedInHalfMs: number,
  fromY: number,
  toY: number,
  waitMs: number,
): number {
  const travelMs = Math.max(waitMs - HEAD_NOD_BEEP_DURATION_MS, 1);

  if (elapsedInHalfMs < HEAD_NOD_BEEP_DURATION_MS) {
    return fromY;
  }

  if (elapsedInHalfMs < waitMs) {
    const travelElapsed = elapsedInHalfMs - HEAD_NOD_BEEP_DURATION_MS;
    return lerp(fromY, toY, travelElapsed / travelMs);
  }

  return toY;
}

/**
 * Linear guide motion synced to nodding beeps: chin-level travel mirrored above
 * eye level, pausing at each extreme for the beep duration.
 */
export function headNodGuideNormalizedYAtElapsedMs(
  elapsedMs: number,
  bounds: HeadNodGuideBounds,
): number {
  const { eyeLevelY, topY, bottomY } = bounds;

  if (elapsedMs <= 0) {
    return eyeLevelY;
  }

  const leadTravelMs = Math.max(
    HEAD_NOD_FIRST_BEEP_DELAY_MS - HEAD_NOD_BEEP_DURATION_MS,
    1,
  );

  if (elapsedMs < leadTravelMs) {
    return lerp(eyeLevelY, topY, elapsedMs / leadTravelMs);
  }

  if (elapsedMs < HEAD_NOD_FIRST_BEEP_DELAY_MS) {
    return topY;
  }

  let remainingMs = elapsedMs - HEAD_NOD_FIRST_BEEP_DELAY_MS;

  for (let cycle = 0; cycle < HEAD_NOD_CYCLES; cycle += 1) {
    const waitMs = headNodWaitMsForCycle(cycle);

    if (remainingMs < waitMs) {
      return halfLegY(remainingMs, topY, bottomY, waitMs);
    }
    remainingMs -= waitMs;

    if (remainingMs < waitMs) {
      return halfLegY(remainingMs, bottomY, topY, waitMs);
    }
    remainingMs -= waitMs;
  }

  return topY;
}
