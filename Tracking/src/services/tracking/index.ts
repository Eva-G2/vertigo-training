export { TrackingService } from "./TrackingService";
export { CalibrationManager } from "./CalibrationManager";
export { estimateHeadPose3D } from "./headPoseEstimation";
export { isolateIrisLandmarks } from "./irisLandmarks";
export { computeHeadRelativeIris } from "./headRelativeIris";
export {
  DistanceSmoother,
  estimateDistance,
  estimateScreenWidthCm,
  getOptimalDistanceRange,
  STANDARD_IPD_MM,
} from "./distanceEstimation";
export { FovCalibrator, TARGET_ANGLE_DEG } from "./fovCalibration";
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
