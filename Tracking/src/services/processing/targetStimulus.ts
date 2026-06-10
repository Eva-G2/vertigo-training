import type { Point2D } from "@/types/eye-tracking";
import type { SineWaveStimulusConfig } from "./types";

export const DEFAULT_SINE_STIMULUS: SineWaveStimulusConfig = {
  amplitude: 0.4,
  frequencyHz: 0.5,
  phaseRadians: 0,
  baseline: 0,
  oscillationAxis: "y",
};

/**
 * Returns the target stimulus position for a sine-wave pursuit path
 * at the given elapsed time.
 */
export function getSineWaveTargetPosition(
  elapsedMs: number,
  config: SineWaveStimulusConfig = DEFAULT_SINE_STIMULUS,
): Point2D {
  const t = elapsedMs / 1000;
  const oscillation =
    config.amplitude *
    Math.sin(2 * Math.PI * config.frequencyHz * t + config.phaseRadians);

  if (config.oscillationAxis === "y") {
    return { x: config.baseline, y: oscillation };
  }

  return { x: oscillation, y: config.baseline };
}
