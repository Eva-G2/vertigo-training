import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { useEyeTracking } from "@/state";
import { DEFAULT_SINE_STIMULUS } from "@/services/processing";
import {
  buildTrackingGraphDatasets,
  splitGraphStreams,
  type TrackingExerciseMode,
  type TrackingGraphAxis,
} from "./trackingGraphData";
import { GraphPanel } from "./GraphPanel";
import { type AnalyticsCopy, DEFAULT_ANALYTICS_COPY } from "./analyticsCopy";
import type { TrackingGraphStreamSlice } from "./trackingDataStream";
import { themeBlue } from "@/lib/themeColors";

export type { TrackingGraphAxis, TrackingExerciseMode };

type TrackingGraphProps = {
  axis: TrackingGraphAxis;
  /** Shared stream slice; when omitted the graph builds its own snapshot. */
  data?: TrackingGraphStreamSlice;
  /** Which pursuit axis is being tested; controls target vs companion chart mapping. */
  exerciseMode?: TrackingExerciseMode;
  className?: string;
  copy?: AnalyticsCopy;
};

const DEFAULT_GREEN = "#10a69c";
const TARGET_LINE_COLOR = "#64748b";

/** Smallest half-range (±°) the y-axis is allowed to contract to. */
const MIN_HALF_RANGE_DEG = 30;
/** Fraction of the data span added as headroom above/below the signal. */
const Y_RANGE_PADDING_RATIO = 0.1;
/** Per-frame easing factor applied only while the axis is contracting. */
const Y_RANGE_CONTRACT_EASE = 0.06;
/** Stop animating once both bounds are within this many degrees of target. */
const Y_RANGE_SETTLE_EPS = 0.15;

type YRange = { min: number; max: number };

function computeTargetRange(values: number[]): YRange {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }

  if (min === Number.POSITIVE_INFINITY || max === Number.NEGATIVE_INFINITY) {
    return { min: -MIN_HALF_RANGE_DEG, max: MIN_HALF_RANGE_DEG };
  }

  const span = Math.max(max - min, 0.001);
  const pad = span * Y_RANGE_PADDING_RATIO;

  return {
    min: Math.min(min - pad, -MIN_HALF_RANGE_DEG),
    max: Math.max(max + pad, MIN_HALF_RANGE_DEG),
  };
}

