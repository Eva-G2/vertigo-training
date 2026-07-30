"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart } from "@/components/charts/LineChart";
import {
  CombinedHeadMovementGraph,
  HeadEyeVelocityGraph,
  ShoulderMovementGraph,
  type HeadMovementStreamSlice,
  type ShoulderMovementStreamSlice,
} from "@/components/tracking";
import {
  buildHeadEyeVelocityPoints,
  resolveHeadEyeVelocityAxis,
} from "@/services/analytics/headEyeVelocityChart";
import {
  HORIZONTAL_TRACKING_GRAPH_Y_RANGE,
  splitGraphStreams,
  VERTICAL_TRACKING_GRAPH_Y_RANGE,
} from "@/components/tracking/trackingGraphData";
import type { AnalyticsCopy } from "@/components/tracking/analyticsCopy";
import type { StepAnalysisGraphDatasets } from "@/lib/types";
import { themeBlue } from "@/lib/themeColors";

const DEFAULT_GREEN = "#10a69c";
const TARGET_LINE_COLOR = "#64748b";
const LINE_CHART_HORIZONTAL_PADDING = 108;

type StepAnalysisGraphsProps = {
  graphDatasets: StepAnalysisGraphDatasets;
  copy: AnalyticsCopy;
  headMovement?: HeadMovementStreamSlice;
  shoulderMovement?: ShoulderMovementStreamSlice;
  exerciseMode?: "vertical" | "horizontal" | "vergence";
  /** When false, vertical/horizontal eye movement charts are omitted. */
  showEyeMovement?: boolean;
  /** Fits complete graph histories into each panel for static exports. */
  fitToWidth?: boolean;
  className?: string;
};

function formatAxisLabel(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}°`;
}

function HistoricalTrackingGraph({
  axis,
  graphDatasets,
  copy,
  fitToWidth,
}: {
  axis: "vertical" | "horizontal";
  graphDatasets: StepAnalysisGraphDatasets;
  copy: AnalyticsCopy;
  fitToWidth: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const graphPoints =
    axis === "vertical" ? graphDatasets.vertical : graphDatasets.horizontal;
  const streams = useMemo(() => splitGraphStreams(graphPoints), [graphPoints]);
  const leftValues = useMemo(
    () => streams.correctedSignal.map((signal) => signal.leftEyeDeg),
    [streams.correctedSignal],
  );
  const rightValues = useMemo(
    () => streams.correctedSignal.map((signal) => signal.rightEyeDeg),
    [streams.correctedSignal],
  );
  const timeSeconds = useMemo(() => [...streams.elapsedSec], [streams.elapsedSec]);
  const targetDeg = useMemo(() => [...streams.targetDeg], [streams.targetDeg]);

  const sampleCount = timeSeconds.length;
  const pixelsPerSample =
    containerWidth > 0 && sampleCount > 1
      ? Math.max(
          1,
          (containerWidth - LINE_CHART_HORIZONTAL_PADDING) / (sampleCount - 1),
        )
      : 4;

  const yRange =
    axis === "vertical"
      ? VERTICAL_TRACKING_GRAPH_Y_RANGE
      : HORIZONTAL_TRACKING_GRAPH_Y_RANGE;

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const axisTitle =
    axis === "vertical"
      ? copy.verticalEyeMovement
      : copy.horizontalEyeMovement;

  if (graphPoints.length < 2) {
    return null;
  }

  return (
    <div ref={wrapperRef} className="w-full">
      <h3 className="mb-2 text-sm font-semibold text-dark-blue">{axisTitle}</h3>
      <LineChart
        title={copy.correctedTitle}
        scrollHint={copy.scrollToView}
        yMin={yRange.min}
        yMax={yRange.max}
        showZeroLine
        clipValues={false}
        timeSeconds={timeSeconds}
        pixelsPerSample={pixelsPerSample}
        fitToWidth={fitToWidth}
        yAxisLabels={{
          top: formatAxisLabel(yRange.max),
          middle: "0°",
          bottom: formatAxisLabel(yRange.min),
        }}
        series={[
          {
            label: copy.targetPath,
            color: TARGET_LINE_COLOR,
            values: targetDeg,
          },
          {
            label: copy.leftEyeCorrected,
            color: themeBlue(),
            values: leftValues,
          },
          {
            label: copy.rightEyeCorrected,
            color: DEFAULT_GREEN,
            values: rightValues,
          },
        ]}
      />
    </div>
  );
}

export function StepAnalysisGraphs({
  graphDatasets,
  copy,
  headMovement,
  shoulderMovement,
  exerciseMode,
  showEyeMovement = true,
  fitToWidth = false,
  className = "",
}: StepAnalysisGraphsProps) {
  const hasVertical = showEyeMovement && graphDatasets.vertical.length >= 2;
  const hasHorizontal = showEyeMovement && graphDatasets.horizontal.length >= 2;
  const hasShoulderMovement =
    shoulderMovement != null &&
    shoulderMovement.status === "ready" &&
    shoulderMovement.points.length >= 2;
  const hasHeadMovement =
    !hasShoulderMovement &&
    headMovement != null &&
    headMovement.status === "ready" &&
    headMovement.points.length >= 2;

  const velocityPoints = useMemo(() => {
    if (!hasHeadMovement || !headMovement) {
      return [];
    }

    const axis = resolveHeadEyeVelocityAxis({
      showNoddingTarget: headMovement.showNoddingTarget,
      showTurningTarget: headMovement.showTurningTarget,
      pursuitAxis: exerciseMode,
    });

    return buildHeadEyeVelocityPoints(
      headMovement.points,
      graphDatasets.vertical,
      graphDatasets.horizontal,
      axis,
    );
  }, [
    exerciseMode,
    graphDatasets.horizontal,
    graphDatasets.vertical,
    hasHeadMovement,
    headMovement,
  ]);

  const hasHeadEyeVelocity = velocityPoints.length >= 2;

  if (
    !hasVertical &&
    !hasHorizontal &&
    !hasHeadMovement &&
    !hasHeadEyeVelocity &&
    !hasShoulderMovement
  ) {
    return null;
  }

  return (
    <div className={`flex w-full flex-col gap-6 ${className}`}>
      {hasVertical ? (
        <HistoricalTrackingGraph
          axis="vertical"
          graphDatasets={graphDatasets}
          copy={copy}
          fitToWidth={fitToWidth}
        />
      ) : null}
      {hasHorizontal ? (
        <HistoricalTrackingGraph
          axis="horizontal"
          graphDatasets={graphDatasets}
          copy={copy}
          fitToWidth={fitToWidth}
        />
      ) : null}
      {hasShoulderMovement && shoulderMovement ? (
        <ShoulderMovementGraph
          data={shoulderMovement}
          copy={copy}
          fitToWidth={fitToWidth}
        />
      ) : null}
      {hasHeadMovement && headMovement ? (
        <>
          <CombinedHeadMovementGraph
            data={headMovement}
            copy={copy}
            fitToWidth={fitToWidth}
          />
          {hasHeadEyeVelocity ? (
            <HeadEyeVelocityGraph
              headMovement={headMovement}
              verticalEye={{
                graphPoints: graphDatasets.vertical,
                status: "ready",
              }}
              horizontalEye={{
                graphPoints: graphDatasets.horizontal,
                status: "ready",
              }}
              pursuitAxis={exerciseMode}
              data={{
                points: velocityPoints,
                status: "ready",
              }}
              copy={copy}
              fitToWidth={fitToWidth}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
