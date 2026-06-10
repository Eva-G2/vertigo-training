export {
  VerticalPursuitAnalytics,
  normalizeViewportY,
} from "./VerticalPursuitAnalytics";
export { MovementAnalytics, analyzeMovementRecords } from "./MovementAnalytics";
export { dynamicTimeWarping } from "./dtw";
export { detectSaccades, DEFAULT_SACCADE_CONFIG } from "./saccadeDetection";
export {
  computeSmoothPursuitScore,
  runDtwAnalysis,
} from "./smoothPursuitScore";
export type {
  VerticalPursuitDataset,
  VerticalPursuitRecord,
} from "./VerticalPursuitAnalytics";
export type {
  DtwResult,
  MovementAnalyticsResult,
  SaccadeDetectionConfig,
  SaccadeEvent,
} from "./types";
export type { MovementAnalyticsConfig } from "./MovementAnalytics";
