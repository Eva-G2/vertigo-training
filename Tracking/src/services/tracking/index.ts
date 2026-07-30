export { TrackingService } from "./TrackingService";
export { TrackingStateManager } from "./TrackingStateManager";
export { CalibrationManager } from "./CalibrationManager";
export { estimateHeadPose3D } from "./headPoseEstimation";
export {
  buildHeadOrientationMatrix,
  computeFullFaceHeadChartAngles,
  computeHeadMovementAngles,
  eulerFromHeadOrientationMatrix,
} from "./headPoseChartAngles";
export {
  isTrackingSampleValid,
  toChartNumeric,
} from "./trackingSampleValidity";
export { isolateIrisLandmarks } from "./irisLandmarks";
export { computeHeadRelativeIris } from "./headRelativeIris";
export {
  calculateEyeInHead,
} from "./eyeInHead";
export {
  calculateScaledEyeInHead,
  DEFAULT_VOR_HEAD_SCALE,
  scaleHeadChartDelta,
  updateVorHeadScale,
} from "./vorHeadScaling";
export type { VorHeadScale } from "./vorHeadScaling";
export {
  normalizeVorFrame,
} from "./vorFrameNormalization";
export type {
  NormalizedVorFrame,
  VorHeadPoseDeg,
} from "./vorFrameNormalization";
export {
  averageGazeVectors,
  clearCompensationOffset,
  getCompensationOffset,
  getCorrectedGaze,
  GAIN_H,
  GAIN_V,
  headPoseToRotationVector,
  recenterTracking,
  setCompensationOffset,
  subtractHeadRotation,
} from "./gazeCompensation";
export type {
  GazeRecenterBaseline,
  GazeVector,
  HeadRotationVector,
  TrackingFrameSignals,
} from "./gazeCompensation";
export {
  DistanceSmoother,
  estimateDistance,
  estimateScreenWidthCm,
  getOptimalDistanceRange,
  STANDARD_IPD_MM,
} from "./distanceEstimation";
export {
  ConstantVelocityKalman1D,
  ScalarKalmanFilter,
} from "./kalmanFilter";
export {
  NASAL_ROOT_LANDMARK_INDEX,
  NasalRootHeadVelocityTracker,
} from "./nasalRootHeadVelocity";
export {
  LEFT_PUPIL_CENTER_LANDMARK_INDEX,
  RIGHT_PUPIL_CENTER_LANDMARK_INDEX,
  PUPIL_CENTER_LANDMARK_INDEX,
  PupilCenterEyeVelocityTracker,
} from "./pupilCenterEyeVelocity";
export {
  BONY_HEAD_LANDMARKS,
  BONY_HEAD_LANDMARK_ORDER,
  BONY_HEAD_WHITE_KEYS,
  BONY_LANDMARK_CONFIDENCE_THRESHOLD,
  FACE_MESH_OCCLUSION_Z_MARGIN,
  isFaceMeshLandmarkTrackable,
  isLandmarkConfident,
  landmarkVisibilityScore,
} from "./bonyHeadLandmarks";
export type {
  BonyHeadLandmarkKey,
  LandmarkWithConfidence,
} from "./bonyHeadLandmarks";
export { FovCalibrator, TARGET_ANGLE_DEG } from "./fovCalibration";
export {
  gainFactorFromK,
  horizontalEyeDegrees,
  measuredToDegrees,
  normalizedTargetToDegrees,
  TRACKING_GRAPH_RANGE_DEG,
  verticalEyeDegrees,
  verticalLeftEyeDegrees,
  verticalRightEyeDegrees,
} from "./trackingDegrees";
export type {
  AxisCalibration,
  HorizontalCalibrationParams,
  VerticalCalibrationParams,
} from "./trackingDegrees";
export type {
  CalibratedGazeDegrees,
  EyeSide,
  FovCalibrationModel,
  FovCalibrationSample,
  FovCalibrationTarget,
  HeadPoseEstimationResult,
  HeadRelativeIrisResult,
  IrisIsolationResult,
  MediaPipeLandmark,
  TrackingFrameResult,
} from "./types";
export type {
  CalibrationPhase,
  CalibrationStatus,
  DistanceFeedback,
} from "./CalibrationManager";
