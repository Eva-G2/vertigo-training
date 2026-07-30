import type { ChartJsMovementExport, MovementComparisonRecord } from "./types";
import type { SineWaveStimulusConfig } from "./types";
import { themeBlue, themeDarkBlue } from "@/lib/themeColors";

function chartColors() {
  return {
    targetX: themeBlue(),
    leftX: "#10a69c",
    rightX: themeDarkBlue(),
    targetY: themeBlue(),
    leftY: "#10a69c",
    rightY: themeDarkBlue(),
  };
}

function toDataset(
  label: string,
  records: MovementComparisonRecord[],
  pick: (record: MovementComparisonRecord) => number,
  color: string,
) {
  return {
    label,
    data: records.map((record) => ({
      x: record.timestamp,
      y: pick(record),
    })),
    borderColor: color,
    backgroundColor: color,
    pointRadius: 0,
    tension: 0.2,
  };
}

/**
 * Converts movement comparison records into a Chart.js-compatible JSON structure.
 * Uses timestamp (ms) as the x-axis for time-series line charts.
 */
export function toChartJsMovementExport(
  records: MovementComparisonRecord[],
  stimulus: SineWaveStimulusConfig,
  sessionStartedAt: number,
  sessionEndedAt: number,
): ChartJsMovementExport {
  const colors = chartColors();

  return {
    type: "line",
    data: {
      datasets: [
        toDataset("Target X", records, (r) => r.target.x, colors.targetX),
        toDataset("Left Eye X", records, (r) => r.leftEye.x, colors.leftX),
        toDataset("Right Eye X", records, (r) => r.rightEye.x, colors.rightX),
        toDataset("Target Y", records, (r) => r.target.y, colors.targetY),
        toDataset("Left Eye Y", records, (r) => r.leftEye.y, colors.leftY),
        toDataset("Right Eye Y", records, (r) => r.rightEye.y, colors.rightY),
      ],
    },
    records,
    meta: {
      sessionStartedAt,
      sessionEndedAt,
      sampleCount: records.length,
      stimulus,
    },
  };
}

export function serializeChartJsExport(exportData: ChartJsMovementExport): string {
  return JSON.stringify(exportData, null, 2);
}