function useSmoothYRange(values: number[]): YRange {
  const target = useMemo(() => computeTargetRange(values), [values]);
  const [range, setRange] = useState<YRange>(target);
  const rangeRef = useRef<YRange>(target);
  const targetRef = useRef<YRange>(target);
  const frameRef = useRef<number | null>(null);
  const targetMin = target.min;
  const targetMax = target.max;

  useEffect(() => {
    targetRef.current = target;

    const step = () => {
      const cur = rangeRef.current;
      const tgt = targetRef.current;

      const nextMin =
        tgt.min < cur.min
          ? tgt.min
          : cur.min + (tgt.min - cur.min) * Y_RANGE_CONTRACT_EASE;
      const nextMax =
        tgt.max > cur.max
          ? tgt.max
          : cur.max + (tgt.max - cur.max) * Y_RANGE_CONTRACT_EASE;

      if (
        Math.abs(nextMin - cur.min) < Y_RANGE_SETTLE_EPS &&
        Math.abs(nextMax - cur.max) < Y_RANGE_SETTLE_EPS
      ) {
        frameRef.current = null;
        return;
      }

      const next = { min: nextMin, max: nextMax };
      rangeRef.current = next;
      setRange(next);
      frameRef.current = requestAnimationFrame(step);
    };

    if (frameRef.current == null) {
      frameRef.current = requestAnimationFrame(step);
    }

    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [targetMin, targetMax]);

  return {
    min: Math.min(range.min, target.min),
    max: Math.max(range.max, target.max),
  };
}

function formatAxisLabel(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}°`;
}

type GraphSource = "corrected" | "raw";

type SourceCopy = {
  other: string;
  subtitle: string;
  leftLabel: string;
  rightLabel: string;
};

function buildSourceCopy(copy: AnalyticsCopy): Record<GraphSource, SourceCopy> {
  return {
    corrected: {
      other: copy.sourceRaw,
      subtitle: copy.correctedSubtitle,
      leftLabel: copy.leftEyeCorrected,
      rightLabel: copy.rightEyeCorrected,
    },
    raw: {
      other: copy.sourceIsolated,
      subtitle: copy.rawSubtitle,
      leftLabel: copy.leftEyeRaw,
      rightLabel: copy.rightEyeRaw,
    },
  };
}

function useStandaloneStreamSlice(
  axis: TrackingGraphAxis,
  exerciseMode: TrackingExerciseMode,
): TrackingGraphStreamSlice {
  const {
    state,
    getCalibrationFactors,
    getMovementRecords,
    getVerticalPursuitRecords,
  } = useEyeTracking();
  const { calibration, samples } = state;

  return useMemo(() => {
    const factors = getCalibrationFactors();
    const pursuitRecords = getVerticalPursuitRecords();
    const movementRecords = getMovementRecords();

    const datasets = buildTrackingGraphDatasets({
      exerciseMode,
      pursuitRecords,
      movementRecords,
      samples,
      verticalCalibration: factors
        ? {
            kLY: factors.kLY,
            kRY: factors.kRY,
            leftBaseline: factors.leftBaseline,
            rightBaseline: factors.rightBaseline,
          }
        : null,
      horizontalCalibration: factors
        ? {
            kL: factors.kL,
            kR: factors.kR,
            leftBaseline: factors.leftBaseline,
            rightBaseline: factors.rightBaseline,
          }
        : null,
      stimulus: DEFAULT_SINE_STIMULUS,
    });

    const graphPoints =
      axis === "vertical" ? datasets.vertical : datasets.horizontal;
    const hasCalibration =
      calibration.isCalibrated ||
      pursuitRecords.length >= 2 ||
      movementRecords.length >= 2;

    let status: TrackingGraphStreamSlice["status"] = "ready";
    if (!hasCalibration) {
      status = "no_calibration";
    } else if (graphPoints.length < 2) {
      status = "waiting";
    }

    return { graphPoints, status };
  }, [
    axis,
    calibration.isCalibrated,
    exerciseMode,
    getCalibrationFactors,
    getMovementRecords,
    getVerticalPursuitRecords,
    samples,
    state.movementRecordCount,
    state.verticalPursuitDataset,
    state.verticalPursuitRecordCount,
  ]);
}

export function TrackingGraph({
  axis,
  data,
  exerciseMode = "vertical",
  className,
  copy = DEFAULT_ANALYTICS_COPY,
}: TrackingGraphProps) {
  const standaloneSlice = useStandaloneStreamSlice(axis, exerciseMode);
  const { graphPoints, status } = data ?? standaloneSlice;

  const streams = useMemo(
    () => splitGraphStreams(graphPoints),
    [graphPoints],
  );

  const rawSignal = useMemo(
    () => streams.rawSignal.map((signal) => ({ ...signal })),
    [streams.rawSignal],
  );
  const correctedSignal = useMemo(
    () => streams.correctedSignal.map((signal) => ({ ...signal })),
    [streams.correctedSignal],
  );
  const timeSeconds = useMemo(
    () => [...streams.elapsedSec],
    [streams.elapsedSec],
  );
  const targetDeg = useMemo(() => [...streams.targetDeg], [streams.targetDeg]);

  const [activeSource, setActiveSource] = useState<GraphSource>("corrected");
  const sourceCopyByKey = useMemo(() => buildSourceCopy(copy), [copy]);
  const sourceCopy = sourceCopyByKey[activeSource];

  const activeSignal = activeSource === "corrected" ? correctedSignal : rawSignal;
  const leftValues = useMemo(
    () => activeSignal.map((signal) => signal.leftEyeDeg),
    [activeSignal],
  );
  const rightValues = useMemo(
    () => activeSignal.map((signal) => signal.rightEyeDeg),
    [activeSignal],
  );

  const extentValues = useMemo(
    () => [...leftValues, ...rightValues],
    [leftValues, rightValues],
  );
  const { min: yMin, max: yMax } = useSmoothYRange(extentValues);
  const yAxisLabels = useMemo(
    () => ({
      top: formatAxisLabel(yMax),
      middle: "0°",
      bottom: formatAxisLabel(yMin),
    }),
    [yMax, yMin],
  );

  const axisTitle =
    axis === "vertical"
      ? copy.verticalEyeMovement
      : copy.horizontalEyeMovement;

  if (status === "no_calibration") {
    return (
      <GraphPanel title={axisTitle} className={className}>
        <p className="text-sm text-foreground/60">{copy.calibrationRequired}</p>
      </GraphPanel>
    );
  }

  if (status === "waiting") {
    return (
      <GraphPanel title={axisTitle} className={className}>
        <p className="text-sm text-foreground/60">{copy.waitingSamples}</p>
      </GraphPanel>
    );
  }

  return (
    <GraphPanel
      title={axisTitle}
      subtitle={sourceCopy.subtitle}
      className={className}
      headerExtra={
        <button
          type="button"
          onClick={() =>
            setActiveSource((prev) =>
              prev === "corrected" ? "raw" : "corrected",
            )
          }
          className="shrink-0 rounded-xl border-2 border-blue px-4 py-2 text-sm font-semibold text-blue transition hover:bg-blue/10"
        >
          {copy.switchTo.replace("{mode}", sourceCopy.other)}
        </button>
      }
    >
      <LineChart
        embedded
        scrollHint={copy.scrollToView}
        yMin={yMin}
        yMax={yMax}
        showZeroLine
        clipValues={false}
        timeSeconds={timeSeconds}
        timeTickIntervalSec={1}
        yAxisLabels={yAxisLabels}
        series={[
          {
            label: copy.targetPath,
            color: TARGET_LINE_COLOR,
            values: targetDeg,
          },
          {
            label: sourceCopy.leftLabel,
            color: themeBlue(),
            values: leftValues,
          },
          {
            label: sourceCopy.rightLabel,
            color: DEFAULT_GREEN,
            values: rightValues,
          },
        ]}
      />
    </GraphPanel>
  );
}
