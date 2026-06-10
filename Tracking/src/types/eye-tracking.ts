export type Point2D = {
  x: number;
  y: number;
};

export type Point3D = {
  x: number;
  y: number;
  z: number;
};

export type EyeMetrics = {
  center: Point2D;
  /** Normalized horizontal gaze offset, -1 (left) to 1 (right). */
  horizontal: number;
  /** Normalized vertical gaze offset, -1 (up) to 1 (down). */
  vertical: number;
};

export type HeadPose = {
  /** Roll angle in degrees (head tilt). */
  roll: number;
  /** Pitch angle in degrees. */
  pitch: number;
  /** Yaw angle in degrees. */
  yaw: number;
};

/** Full 3D head pose with orientation matrix for coordinate transforms. */
export type HeadPose3D = HeadPose & {
  rotationMatrix: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ];
  translation: Point3D;
};

export type IrisLandmarkSet = {
  eye: "left" | "right";
  center: Point3D;
  boundary: Point3D[];
  eyeRegionCenter: Point3D;
};

export type HeadRelativeIris = {
  eye: "left" | "right";
  /** Iris center expressed in the head-oriented local frame. */
  localCenter: Point3D;
  /** 2D offset from the eye-region center in head-local coordinates. */
  offsetFromEyeCenter: Point2D;
};

/** Gaze position on the calibrated 2D field-of-view plane, -1 to 1 on each axis. */
export type FovGazePoint = {
  x: number;
  y: number;
};

export type FovCalibrationState = {
  isCalibrated: boolean;
  sampleCount: number;
};

/** Per-eye horizontal offset from the calibrated center fixation (0 = baseline). */
export type CalibratedEyeOffset = {
  horizontalDeg: number;
  /** Normalized by TARGET_ANGLE_DEG so 0 is the calibrated center line. */
  horizontalNorm: number;
};

export type EyeTrackingSample = {
  id: string;
  timestamp: number;
  leftEye: EyeMetrics;
  rightEye: EyeMetrics;
  leftCalibratedOffset: CalibratedEyeOffset | null;
  rightCalibratedOffset: CalibratedEyeOffset | null;
  gazeStability: number;
  headPose: HeadPose;
  headPose3D: HeadPose3D | null;
  leftIris: HeadRelativeIris | null;
  rightIris: HeadRelativeIris | null;
  fovGaze: FovGazePoint | null;
  faceDetected: boolean;
};

export type TrackingSession = {
  id: string;
  startedAt: number;
  endedAt: number | null;
  label: string;
};
