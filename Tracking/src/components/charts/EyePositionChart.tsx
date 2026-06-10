import type { EyeTrackingSample } from "@/types/eye-tracking";
import { sampleElapsedSeconds } from "./chartTime";
import { LineChart } from "./LineChart";

/** Display range for calibrated horizontal gaze (degrees). */
const CHART_RANGE_DEG = 60;

type EyePositionChartProps = {
  samples: EyeTrackingSample[];
  isCalibrated: boolean;
  className?: string;
};

function calibratedHorizontalDeg(
  sample: EyeTrackingSample,
  eye: "left" | "right",
): number {
  const offset =
    eye === "left" ? sample.leftCalibratedOffset : sample.rightCalibratedOffset;
  return offset?.horizontalDeg ?? 0;
}

export function EyePositionChart({
  samples,
  isCalibrated,
  className,
}: EyePositionChartProps) {
  const useCalibrated =
    isCalibrated &&
    samples.some(
      (sample) =>
        sample.leftCalibratedOffset !== null &&
        sample.rightCalibratedOffset !== null,
    );

  const leftValues = samples.map((sample) =>
    useCalibrated
      ? calibratedHorizontalDeg(sample, "left")
      : sample.leftEye.horizontal,
  );
  const rightValues = samples.map((sample) =>
    useCalibrated
      ? calibratedHorizontalDeg(sample, "right")
      : sample.rightEye.horizontal,
  );

  return (
    <LineChart
      title={
        useCalibrated
          ? "Eye Position (horizontal, calibrated)"
          : "Eye Position (horizontal)"
      }
      className={className}
      yMin={useCalibrated ? -CHART_RANGE_DEG : -1}
      yMax={useCalibrated ? CHART_RANGE_DEG : 1}
      showZeroLine={useCalibrated}
      clipValues={!useCalibrated}
      timeSeconds={sampleElapsedSeconds(samples)}
      yAxisLabels={
        useCalibrated
          ? {
              top: `+${CHART_RANGE_DEG}° L`,
              middle: "0 calibrated center",
              bottom: `-${CHART_RANGE_DEG}° R`,
            }
          : undefined
      }
      series={[
        {
          label: useCalibrated
            ? "Left offset from baseline"
            : "Left eye",
          color: "#2949cc",
          values: leftValues,
        },
        {
          label: useCalibrated
            ? "Right offset from baseline"
            : "Right eye",
          color: "#10a69c",
          values: rightValues,
        },
      ]}
    />
  );
}
