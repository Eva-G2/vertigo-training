import type { DtwResult } from "./types";

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  const dims = Math.min(a.length, b.length);
  for (let i = 0; i < dims; i += 1) {
    const delta = a[i]! - b[i]!;
    sum += delta * delta;
  }
  return Math.sqrt(sum);
}

/**
 * Classic Dynamic Time Warping for multivariate time series.
 * Aligns two sequences of equal-dimensional points and returns total warp cost.
 */
export function dynamicTimeWarping(
  seriesA: number[][],
  seriesB: number[][],
): DtwResult {
  const n = seriesA.length;
  const m = seriesB.length;

  if (n === 0 || m === 0) {
    return { distance: Number.POSITIVE_INFINITY, path: [] };
  }

  const infinity = Number.POSITIVE_INFINITY;
  const cost: number[][] = Array.from({ length: n + 1 }, () =>
    Array<number>(m + 1).fill(infinity),
  );
  cost[0]![0] = 0;

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const local = euclideanDistance(seriesA[i - 1]!, seriesB[j - 1]!);
      cost[i]![j] =
        local +
        Math.min(cost[i - 1]![j]!, cost[i]![j - 1]!, cost[i - 1]![j - 1]!);
    }
  }

  const path: [number, number][] = [];
  let i = n;
  let j = m;

  while (i > 0 && j > 0) {
    path.push([i - 1, j - 1]);

    const candidates: [number, number, number][] = [
      [i - 1, j, cost[i - 1]![j]!],
      [i, j - 1, cost[i]![j - 1]!],
      [i - 1, j - 1, cost[i - 1]![j - 1]!],
    ];
    candidates.sort((a, b) => a[2] - b[2]);
    const [nextI, nextJ] = candidates[0]!;
    i = nextI;
    j = nextJ;
  }

  path.reverse();

  return {
    distance: cost[n]![m]!,
    path,
  };
}
