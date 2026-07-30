import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import type { ChartData } from "chart.js";
import { useEyeTracking } from "@/state";
import { analyzeMovementRecords } from "@/services/analytics";
import type { SaccadeEvent } from "@/services/analytics";
import {
  computeSharedDeviationBounds,
  DEFAULT_SINE_STIMULUS,
  elapsedSeconds,
  normalizedToDegrees,
} from "@/services/processing";
import type { MovementComparisonRecord } from "@/services/processing";
import "./chartSetup";
import {
  buildIcsChartOptions,
  getIcsChartColors,
} from "./icsChartrChartConfig";
import { useApp } from "@/components/providers/AppProvider";

type Axis = "horizontal" | "vertical";

function pickAxisValue(
  record: MovementComparisonRecord,
  axis: Axis,
  source: "target" | "leftEye" | "rightEye" | "correctedLeftEye" | "correctedRightEye",
): number {
  if (source === "target") {
    const point = record.target;
    return axis === "horizontal" ? point.x : point.y;
  }

  if (source === "correctedLeftEye" || source === "correctedRightEye") {
    const point =
      source === "correctedLeftEye"
        ? record.correctedLeftEye
        : record.correctedRightEye;
    if (!point) {
      const fallback = source === "correctedLeftEye" ? record.leftEye : record.rightEye;
      return axis === "horizontal" ? fallback.x : fallback.y;
    }
    return axis === "horizontal" ? point.x : point.y;
  }

  const point = record[source];
  return axis === "horizontal" ? point.x : point.y;
}

function eyeValueToChartDegrees(
  value: number,
  axis: Axis,
  source: "target" | "leftEye" | "rightEye" | "correctedLeftEye" | "correctedRightEye",
  stimulusAmplitude: number,
): number {
  if (
    source === "correctedLeftEye" ||
    source === "correctedRightEye"
  ) {
    return value;
  }

  return normalizedToDegrees(value, stimulusAmplitude);
}

function buildSaccadeDataset(
  saccades: SaccadeEvent[],
  axis: Axis,
  eye: "left" | "right",
  colors: ReturnType<typeof getIcsChartColors>,
) {
  const filtered = saccades.filter((event) => event.eye === eye);

  return {
    label: `Saccades (${eye}, corrected)`,
    data: filtered.map((event) => ({
      x: elapsedSeconds(event.elapsedMs),
      y:
        axis === "horizontal" ? event.positionDeg.x : event.positionDeg.y,
    })),
    showLine: false,
    pointRadius: 8,
    pointHoverRadius: 10,
    pointBackgroundColor: colors.saccade,
    pointBorderColor: colors.saccadeBorder,
    pointBorderWidth: 2,
    borderColor: colors.saccade,
    backgroundColor: colors.saccade,
  };
}

function buildAxisChartData(
  records: MovementComparisonRecord[],
  saccades: SaccadeEvent[],
  axis: Axis,
  stimulusAmplitude: number,
  colors: ReturnType<typeof getIcsChartColors>,
): ChartData<"line"> {
  const toPoint = (
    record: MovementComparisonRecord,
    source: "target" | "leftEye" | "rightEye" | "correctedLeftEye" | "correctedRightEye",
  ) => ({
    x: elapsedSeconds(record.elapsedMs),
    y: eyeValueToChartDegrees(
      pickAxisValue(record, axis, source),
      axis,
      source,
      stimulusAmplitude,
    ),
  });

  return {
    datasets: [
      {
        label: "Target path",
        data: records.map((record) => toPoint(record, "target")),
        borderColor: colors.target,
        backgroundColor: colors.target,
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        tension: 0.15,
      },
      {
        label: "Left eye (corrected)",
        data: records.map((record) => toPoint(record, "correctedLeftEye")),
        borderColor: colors.leftEye,
        backgroundColor: colors.leftEye,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.15,
      },
      {
        label: "Right eye (corrected)",
        data: records.map((record) => toPoint(record, "correctedRightEye")),
        borderColor: colors.rightEye,
        backgroundColor: colors.rightEye,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.15,
      },
      buildSaccadeDataset(saccades, axis, "left", colors),
      buildSaccadeDataset(saccades, axis, "right", colors),
    ],
  };
}

