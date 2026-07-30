/** Consecutive lost frames before a segment is treated as a confirmed tracking gap. */
export const TRACKING_GAP_STREAK_THRESHOLD = 5;

/** Sentinel used in chart series when tracking is lost (never use 0). */
export const TRACKING_CHART_GAP = Number.NaN;

export function isChartTrackingValue(
  value: number | null | undefined,
): value is number {
  return value != null && Number.isFinite(value);
}

/** Coerces missing/invalid chart samples to {@link TRACKING_CHART_GAP}. */
export function toTrackingChartValue(
  value: number | null | undefined,
  trackingValid = true,
): number {
  if (!trackingValid || !isChartTrackingValue(value)) {
    return TRACKING_CHART_GAP;
  }

  return value;
}

/**
 * Prepares a chart series for rendering:
 * - invalid samples become gaps (NaN, never 0)
 * - after {@link TRACKING_GAP_STREAK_THRESHOLD} consecutive gaps, the segment
 *   stays disconnected until valid data returns
 */
export function applyTrackingGapHysteresis(
  values: Array<number | null | undefined>,
): number[] {
  const output: number[] = [];
  let consecutiveLost = 0;
  let inConfirmedGap = false;

  for (const raw of values) {
    if (isChartTrackingValue(raw)) {
      consecutiveLost = 0;
      inConfirmedGap = false;
      output.push(raw);
      continue;
    }

    consecutiveLost += 1;
    if (consecutiveLost >= TRACKING_GAP_STREAK_THRESHOLD) {
      inConfirmedGap = true;
    }

    output.push(TRACKING_CHART_GAP);
  }

  // When ending inside a confirmed gap, the next valid point (handled above)
  // starts a new connected segment via LineChart path breaking.
  void inConfirmedGap;

  return output;
}

export function sanitizeTrackingChartSeries(
  values: Array<number | null | undefined>,
): number[] {
  return applyTrackingGapHysteresis(
    values.map((value) =>
      isChartTrackingValue(value) ? value : TRACKING_CHART_GAP,
    ),
  );
}
