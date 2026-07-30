import { useMemo } from "react";
import { LineChart } from "@/components/charts/LineChart";
import {
  HEAD_POSE_CHART_Y_RANGE,
  isStage2Step1NoddingSession,
  isStage2Step2TurningSession,
  pursuitRecordsToHeadMovementPoints,
  samplesToHeadMovementPoints,
} from "@/services/analytics/headPoseChart";
import { buildHeadNodPitchTargetSeries } from "@/services/analytics/headNodPacingChart";
import { buildHeadTurnYawTargetSeries } from "@/services/analytics/headTurnPacingChart";
import { useEyeTracking } from "@/state";
import { type AnalyticsCopy, DEFAULT_ANALYTICS_COPY } from "./analyticsCopy";

export type HeadMovementGraphAxis = "pitch" | "yaw";

type HeadMovementGraphProps = {
  axis: HeadMovementGraphAxis;
  className?: string;
  copy?: AnalyticsCopy;
};

const PITCH_COLOR = "#e67e22";
const YAW_COLOR = "#8e44ad";
const TARGET_LINE_COLOR = "#64748b";

function formatAxisLabel(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}°`;
}

export function HeadMovementGraph({
  axis,
  className,
  copy = DEFAULT_ANALYTICS_COPY,
}: HeadMovementGraphProps) {
  const { state, getVerticalPursuitRecords } = useEyeTracking();
  const { calibration, samples, session } = state;

  const points = useMemo(() => {
    const pursuitRecords = getVerticalPursuitRecords();
    if (pursuitRecords.length >= 2) {
      return pursuitRecordsToHeadMovementPoints(pursuitRecords);
    }

    if (samples.length >= 2) {
      return samplesToHeadMovementPoints(samples);
    }

    return [];
  }, [
    getVerticalPursuitRecords,
    samples,
    state.verticalPursuitRecordCount,
    state.verticalPursuitDataset,
  ]);

  const timeSeconds = useMemo(
    () => points.map((point) => point.elapsedSec),
    [points],
  );
  const values = useMemo(
    () =>
      points.map((point) => (axis === "pitch" ? point.pitchDeg : point.yawDeg)),
    [axis, points],
  );

  const title =
    axis === "pitch" ? copy.headPitchMovement : copy.headYawMovement;
  const seriesLabel =
    axis === "pitch" ? copy.headPitchDegrees : copy.headYawDegrees;
  const seriesColor = axis === "pitch" ? PITCH_COLOR : YAW_COLOR;
  const showNoddingTarget =
    axis === "pitch" && isStage2Step1NoddingSession(session?.label);
  const showTurningTarget =
    axis === "yaw" && isStage2Step2TurningSession(session?.label);
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
  const targetValues = axis === "pitch" ? pitchTargetValues : yawTargetValues;
  const showTarget = showNoddingTarget || showTurningTarget;

  const hasCalibration =
    calibration.isCalibrated || getVerticalPursuitRecords().length >= 2;

  if (!hasCalibration) {
    return (
      <div className={`text-sm text-foreground/60 ${className ?? ""}`}>
        <h3 className="text-sm font-semibold text-dark-blue">{title}</h3>
        <p className="mt-2">{copy.calibrationRequired}</p>
      </div>
    );
  }

  if (points.length < 2) {
    return (
      <div className={`text-sm text-foreground/60 ${className ?? ""}`}>
        <h3 className="text-sm font-semibold text-dark-blue">{title}</h3>
        <p className="mt-2">{copy.waitingHeadPose}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className ?? ""}`}>
      <div>
        <h3 className="text-sm font-semibold text-dark-blue">{title}</h3>
        <p className="mt-1 text-xs text-foreground/60">
          {copy.headMovementSubtitle}
        </p>
      </div>

      <LineChart
        title={title}
        scrollHint={copy.scrollToView}
        yMin={HEAD_POSE_CHART_Y_RANGE.min}
        yMax={HEAD_POSE_CHART_Y_RANGE.max}
        showZeroLine
        clipValues
        timeSeconds={timeSeconds}
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
    </div>
  );
}
