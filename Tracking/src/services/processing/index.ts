export { EyeMovementDataProcessor } from "./EyeMovementDataProcessor";
export { getSineWaveTargetPosition, DEFAULT_SINE_STIMULUS } from "./targetStimulus";
export {
  computeMovementVelocity,
  computeMovementRotation,
} from "./movementMetrics";
export {
  toChartJsMovementExport,
  serializeChartJsExport,
} from "./chartJsExport";
export {
  normalizedToDegrees,
  computeSharedDeviationBounds,
  elapsedSeconds,
  MAX_DEVIATION_DEGREES,
} from "./degreesConversion";
export type { DeviationBounds } from "./degreesConversion";
export type {
  ChartJsDataset,
  ChartJsDatasetPoint,
  ChartJsMovementExport,
  IrisPositionRecord,
  MovementComparisonRecord,
  MovementRotation,
  MovementVelocity,
  SineWaveStimulusConfig,
} from "./types";
