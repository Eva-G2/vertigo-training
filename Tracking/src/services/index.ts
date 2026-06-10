export { CameraService } from "./camera";
export type { CameraConstraints, CameraInitResult, CameraStatus } from "./camera";

export {
  TrackingService,
  estimateHeadPose3D,
  isolateIrisLandmarks,
  computeHeadRelativeIris,
  FovCalibrator,
} from "./tracking";
export type {
  FovCalibrationModel,
  FovCalibrationSample,
  FovCalibrationTarget,
  HeadPoseEstimationResult,
  HeadRelativeIrisResult,
  IrisIsolationResult,
  TrackingFrameResult,
} from "./tracking";

export {
  EyeMovementDataProcessor,
  getSineWaveTargetPosition,
  DEFAULT_SINE_STIMULUS,
  toChartJsMovementExport,
  serializeChartJsExport,
} from "./processing";
export type {
  ChartJsMovementExport,
  MovementComparisonRecord,
  SineWaveStimulusConfig,
} from "./processing";

export {
  MovementAnalytics,
  analyzeMovementRecords,
  dynamicTimeWarping,
  detectSaccades,
  computeSmoothPursuitScore,
} from "./analytics";
export type {
  MovementAnalyticsResult,
  SaccadeEvent,
  SaccadeDetectionConfig,
  DtwResult,
} from "./analytics";
