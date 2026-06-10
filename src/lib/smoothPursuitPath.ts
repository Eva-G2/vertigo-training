export type SmoothPursuitChirpConfig = {
  /** Initial frequency in Hz (5 s per cycle = 0.2 Hz). */
  f0: number;
  /** Maximum frequency in Hz (0.5 s per cycle = 2 Hz). */
  fMax: number;
  /** Total number of oscillation cycles before termination. */
  totalCycles: number;
  postGoDelayMs: number;
};

export const DEFAULT_SMOOTH_PURSUIT_CHIRP: SmoothPursuitChirpConfig = {
  f0: 0.2,
  fMax: 2,
  totalCycles: 20,
  postGoDelayMs: 300,
};

export type SmoothPursuitChirpParams = {
  yCenter: number;
  amplitude: number;
  f0: number;
  k: number;
  durationSeconds: number;
};

/**
 * Derives chirp k so frequency ramps from f0 to fMax while completing
 * exactly `totalCycles` oscillations.
 *
 * Phase: 2π(f0·t + (k/2)·t²)  →  cycles(t) = f0·t + (k/2)·t²
 */
export function buildSmoothPursuitChirp(
  containerHeight: number,
  config: SmoothPursuitChirpConfig = DEFAULT_SMOOTH_PURSUIT_CHIRP,
): SmoothPursuitChirpParams {
  const { f0, fMax, totalCycles } = config;
  const k = ((fMax - f0) * (f0 + fMax)) / (2 * totalCycles);
  const durationSeconds = (fMax - f0) / k;

  return {
    yCenter: containerHeight / 2,
    amplitude: containerHeight / 2,
    f0,
    k,
    durationSeconds,
  };
}

/** Completed oscillation cycles at elapsed time t (seconds). */
export function getCompletedCycles(
  elapsedSeconds: number,
  f0: number,
  k: number,
): number {
  return f0 * elapsedSeconds + (k / 2) * elapsedSeconds * elapsedSeconds;
}

/** Instantaneous frequency in Hz at elapsed time t. */
export function getInstantaneousFrequency(
  elapsedSeconds: number,
  f0: number,
  k: number,
): number {
  return f0 + k * elapsedSeconds;
}

/**
 * Vertical chirp position mapped to [0, containerHeight]:
 * y = Y_center + A * sin(2π * (f0 * t + (k / 2) * t²))
 */
export function computeSmoothPursuitY(
  elapsedSeconds: number,
  params: SmoothPursuitChirpParams,
): number {
  const phase =
    2 *
    Math.PI *
    (params.f0 * elapsedSeconds +
      (params.k / 2) * Math.pow(elapsedSeconds, 2));

  return params.yCenter + params.amplitude * Math.sin(phase);
}
