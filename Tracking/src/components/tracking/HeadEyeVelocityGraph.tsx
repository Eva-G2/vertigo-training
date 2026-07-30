import { useMemo } from "react";
import { LineChart } from "@/components/charts/LineChart";
import {
  buildHeadEyeVelocityPoints,
  resolveHeadEyeVelocityAxis,
  resolveHeadEyeVelocityChartYRange,
} from "@/services/analytics/headEyeVelocityChart";
import { GraphPanel } from "./GraphPanel";
import { type AnalyticsCopy, DEFAULT_ANALYTICS_COPY } from "./analyticsCopy";
import type {
  HeadEyeVelocityStreamSlice,
  HeadMovementStreamSlice,
  TrackingGraphStreamSlice,
} from "./trackingDataStream";
import { themeBlue } from "@/lib/themeColors";

const EYE_VELOCITY_COLOR = "#10a69c";

type HeadEyeVelocityGraphProps = {
  headMovement: HeadMovementStreamSlice;
  verticalEye: TrackingGraphStreamSlice;
  horizontalEye: TrackingGraphStreamSlice;
  pursuitAxis?: "vertical" | "horizontal" | "vergence";
  /** Precomputed slice; when omitted the graph derives it from the streams. */
  data?: HeadEyeVelocityStreamSlice;
  fitToWidth?: boolean;
  className?: string;
  copy?: AnalyticsCopy;
};

function formatVelocityAxisLabel(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}°/s`;
}

export function HeadEyeVelocityGraph({
  headMovement,
  verticalEye,
  horizontalEye,
  pursuitAxis,
  data,
  fitToWidth = false,
  className,
  copy = DEFAULT_ANALYTICS_COPY,
}: HeadEyeVelocityGraphProps) {
  const derivedSlice = useMemo((): HeadEyeVelocityStreamSlice => {
    const axis = resolveHeadEyeVelocityAxis({
      showNoddingTarget: headMovement.showNoddingTarget,
      showTurningTarget: headMovement.showTurningTarget,
      pursuitAxis,
    });

    const points = buildHeadEyeVelocityPoints(
      headMovement.points,
      verticalEye.graphPoints,
      horizontalEye.graphPoints,
      axis,
    );

    return {
      points,
      status:
        headMovement.status === "ready" && points.length >= 2
          ? "ready"
          : headMovement.status,
    };
  }, [
    headMovement.points,
    headMovement.showNoddingTarget,
    headMovement.showTurningTarget,
    headMovement.status,
    horizontalEye.graphPoints,
    pursuitAxis,
    verticalEye.graphPoints,
  ]);

  const { points, status } = data ?? derivedSlice;

  const yRange = useMemo(
    () =>
      resolveHeadEyeVelocityChartYRange({
        showNoddingTarget: headMovement.showNoddingTarget,
        showTurningTarget: headMovement.showTurningTarget,
      }),
    [headMovement.showNoddingTarget, headMovement.showTurningTarget],
  );

  const timeSeconds = useMemo(
    () => points.map((point) => point.elapsedSec),
    [points],
  );
  const headVelocities = useMemo(
    () => points.map((point) => point.headVelocityDegPerSec),
    [points],
  );
  const eyeVelocities = useMemo(
    () => points.map((point) => point.eyeVelocityDegPerSec),
    [points],
  );

  if (status === "no_calibration") {
    return (
      <GraphPanel title={copy.headEyeVelocity} className={className}>
        <p className="text-sm text-foreground/60">{copy.calibrationRequired}</p>
      </GraphPanel>
    );
  }

  if (status === "waiting" || points.length < 2) {
    return (
      <GraphPanel title={copy.headEyeVelocity} className={className}>
        <p className="text-sm text-foreground/60">{copy.waitingHeadPose}</p>
      </GraphPanel>
    );
  }

  return (
    <GraphPanel
      title={copy.headEyeVelocity}
      subtitle={copy.headEyeVelocitySubtitle}
      className={className}
    >
      <LineChart
        embedded
        scrollHint={copy.scrollToView}
        yMin={yRange.min}
        yMax={yRange.max}
        showZeroLine
        clipValues
        timeSeconds={timeSeconds}
        fitToWidth={fitToWidth}
        timeTickIntervalSec={1}
        yAxisLabels={{
          top: formatVelocityAxisLabel(yRange.max),
          middle: "0°/s",
          bottom: formatVelocityAxisLabel(yRange.min),
        }}
        series={[
          {
            label: copy.headVelocity,
            color: themeBlue(),
            values: headVelocities,
          },
          {
            label: copy.eyeVelocity,
            color: EYE_VELOCITY_COLOR,
            values: eyeVelocities,
          },
        ]}
      />
    </GraphPanel>
  );
}
