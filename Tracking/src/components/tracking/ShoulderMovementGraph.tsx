import { useMemo } from "react";
import { LineChart } from "@/components/charts/LineChart";
import {
  LEFT_SHOULDER_COLOR,
  RIGHT_SHOULDER_COLOR,
  SHOULDER_MOVEMENT_CHART_Y_RANGE,
  type ShoulderMovementGraphPoint,
} from "@/services/analytics/shoulderMovementChart";
import { GraphPanel } from "./GraphPanel";
import { type AnalyticsCopy, DEFAULT_ANALYTICS_COPY } from "./analyticsCopy";
import type { TrackingGraphStatus } from "./trackingDataStream";

export type ShoulderMovementStreamSlice = {
  points: ShoulderMovementGraphPoint[];
  status: TrackingGraphStatus;
  /** Stage 3 shoulder prompt times, relative to recording start. */
  liftCueTimesSec?: number[];
};

type ShoulderMovementGraphProps = {
  data: ShoulderMovementStreamSlice;
  fitToWidth?: boolean;
  className?: string;
  copy?: AnalyticsCopy;
};

type ShoulderAxis = "vertical" | "horizontal";

function formatAxisLabel(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

function ShoulderAxisPanel({
  axis,
  status,
  timeSeconds,
  leftValues,
  rightValues,
  verticalMarkersSec,
  copy,
  fitToWidth,
  className,
}: {
  axis: ShoulderAxis;
  status: TrackingGraphStatus;
  timeSeconds: number[];
  leftValues: number[];
  rightValues: number[];
  verticalMarkersSec?: number[];
  copy: AnalyticsCopy;
  fitToWidth: boolean;
  className?: string;
}) {
  const title =
    axis === "vertical"
      ? copy.shoulderVerticalMovement
      : copy.shoulderHorizontalMovement;

  if (status === "waiting") {
    return (
      <GraphPanel title={title} className={className}>
        <p className="text-sm text-foreground/60">
          {copy.waitingShoulderMovement}
        </p>
      </GraphPanel>
    );
  }

  if (status !== "ready" || timeSeconds.length < 2) {
    return null;
  }

  return (
    <GraphPanel
      title={title}
      subtitle={copy.shoulderMovementSubtitle}
      className={className}
    >
      <LineChart
        embedded
        scrollHint={copy.scrollToView}
        yMin={SHOULDER_MOVEMENT_CHART_Y_RANGE.min}
        yMax={SHOULDER_MOVEMENT_CHART_Y_RANGE.max}
        showZeroLine
        clipValues
        timeSeconds={timeSeconds}
        fitToWidth={fitToWidth}
        timeTickIntervalSec={1}
        verticalMarkersSec={verticalMarkersSec}
        yAxisLabels={{
          top: formatAxisLabel(SHOULDER_MOVEMENT_CHART_Y_RANGE.max),
          middle: "0",
          bottom: formatAxisLabel(SHOULDER_MOVEMENT_CHART_Y_RANGE.min),
        }}
        series={[
          {
            label: copy.leftShoulder,
            color: LEFT_SHOULDER_COLOR,
            values: leftValues,
          },
          {
            label: copy.rightShoulder,
            color: RIGHT_SHOULDER_COLOR,
            values: rightValues,
          },
        ]}
      />
    </GraphPanel>
  );
}

/**
 * Stage 3 analytics: vertical and horizontal shoulder motion for both
 * shoulders (left = green, right = blue), replacing head-rotation graphs.
 */
export function ShoulderMovementGraph({
  data,
  fitToWidth = false,
  className,
  copy = DEFAULT_ANALYTICS_COPY,
}: ShoulderMovementGraphProps) {
  const { points, status, liftCueTimesSec } = data;

  const timeSeconds = useMemo(
    () => points.map((point) => point.elapsedSec),
    [points],
  );
  const leftVertical = useMemo(
    () => points.map((point) => point.leftVertical),
    [points],
  );
  const rightVertical = useMemo(
    () => points.map((point) => point.rightVertical),
    [points],
  );
  const leftHorizontal = useMemo(
    () => points.map((point) => point.leftHorizontal),
    [points],
  );
  const rightHorizontal = useMemo(
    () => points.map((point) => point.rightHorizontal),
    [points],
  );

  return (
    <>
      <ShoulderAxisPanel
        axis="vertical"
        status={status}
        timeSeconds={timeSeconds}
        leftValues={leftVertical}
        rightValues={rightVertical}
        verticalMarkersSec={liftCueTimesSec}
        copy={copy}
        fitToWidth={fitToWidth}
        className={className}
      />
      <ShoulderAxisPanel
        axis="horizontal"
        status={status}
        timeSeconds={timeSeconds}
        leftValues={leftHorizontal}
        rightValues={rightHorizontal}
        copy={copy}
        fitToWidth={fitToWidth}
      />
    </>
  );
}
