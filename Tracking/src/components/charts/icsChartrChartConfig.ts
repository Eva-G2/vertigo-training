import type { ChartOptions } from "chart.js";
import type { DeviationBounds } from "@/services/processing/degreesConversion";
import { themeBlue, themeDarkBlue } from "@/lib/themeColors";

export function getIcsChartColors() {
  return {
    target: themeBlue(),
    leftEye: "#10a69c",
    rightEye: themeDarkBlue(),
    saccade: "#ef4444",
    saccadeBorder: "#b91c1c",
    grid: "#d8e0f0",
    text: themeDarkBlue(),
  };
}

export function buildIcsChartOptions(
  title: string,
  yBounds: DeviationBounds,
  maxTimeSec: number,
): ChartOptions<"line"> {
  const colors = getIcsChartColors();

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
          color: colors.text,
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      title: {
        display: true,
        text: title,
        color: colors.text,
        font: { size: 13, weight: "bold" },
      },
    },
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: maxTimeSec,
        title: {
          display: true,
          text: "Time (s)",
          color: colors.text,
        },
        grid: { color: colors.grid },
        ticks: { color: colors.text },
      },
      y: {
        min: yBounds.min,
        max: yBounds.max,
        title: {
          display: true,
          text: "Deviation (°)",
          color: colors.text,
        },
        grid: { color: colors.grid },
        ticks: {
          color: colors.text,
        },
      },
    },
  };
}
