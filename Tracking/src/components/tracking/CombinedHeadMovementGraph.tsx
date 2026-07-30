import { useMemo } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { HEAD_POSE_CHART_Y_RANGE } from "@/services/analytics/headPoseChart";
import { buildHeadNodPitchTargetSeries } from "@/services/analytics/headNodPacingChart";
import { buildHeadTurnYawTargetSeries } from "@/services/analytics/headTurnPacingChart";
import { GraphPanel } from "./GraphPanel";
import { HeadEyeVelocityGraph } from "./HeadEyeVelocityGraph";
import { type AnalyticsCopy, DEFAULT_ANALYTICS_COPY } from "./analyticsCopy";
import type {
  HeadEyeVelocityStreamSlice,
  HeadMovementStreamSlice,
  TrackingGraphStreamSlice,
} from "./trackingDataStream";

const PITCH_COLOR = "#e67e22";
const YAW_COLOR = "#8e44ad";
const TARGET_LINE_COLOR = "#64748b";

type CombinedHeadMovementGraphProps = {
  data: HeadMovementStreamSlice;
  verticalEye?: TrackingGraphStreamSlice;
  horizontalEye?: TrackingGraphStreamSlice;
  headEyeVelocity?: HeadEyeVelocityStreamSlice;
  pursuitAxis?: "vertical" | "horizontal" | "vergence";
  fitToWidth?: boolean;
  className?: string;
  copy?: AnalyticsCopy;
};

type HeadMovementAxis = "pitch" | "yaw";

type HeadMovementAxisPanelProps = {
  axis: HeadMovementAxis;
  status: HeadMovementStreamSlice["status"];
  timeSeconds: number[];
  values: number[];
  showTarget: boolean;
  targetValues: number[];
  copy: AnalyticsCopy;
  fitToWidth: boolean;
  className?: string;
};

function formatAxisLabel(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}°`;
}

function HeadMovementAxisPanel({
  axis,
  status,
  timeSeconds,
  values,
  showTarget,
  targetValues,
  copy,
  fitToWidth,
  className,
}: HeadMovementAxisPanelProps) {
  const title =
    axis === "pitch" ? copy.headPitchMovement : copy.headYawMovement;
  const seriesLabel =
    axis === "pitch" ? copy.headPitchDegrees : copy.headYawDegrees;
  const seriesColor = axis === "pitch" ? PITCH_COLOR : YAW_COLOR;

  if (status === "no_calibration") {
    return (
      <GraphPanel title={title} className={className}>
        <p className="text-sm text-foreground/60">{copy.calibrationRequired}</p>
      </GraphPanel>
    );
  }

  if (status === "waiting") {
    return (
      <GraphPanel title={title} className={className}>
        <p className="text-sm text-foreground/60">{copy.waitingHeadPose}</p>
      </GraphPanel>
    );
  }

  return (
    <GraphPanel
      title={title}
      subtitle={copy.headMovementSubtitle}
      className={className}
    >
      <LineChart
        embedded
        scrollHint={copy.scrollToView}
        yMin={HEAD_POSE_CHART_Y_RANGE.min}
        yMax={HEAD_POSE_CHART_Y_RANGE.max}
        showZeroLine
        clipValues
        timeSeconds={timeSeconds}
        fitToWidth={fitToWidth}
        timeTickIntervalSec={1}
        yAxisLabels={{
          top: formatAxisLabel(HEAD_POSE_CHART_Y_RANGE.max),
          middle: "0°",
          bottom: formatAxisLabel(HEAD_POSE_CHART_Y_RANGE.min),
        }}
        series={[
          ...(showTarget
            ? [
                {
                  label: copy.targetPath,
                  color: TARGET_LINE_COLOR,
                  values: targetValues,
                },
              ]
            : []),
          {
            label: seriesLabel,
            color: seriesColor,
            values,
          },
        ]}
      />
    </GraphPanel>
  );
}

export function CombinedHeadMovementGraph({
  data,
  verticalEye,
  horizontalEye,
  headEyeVelocity,
  pursuitAxis,
  fitToWidth = false,
  className,
  copy = DEFAULT_ANALYTICS_COPY,
}: CombinedHeadMovementGraphProps) {
  const { points, status, showNoddingTarget, showTurningTarget } = data;

  const timeSeconds = useMemo(
    () => points.map((point) => point.elapsedSec),
    [points],
  );
  const pitchValues = useMemo(
    () => points.map((point) => point.pitchDeg),
    [points],
  );
  const yawValues = useMemo(
    () => points.map((point) => point.yawDeg),
    [points],
  );
  const pitchTargetValues = useMemo(
    () =>
      showNoddingTarget ? buildHeadNodPitchTargetSeries(timeSeconds) : [],
    [showNoddingTarget, timeSeconds],
  );
  const yawTargetValues = useMemo(
    () =>
      showTurningTarget ? buildHeadTurnYawTargetSeries(timeSeconds) : [],
    [showTurningTarget, timeSeconds],
  );

  return (
    <>
      <HeadMovementAxisPanel
        axis="pitch"
        status={status}
        timeSeconds={timeSeconds}
        values={pitchValues}
        showTarget={showNoddingTarget}
        targetValues={pitchTargetValues}
        copy={copy}
        fitToWidth={fitToWidth}
        className={className}
      />
      <HeadMovementAxisPanel
        axis="yaw"
        status={status}
        timeSeconds={timeSeconds}
        values={yawValues}
        showTarget={showTurningTarget}
        targetValues={yawTargetValues}
        copy={copy}
        fitToWidth={fitToWidth}
      />
      {verticalEye && horizontalEye ? (
        <HeadEyeVelocityGraph
          headMovement={data}
          verticalEye={verticalEye}
          horizontalEye={horizontalEye}
          pursuitAxis={pursuitAxis}
          data={headEyeVelocity}
          copy={copy}
          fitToWidth={fitToWidth}
        />
      ) : null}
    </>
  );
}
