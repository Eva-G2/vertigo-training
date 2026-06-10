import type { Point2D } from "@/types/eye-tracking";

export type DtwResult = {
  distance: number;
  /** Aligned index pairs [targetIndex, actualIndex]. */
  path: [number, number][];
};

export type SaccadeEvent = {
  recordIndex: number;
  elapsedMs: number;
  eye: "left" | "right";
  speedDegPerSec: number;
  positionDeg: Point2D;
};

export type SaccadeDetectionConfig = {
  /** Minimum speed in degrees/second to classify a saccade. */
  velocityThresholdDegPerSec: number;
};

export type MovementAnalyticsResult = {
  smoothPursuitScore: number;
  dtwDistance: number;
  dtwPath: [number, number][];
  averagePointErrorDeg: number;
  saccades: SaccadeEvent[];
  saccadeCount: number;
};
