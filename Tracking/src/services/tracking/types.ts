import type {
  FovGazePoint,
  HeadPose3D,
  HeadRelativeIris,
  IrisLandmarkSet,
  Point2D,
} from "@/types/eye-tracking";

export type MediaPipeLandmark = {
  x: number;
  y: number;
  z?: number;
};

export type HeadPoseEstimationResult = {
  pose: HeadPose3D;
  /** True when pose was derived from MediaPipe face geometry. */
  usedFaceGeometry: boolean;
};

export type IrisIsolationResult = {
  left: IrisLandmarkSet;
  right: IrisLandmarkSet;
};

export type HeadRelativeIrisResult = {
  left: HeadRelativeIris;
  right: HeadRelativeIris;
};

export type EyeSide = "left" | "right";

export type FovCalibrationTarget = FovGazePoint & {
  label: string;
  /** Known horizontal target angle in degrees. */
  angleDegX: number;
  /** Known vertical target angle in degrees. */
  angleDegY: number;
};

export type FovCalibrationSample = {
  target: FovCalibrationTarget;
  leftRaw: Point2D;
  rightRaw: Point2D;
  capturedAt: number;
};

export type PupilPixelBaseline = {
  x: number;
  y: number;
};

export type FovCalibrationModel = {
  isCalibrated: boolean;
  leftBaseline: PupilPixelBaseline;
  rightBaseline: PupilPixelBaseline;
  /** Forehead landmark Y (0–1) captured during the center fixation sample. */
  faceTopNormalizedY: number | null;
  /** Chin landmark Y (0–1) captured during the center fixation sample. */
  chinNormalizedY: number | null;
  /** Horizontal gain for the left eye (degrees per pixel). */
  kL: number;
  /** Horizontal gain for the right eye (degrees per pixel). */
  kR: number;
  /** Vertical gain for the left eye (degrees per pixel). */
  kLY: number;
  /** Vertical gain for the right eye (degrees per pixel). */
  kRY: number;
  samples: FovCalibrationSample[];
};

export type CalibratedGazeDegrees = {
  xDeg: number;
  yDeg: number;
};

export type TrackingFrameResult = {
  headPose3D: HeadPose3D | null;
  irisLandmarks: IrisIsolationResult | null;
  headRelativeIris: HeadRelativeIrisResult | null;
  fovGaze: FovGazePoint | null;
};
