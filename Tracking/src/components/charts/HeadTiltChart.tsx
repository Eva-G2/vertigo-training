import type { EyeTrackingSample } from "@/types/eye-tracking";
import { sampleElapsedSeconds } from "./chartTime";
import { LineChart } from "./LineChart";
import {
  type AnalyticsCopy,
  DEFAULT_ANALYTICS_COPY,
} from "../tracking/analyticsCopy";
import { themeBlue } from "@/lib/themeColors";

type HeadTiltChartProps = {
  samples: EyeTrackingSample[];
  className?: string;
  copy?: AnalyticsCopy;
};

export function HeadTiltChart({
  samples,
  className,
  copy = DEFAULT_ANALYTICS_COPY,
}: HeadTiltChartProps) {
  return (
    <LineChart
      title={copy.headTilt}
      scrollHint={copy.scrollToView}
      className={className}
      yMin={-30}
      yMax={30}
      timeSeconds={sampleElapsedSeconds(samples)}
      series={[
        {
          label: copy.rollDegrees,
          color: themeBlue(),
          values: samples.map((sample) =>
            sample.faceDetected ? sample.headPose.roll : null,
          ),
        },
      ]}
    />
  );
}