type IcsAxisChartProps = {
  title: string;
  records: MovementComparisonRecord[];
  saccades: SaccadeEvent[];
  axis: Axis;
  yBounds: ReturnType<typeof computeSharedDeviationBounds>;
  maxTimeSec: number;
};

function IcsAxisChart({
  title,
  records,
  saccades,
  axis,
  yBounds,
  maxTimeSec,
}: IcsAxisChartProps) {
  const { theme } = useApp().state;

  const chartData = useMemo(
    () =>
      buildAxisChartData(
        records,
        saccades,
        axis,
        DEFAULT_SINE_STIMULUS.amplitude,
        getIcsChartColors(),
      ),
    [records, saccades, axis, theme],
  );

  const options = useMemo(
    () => buildIcsChartOptions(title, yBounds, maxTimeSec),
    [title, yBounds, maxTimeSec, theme],
  );

  return (
    <div className="h-56 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}

function pursuitScoreColor(score: number): string {
  if (score >= 70) return "text-cyan";
  if (score >= 40) return "text-yellow-600";
  return "text-red-600";
}

/**
 * ICS Chartr-style dual-panel chart with DTW-based Smooth Pursuit Score
 * and red saccade markers on horizontal/vertical deviation traces.
 */
export function ICSChartrChart() {
  const { state, getMovementRecords } = useEyeTracking();
  const { movementRecordCount, recordingStatus } = state;

  const records = useMemo(
    () => getMovementRecords(),
    [getMovementRecords, movementRecordCount],
  );

  const analytics = useMemo(
    () => analyzeMovementRecords(records, DEFAULT_SINE_STIMULUS),
    [records],
  );

  const yBounds = useMemo(
    () => computeSharedDeviationBounds(records, DEFAULT_SINE_STIMULUS),
    [records],
  );

  const maxTimeSec = useMemo(() => {
    const last = records.at(-1);
    return last ? elapsedSeconds(last.elapsedMs) : 0;
  }, [records]);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border-2 border-blue bg-card p-4 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-dark-blue">ICS Chartr</h2>
          <p className="text-sm text-foreground/70">
            Real-time target vs. left/right eye deviation with DTW pursuit
            scoring
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {records.length > 0 && (
            <div className="rounded-xl border border-blue/30 bg-background px-3 py-2 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-foreground/50">
                Smooth Pursuit Score
              </p>
              <p
                className={`text-2xl font-bold ${pursuitScoreColor(analytics.smoothPursuitScore)}`}
              >
                {analytics.smoothPursuitScore}%
              </p>
            </div>
          )}
          <span className="rounded-full bg-blue/10 px-3 py-1 text-xs font-medium text-blue">
            {recordingStatus === "recording"
              ? `Recording · ${records.length} frames`
              : records.length > 0
                ? `${records.length} frames captured`
                : "Waiting for recording"}
          </span>
          {analytics.saccadeCount > 0 && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
              {analytics.saccadeCount} saccades
            </span>
          )}
        </div>
      </header>

      {records.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-blue/40 bg-background text-sm text-foreground/60">
          Start a session and begin recording to plot eye movement traces.
        </div>
      ) : (
        <div className="grid gap-4">
          <IcsAxisChart
            title="Horizontal Deviation"
            records={records}
            saccades={analytics.saccades}
            axis="horizontal"
            yBounds={yBounds}
            maxTimeSec={maxTimeSec}
          />
          <IcsAxisChart
            title="Vertical Deviation"
            records={records}
            saccades={analytics.saccades}
            axis="vertical"
            yBounds={yBounds}
            maxTimeSec={maxTimeSec}
          />
        </div>
      )}
    </section>
  );
}
