import { useEffect, useRef, useState } from "react";
import {
  chooseTimeTickInterval,
  formatTimeLabel,
  timeToX,
} from "./chartTime";

export type LineChartSeries = {
  label: string;
  color: string;
  values: number[];
};

type LineChartProps = {
  title: string;
  series: LineChartSeries[];
  yMin?: number;
  yMax?: number;
  className?: string;
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
};

const DEFAULT_PIXELS_PER_SAMPLE = 4;
const CANVAS_HEIGHT = 160;

export function LineChart({
  title,
  series,
  yMin = -1,
  yMax = 1,
  className = "",
  showZeroLine = false,
  clipValues = true,
  yAxisLabels,
  timeSeconds,
  pixelsPerSample = DEFAULT_PIXELS_PER_SAMPLE,
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
  const dataWidth = Math.max(maxLength - 1, 1) * pixelsPerSample;
  const contentWidth = padding.left + dataWidth + padding.right;
  const canvasWidth =
    containerWidth <= 0
      ? 0
      : hasTimeAxis
        ? Math.max(containerWidth, contentWidth)
        : containerWidth;
  const isScrollable =
    hasTimeAxis && containerWidth > 0 && contentWidth > containerWidth;

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
        return padding.left + index * pixelsPerSample;
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

    if (yAxisLabels) {
      context.fillStyle = "#64748b";
      context.font = "10px system-ui, sans-serif";
      context.textAlign = "right";
      context.textBaseline = "middle";
      context.fillText(yAxisLabels.top, padding.left - 8, padding.top);
      context.fillText(yAxisLabels.middle, padding.left - 8, valueToY(0));
      context.fillText(
        yAxisLabels.bottom,
        padding.left - 8,
        padding.top + plotHeight,
      );
    }

    if (hasTimeAxis && timeSeconds) {
      const startTime = timeSeconds[0] ?? 0;
      const endTime = timeSeconds[timeSeconds.length - 1] ?? 0;
      const duration = Math.max(endTime - startTime, 0.001);
      const tickInterval = chooseTimeTickInterval(duration);
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
        const x = timeToX(tick, timeSeconds, padding.left, pixelsPerSample);
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

    series.forEach((item) => {
      if (item.values.length < 2) return;

      context.strokeStyle = item.color;
      context.lineWidth = 2;
      context.beginPath();

      item.values.forEach((value, index) => {
        const plotted = clipValues
          ? Math.min(yMax, Math.max(yMin, value))
          : value;
        const x = indexToX(index);
        const y = valueToY(plotted);

        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
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
    pixelsPerSample,
    series,
    showZeroLine,
    timeSeconds,
    yAxisLabels,
    yMax,
    yMin,
  ]);

  return (
    <div
      className={`min-w-0 rounded-2xl border-2 border-blue bg-card p-4 shadow-sm ${className}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-dark-blue">{title}</h3>
        {isScrollable && (
          <span className="shrink-0 text-[10px] text-foreground/50">
            Scroll to view full record
          </span>
        )}
      </div>
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
