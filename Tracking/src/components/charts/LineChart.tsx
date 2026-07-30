import { useEffect, useRef, useState } from "react";
import {
  chooseTimeTickInterval,
  formatTimeLabel,
  timeToX,
} from "./chartTime";
import { sanitizeTrackingChartSeries } from "@/services/analytics/trackingGapPolicy";

export type LineChartSeries = {
  label: string;
  color: string;
  values: Array<number | null | undefined>;
};

type LineChartProps = {
  title?: string;
  series: LineChartSeries[];
  yMin?: number;
  yMax?: number;
  className?: string;
  /** When true, omits the outer card chrome and title row (parent supplies header). */
  embedded?: boolean;
  showZeroLine?: boolean;
  /** When false, values outside yMin/yMax are drawn without clamping. */
  clipValues?: boolean;
  yAxisLabels?: {
    top: string;
    middle: string;
    bottom: string;
  };
  /** Elapsed seconds aligned with series values; enables time axis + horizontal scroll. */
  timeSeconds?: number[];
  pixelsPerSample?: number;
  /** Compresses the complete time series into the available width. */
  fitToWidth?: boolean;
  /** Fixed x-axis tick spacing in seconds; defaults to adaptive intervals. */
  timeTickIntervalSec?: number;
  /** Elapsed times rendered as vertical grey event markers. */
  verticalMarkersSec?: number[];
  /** Localized hint shown when the chart overflows horizontally. */
  scrollHint?: string;
};

const DEFAULT_PIXELS_PER_SAMPLE = 4;
const CANVAS_HEIGHT = 160;

