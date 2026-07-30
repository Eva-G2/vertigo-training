import {
  buildSmoothPursuitChirp,
  DEFAULT_SMOOTH_PURSUIT_CHIRP,
  getCompletedCycles,
  type SmoothPursuitChirpParams,
} from "./smoothPursuitPath";

export const VERGENCE_SCALE = {
  min: 0.5,
  max: 2.0,
} as const;

export function buildVergenceChirp(
  viewportHeight: number = typeof window !== "undefined"
    ? window.innerHeight
    : 800,
): SmoothPursuitChirpParams {
  return buildSmoothPursuitChirp(viewportHeight);
}

/** Oscillates marker scale between 0.5 (far) and 2.0 (near) using chirp timing. */
export function computeVergenceMarkerScale(
  elapsedSeconds: number,
  f0: number,
  k: number,
): number {
  const phase =
    2 *
    Math.PI *
    (f0 * elapsedSeconds + (k / 2) * elapsedSeconds * elapsedSeconds);
  const mid = (VERGENCE_SCALE.min + VERGENCE_SCALE.max) / 2;
  const amplitude = (VERGENCE_SCALE.max - VERGENCE_SCALE.min) / 2;

  return mid + amplitude * Math.sin(phase);
}

export function getVergenceCompletedCycles(
  elapsedSeconds: number,
  params: SmoothPursuitChirpParams,
): number {
  return getCompletedCycles(elapsedSeconds, params.f0, params.k);
}

export { DEFAULT_SMOOTH_PURSUIT_CHIRP };
