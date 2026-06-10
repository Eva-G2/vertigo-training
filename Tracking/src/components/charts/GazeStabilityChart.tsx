import type { EyeTrackingSample } from "@/types/eye-tracking";
import { sampleElapsedSeconds } from "./chartTime";
import { LineChart } from "./LineChart";

type GazeStabilityChartProps = {
  samples: EyeTrackingSample[];
  className?: string;
};

export function GazeStabilityChart({
  samples,
  className,
}: GazeStabilityChartProps) {
  return (
    <LineChart
      title="Gaze Stability"
      className={className}
      yMin={0}
      yMax={1}
      timeSeconds={sampleElapsedSeconds(samples)}
      series={[
        {
          label: "Stability index",
          color: "#111d4d",
          values: samples.map((sample) => sample.gazeStability),
        },
      ]}
    />
  );
}