export function LineChart({
  title = "",
  series,
  yMin = -1,
  yMax = 1,
  className = "",
  embedded = false,
  showZeroLine = false,
  clipValues = true,
  yAxisLabels,
  timeSeconds,
  pixelsPerSample = DEFAULT_PIXELS_PER_SAMPLE,
  fitToWidth = false,
  timeTickIntervalSec,
  verticalMarkersSec,
  scrollHint = "Scroll to view full record",
}: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const maxLength = Math.max(...series.map((item) => item.values.length), 1);
  const hasTimeAxis = Boolean(timeSeconds?.length);
  const padding = {
    top: 16,
    right: 12,
    bottom: hasTimeAxis ? 36 : 24,
    left: 96,
  };
  const resolvedPixelsPerSample =
    fitToWidth && containerWidth > 0
      ? Math.max(
          (containerWidth - padding.left - padding.right) /
            Math.max(maxLength - 1, 1),
          0,
        )
      : pixelsPerSample;
  const dataWidth = Math.max(maxLength - 1, 1) * resolvedPixelsPerSample;
  const contentWidth = padding.left + dataWidth + padding.right;
  const canvasWidth =
    containerWidth <= 0
      ? 0
      : hasTimeAxis
        ? Math.max(containerWidth, contentWidth)
        : containerWidth;
  const isScrollable =
    hasTimeAxis && containerWidth > 0 && contentWidth > containerWidth;

  const plotHeight = CANVAS_HEIGHT - padding.top - padding.bottom;
  const formatTick = (value: number) => {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
  };
  const axisLabels = yAxisLabels ?? {
    top: formatTick(yMax),
    middle: formatTick((yMin + yMax) / 2),
    bottom: formatTick(yMin),
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const updateWidth = () => {
      setContainerWidth(scrollContainer.clientWidth);
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(scrollContainer);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasWidth <= 0) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const width = canvasWidth;
    const height = CANVAS_HEIGHT;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    context.scale(dpr, dpr);
    context.clearRect(0, 0, width, height);

    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const valueToY = (value: number) => {
      const normalized = (value - yMin) / Math.max(yMax - yMin, 0.001);
      return padding.top + plotHeight - normalized * plotHeight;
    };

    const indexToX = (index: number) => {
      if (hasTimeAxis) {
        return padding.left + index * resolvedPixelsPerSample;
      }
      return padding.left + (index / Math.max(maxLength - 1, 1)) * plotWidth;
    };

    context.strokeStyle = "#d8e0f0";
    context.lineWidth = 1;

    for (let i = 0; i <= 4; i += 1) {
      const y = padding.top + (plotHeight / 4) * i;
      context.beginPath();
      context.moveTo(padding.left, y);
      context.lineTo(width - padding.right, y);
      context.stroke();
    }

    if (showZeroLine && yMin < 0 && yMax > 0) {
      const zeroY = valueToY(0);
      context.strokeStyle = "#94a3b8";
      context.lineWidth = 1.5;
      context.setLineDash([6, 4]);
      context.beginPath();
      context.moveTo(padding.left, zeroY);
      context.lineTo(width - padding.right, zeroY);
      context.stroke();
      context.setLineDash([]);
    }

    if (hasTimeAxis && timeSeconds) {
      const startTime = timeSeconds[0] ?? 0;
      const endTime = timeSeconds[timeSeconds.length - 1] ?? 0;
      const duration = Math.max(endTime - startTime, 0.001);
      const tickInterval = timeTickIntervalSec ?? chooseTimeTickInterval(duration);
      const firstTick = Math.ceil(startTime / tickInterval) * tickInterval;

      context.strokeStyle = "#cbd5e1";
      context.fillStyle = "#64748b";
      context.font = "10px system-ui, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "top";

      for (
        let tick = firstTick;
        tick <= endTime + tickInterval * 0.001;
        tick += tickInterval
      ) {
        const x = timeToX(
          tick,
          timeSeconds,
          padding.left,
          resolvedPixelsPerSample,
        );
        if (x < padding.left || x > width - padding.right) {
          continue;
        }

        context.beginPath();
        context.moveTo(x, padding.top + plotHeight);
        context.lineTo(x, padding.top + plotHeight + 4);
        context.stroke();
        context.fillText(formatTimeLabel(tick), x, padding.top + plotHeight + 6);
      }
    }

    if (hasTimeAxis && timeSeconds && verticalMarkersSec?.length) {
      const endTime = timeSeconds[timeSeconds.length - 1] ?? 0;

      context.strokeStyle = "#94a3b8";
      context.lineWidth = 1;
      context.setLineDash([]);

      verticalMarkersSec.forEach((markerSec) => {
        if (markerSec < 0 || markerSec > endTime) {
          return;
        }

        const x = timeToX(
          markerSec,
          timeSeconds,
          padding.left,
          resolvedPixelsPerSample,
        );
        context.beginPath();
        context.moveTo(x, padding.top);
        context.lineTo(x, padding.top + plotHeight);
        context.stroke();
      });
    }

    series.forEach((item) => {
      if (item.values.length < 2) return;

      const preparedValues = sanitizeTrackingChartSeries(item.values);

      context.strokeStyle = item.color;
      context.lineWidth = 2;
      context.beginPath();

      let pathStarted = false;
      preparedValues.forEach((value, index) => {
        if (!Number.isFinite(value)) {
          pathStarted = false;
          return;
        }

        const plotted = clipValues
          ? Math.min(yMax, Math.max(yMin, value))
          : value;
        const x = indexToX(index);
        const y = valueToY(plotted);

        if (!pathStarted) {
          context.moveTo(x, y);
          pathStarted = true;
        } else {
          context.lineTo(x, y);
        }
      });

      context.stroke();
    });
  }, [
    canvasWidth,
    clipValues,
    hasTimeAxis,
    maxLength,
    padding.bottom,
    padding.left,
    padding.right,
    padding.top,
    resolvedPixelsPerSample,
    series,
    showZeroLine,
    timeSeconds,
    timeTickIntervalSec,
    verticalMarkersSec,
    yAxisLabels,
    yMax,
    yMin,
  ]);

  const shellClassName = embedded
    ? `min-w-0 ${className}`
    : `min-w-0 rounded-2xl border-2 border-blue bg-card p-4 shadow-sm ${className}`;

  return (
    <div className={shellClassName}>
      {!embedded && title ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-dark-blue">{title}</h3>
          {isScrollable && (
            <span className="shrink-0 text-[10px] text-foreground/50">
              {scrollHint}
            </span>
          )}
        </div>
      ) : null}
      {embedded && isScrollable ? (
        <div className="mb-2 flex justify-end">
          <span className="shrink-0 text-[10px] text-foreground/50">
            {scrollHint}
          </span>
        </div>
      ) : null}
      <div className="relative">
        <div
          ref={scrollRef}
          className="h-40 w-full min-w-0 overflow-x-auto overflow-y-hidden"
        >
          <canvas
            ref={canvasRef}
            className="block h-40 max-w-none"
            style={{ width: canvasWidth, height: CANVAS_HEIGHT }}
          />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 flex w-24 justify-end overflow-hidden border-r border-blue/15 bg-card/85 backdrop-blur-[1px]"
          style={{ height: CANVAS_HEIGHT }}
        >
          <span
            className="absolute right-2 whitespace-nowrap text-[10px] text-foreground/60"
            style={{ top: padding.top, transform: "translateY(-50%)" }}
          >
            {axisLabels.top}
          </span>
          <span
            className="absolute right-2 whitespace-nowrap text-[10px] text-foreground/60"
            style={{
              top: padding.top + plotHeight / 2,
              transform: "translateY(-50%)",
            }}
          >
            {axisLabels.middle}
          </span>
          <span
            className="absolute right-2 whitespace-nowrap text-[10px] text-foreground/60"
            style={{
              top: padding.top + plotHeight,
              transform: "translateY(-50%)",
            }}
          >
            {axisLabels.bottom}
          </span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-foreground/70">
        {series.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
