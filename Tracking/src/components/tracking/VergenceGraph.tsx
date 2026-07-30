import { useMemo } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { useEyeTracking } from "@/state";
import {
  TRACKING_GRAPH_Y_RANGE,
  vergenceRecordsToGraphPoints,
} from "./trackingGraphData";
import { type AnalyticsCopy, DEFAULT_ANALYTICS_COPY } from "./analyticsCopy";
import { themeBlue } from "@/lib/themeColors";
const DEFAULT_GREEN = "#10a69c";
const TARGET_LINE_COLOR = "#64748b";

type VergenceGraphProps = {
  className?: string;
  copy?: AnalyticsCopy;
};

export function VergenceGraph({
  className,
  copy = DEFAULT_ANALYTICS_COPY,
}: VergenceGraphProps) {
  const { state, getVerticalPursuitRecords } = useEyeTracking();
  const { calibration } = state;

  const graphPoints = useMemo(
    () => vergenceRecordsToGraphPoints(getVerticalPursuitRecords()),
    [
      getVerticalPursuitRecords,
      state.verticalPursuitDataset,
      state.verticalPursuitRecordCount,
    ],
  );

  const hasCalibration =
    calibration.isCalibrated || getVerticalPursuitRecords().length >= 2;

  if (!hasCalibration) {
    return (
      <div
        className={`rounded-2xl border-2 border-blue bg-card p-4 text-sm text-foreground/60 ${className ?? ""}`}
      >
        <h3 className="text-sm font-semibold text-dark-blue">
          {copy.vergenceTracking}
        </h3>
        <p className="mt-2">{copy.vergenceRequired}</p>
      </div>
    );
  }

  if (graphPoints.length < 2) {
    return (
      <div
        className={`rounded-2xl border-2 border-blue bg-card p-4 text-sm text-foreground/60 ${className ?? ""}`}
      >
        <h3 className="text-sm font-semibold text-dark-blue">
          {copy.vergenceTracking}
        </h3>
        <p className="mt-2">{copy.waitingVergence}</p>
      </div>
    );
  }

  const timeSeconds = graphPoints.map((point) => point.elapsedSec);

  return (
    <LineChart
      title={copy.vergenceTracking}
      scrollHint={copy.scrollToView}
      className={className}
      yMin={TRACKING_GRAPH_Y_RANGE.min}
      yMax={TRACKING_GRAPH_Y_RANGE.max}
      showZeroLine
      clipValues={false}
      timeSeconds={timeSeconds}
      yAxisLabels={{
        top: `+${TRACKING_GRAPH_Y_RANGE.max}°`,
        middle: copy.convergenceAngle,
        bottom: `-${TRACKING_GRAPH_Y_RANGE.max}°`,
      }}
      series={[
        {
          label: copy.targetPosition,
          color: TARGET_LINE_COLOR,
          values: graphPoints.map((point) => point.targetDeg),
        },
        {
          label: copy.leftEyeCorrected,
          color: themeBlue(),
          values: graphPoints.map((point) => point.correctedSignal.leftEyeDeg),
        },
        {
          label: copy.rightEyeCorrected,
          color: DEFAULT_GREEN,
          values: graphPoints.map((point) => point.correctedSignal.rightEyeDeg),
        },
      ]}
    />
  );
}
