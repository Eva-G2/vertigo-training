import type { EyeTrackingSample } from "@/types/eye-tracking";

/** Elapsed seconds from the first sample timestamp. */
export function sampleElapsedSeconds(samples: EyeTrackingSample[]): number[] {
  if (samples.length === 0) {
    return [];
  }

  const startMs = samples[0]!.timestamp;
  return samples.map((sample) => (sample.timestamp - startMs) / 1000);
}

export function chooseTimeTickInterval(durationSec: number): number {
  if (durationSec <= 10) return 1;
  if (durationSec <= 30) return 2;
  if (durationSec <= 60) return 5;
  if (durationSec <= 180) return 10;
  if (durationSec <= 600) return 30;
  return 60;
}

export function formatTimeLabel(seconds: number): string {
  return Number.isInteger(seconds) ? `${seconds}s` : `${seconds.toFixed(1)}s`;
}

export function timeToX(
  seconds: number,
  timeSeconds: number[],
  paddingLeft: number,
  pixelsPerSample: number,
): number {
  if (timeSeconds.length === 0) {
    return paddingLeft;
  }

  if (seconds <= timeSeconds[0]!) {
    return paddingLeft;
  }

  const lastIndex = timeSeconds.length - 1;
  if (seconds >= timeSeconds[lastIndex]!) {
    return paddingLeft + lastIndex * pixelsPerSample;
  }

  for (let index = 0; index < lastIndex; index += 1) {
    const start = timeSeconds[index]!;
    const end = timeSeconds[index + 1]!;
    if (seconds >= start && seconds <= end) {
      const fraction = (seconds - start) / Math.max(end - start, 0.001);
      return paddingLeft + (index + fraction) * pixelsPerSample;
    }
  }

  return paddingLeft;
}
