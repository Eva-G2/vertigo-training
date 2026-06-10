import type { EyeTrackingSample } from "@/types/eye-tracking";
import { sampleElapsedSeconds } from "./chartTime";
import { LineChart } from "./LineChart";

type HeadTiltChartProps = {
  samples: EyeTrackingSample[];
  className?: string;
};

export function HeadTiltChart({ samples, className }: HeadTiltChartProps) {
  return (
    <LineChart
      title="Head Tilt (roll)"
      className={className}
      yMin={-30}
      yMax={30}
      timeSeconds={sampleElapsedSeconds(samples)}
      series={[
        {
          label: "Roll (degrees)",
          color: "#2949cc",
          values: samples.map((sample) => sample.headPose.roll),
        },
      ]}
    />
  );
}
