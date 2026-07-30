import type { EyeTrackingSample } from "@/types/eye-tracking";
import { sampleElapsedSeconds } from "./chartTime";
import { LineChart } from "./LineChart";
import {
  type AnalyticsCopy,
  DEFAULT_ANALYTICS_COPY,
} from "../tracking/analyticsCopy";
import { themeDarkBlue } from "@/lib/themeColors";

type GazeStabilityChartProps = {
  samples: EyeTrackingSample[];
  className?: string;
  copy?: AnalyticsCopy;
};

export function GazeStabilityChart({
  samples,
  className,
  copy = DEFAULT_ANALYTICS_COPY,
}: GazeStabilityChartProps) {
  return (
    <LineChart
      title={copy.gazeStability}
      scrollHint={copy.scrollToView}
      className={className}
      yMin={0}
      yMax={1}
      timeSeconds={sampleElapsedSeconds(samples)}
      series={[
        {
          label: copy.stabilityIndex,
          color: themeDarkBlue(),
          values: samples.map((sample) =>
            sample.faceDetected ? sample.gazeStability : null,
          ),
        },
      ]}
    />
  );
}
