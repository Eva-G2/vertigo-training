export {
  VerticalPursuitAnalytics,
  normalizeViewportX,
  normalizeViewportY,
} from "./VerticalPursuitAnalytics";
export { GazeStabilityService } from "./GazeStabilityService";
export type { VorAnalysisAxis } from "./GazeStabilityService";
export type { PursuitAxis } from "./VerticalPursuitAnalytics";
export { MovementAnalytics, analyzeMovementRecords } from "./MovementAnalytics";
export { dynamicTimeWarping } from "./dtw";
export { detectSaccades, DEFAULT_SACCADE_CONFIG } from "./saccadeDetection";
export {
  computeSmoothPursuitScore,
  runDtwAnalysis,
} from "./smoothPursuitScore";
export {
  computeSessionResults,
  sessionResultsToStepMetrics,
  computeCompletionRatePct,
  computeAccuracyPct,
  computeAverageAngleDeg,
  findPeakAndTroughValues,
} from "./sessionResults";
export {
  TRACKING_GAP_STREAK_THRESHOLD,
  TRACKING_CHART_GAP,
  applyTrackingGapHysteresis,
  isChartTrackingValue,
  sanitizeTrackingChartSeries,
  toTrackingChartValue,
} from "./trackingGapPolicy";
export {
  HEAD_POSE_CHART_Y_RANGE,
  isStage2Step1NoddingSession,
  isStage2Step2TurningSession,
  normalizeHeadPoseChartDeg,
  parseTrainingStageFromLabel,
  parseTrainingStageStepFromLabel,
  pursuitRecordsToHeadMovementPoints,
  samplesToHeadMovementPoints,
} from "./headPoseChart";
export {
  buildHeadEyeVelocityPoints,
  HEAD_EYE_VELOCITY_CHART_Y_RANGE,
  STAGE2_HEAD_EYE_VELOCITY_CHART_Y_RANGE,
  resolveHeadEyeVelocityAxis,
  resolveHeadEyeVelocityChartYRange,
} from "./headEyeVelocityChart";
export type { HeadEyeVelocityAxis, HeadEyeVelocityPoint } from "./headEyeVelocityChart";
export {
  HEAD_NOD_CYCLES,
  HEAD_NOD_FIRST_BEEP_DELAY_MS,
  HEAD_NOD_TOTAL_MS,
  buildHeadNodPitchTargetSeries,
  headNodTargetPitchDegAtElapsedMs,
  headNodWaitMsForCycle,
} from "./headNodPacingChart";
export {
  HEAD_TURN_CYCLES,
  HEAD_TURN_TOTAL_MS,
  buildHeadTurnYawTargetSeries,
  headTurnTargetYawDegAtElapsedMs,
  headTurnWaitMsForCycle,
} from "./headTurnPacingChart";
export type { HeadMovementGraphPoint } from "./headPoseChart";
export {
  SHOULDER_MOVEMENT_CHART_Y_RANGE,
  LEFT_SHOULDER_COLOR,
  RIGHT_SHOULDER_COLOR,
  computeShoulderShrugMetrics,
  computeWaistTurnMetrics,
  isStage3TrainingSession,
  normalizeShoulderChartValue,
  ShoulderMovementRecorder,
} from "./shoulderMovementChart";
export type {
  ShoulderMovementGraphPoint,
  ShoulderShrugMetrics,
  WaistTurnMetrics,
} from "./shoulderMovementChart";
export type {
  VerticalPursuitDataset,
  VerticalPursuitRecord,
} from "./VerticalPursuitAnalytics";
export type {
  ComputeSessionResultsParams,
  HeadAccuracyAxis,
  SessionResults,
  TrackingSessionAxis,
} from "./sessionResults";
export type {
  DtwResult,
  MovementAnalyticsResult,
  SaccadeDetectionConfig,
  SaccadeEvent,
} from "./types";
export type { MovementAnalyticsConfig } from "./MovementAnalytics";
