import type { Point2D } from "@/types/eye-tracking";

export type SineWaveStimulusConfig = {
  /** Peak displacement of the sine wave. */
  amplitude: number;
  /** Oscillation frequency in hertz. */
  frequencyHz: number;
  /** Phase offset in radians. */
  phaseRadians: number;
  /** Center line of the stimulus path. */
  baseline: number;
  /** Axis along which the sine wave oscillates. */
  oscillationAxis: "x" | "y";
};

export type IrisPositionRecord = {
  timestamp: number;
  elapsedMs: number;
  actual: Point2D;
};

export type MovementVelocity = {
  x: number;
  y: number;
  speed: number;
};

export type MovementRotation = {
  /** Direction of movement in degrees (0 = right, 90 = down). */
  directionDeg: number;
  /** Rate of direction change in degrees per second. */
  angularVelocityDegPerSec: number;
};

export type MovementComparisonRecord = {
  timestamp: number;
  elapsedMs: number;
  target: Point2D;
  /** Raw iris offset in normalized stimulus space. */
  leftEye: Point2D;
  rightEye: Point2D;
  /** Head-pose compensated gaze in degrees (x = horizontal, y = vertical). */
  correctedLeftEye: Point2D | null;
  correctedRightEye: Point2D | null;
  /** Binocular average kept for export compatibility (raw). */
  actual: Point2D;
  /** Binocular average of corrected gaze in degrees. */
  correctedActual: Point2D | null;
  error: Point2D & { magnitude: number };
  velocity: MovementVelocity;
  rotation: MovementRotation;
};

export type ChartJsDatasetPoint = {
  x: number;
  y: number;
};

/** Chart.js-compatible dataset entry. */
export type ChartJsDataset = {
  label: string;
  data: ChartJsDatasetPoint[];
  borderColor: string;
  backgroundColor: string;
  pointRadius: number;
  tension: number;
};

/** Structured export for Chart.js line/scatter charts. */
export type ChartJsMovementExport = {
  type: "line";
  data: {
    datasets: ChartJsDataset[];
  };
  records: MovementComparisonRecord[];
  meta: {
    sessionStartedAt: number;
    sessionEndedAt: number;
    sampleCount: number;
    stimulus: SineWaveStimulusConfig;
  };
};
