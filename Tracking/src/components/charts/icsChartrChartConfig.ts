import type { ChartOptions } from "chart.js";
import type { DeviationBounds } from "@/services/processing/degreesConversion";

export const ICS_CHART_COLORS = {
  target: "#2949cc",
  leftEye: "#10a69c",
  rightEye: "#111d4d",
  saccade: "#ef4444",
  saccadeBorder: "#b91c1c",
  grid: "#d8e0f0",
  text: "#111d4d",
} as const;

export function buildIcsChartOptions(
  title: string,
  yBounds: DeviationBounds,
  maxTimeSec: number,
): ChartOptions<"line"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: ICS_CHART_COLORS.text,
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      title: {
        display: true,
        text: title,
        color: ICS_CHART_COLORS.text,
        font: { size: 13, weight: "bold" },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${value?.toFixed(2)}°`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: Math.max(5, maxTimeSec + 0.5),
        title: {
          display: true,
          text: "Time (s)",
          color: ICS_CHART_COLORS.text,
        },
        grid: { color: ICS_CHART_COLORS.grid },
        ticks: { color: ICS_CHART_COLORS.text },
      },
      y: {
        min: yBounds.min,
        max: yBounds.max,
        title: {
          display: true,
          text: "Degrees",
          color: ICS_CHART_COLORS.text,
        },
        grid: { color: ICS_CHART_COLORS.grid },
        ticks: {
          color: ICS_CHART_COLORS.text,
          callback: (value) => `${value}°`,
        },
      },
    },
  };
}
