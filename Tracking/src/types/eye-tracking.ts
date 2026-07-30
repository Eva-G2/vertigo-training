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

/** Gaze direction in degrees relative to the calibrated fixation baseline. */
export type GazeDegrees = {
  horizontal: number;
  vertical: number;
};

/** Delta head rotation applied when compensating gaze for a frame. */
export type HeadRotationDelta = {
  yaw: number;
  pitch: number;
  roll: number;
};

/** Landmark-derived angles for head-movement charts (nod / turn). */
export type HeadMovementAngles = {
  pitchDeg: number;
  yawDeg: number;
  rollDeg: number;
};

export type EyeTrackingSample = {
  id: string;
  timestamp: number;
  leftEye: EyeMetrics;
  rightEye: EyeMetrics;
  leftCalibratedOffset: CalibratedEyeOffset | null;
  rightCalibratedOffset: CalibratedEyeOffset | null;
  /** Raw calibrated gaze before head-pose compensation. */
  rawLeftGazeDeg: GazeDegrees | null;
  rawRightGazeDeg: GazeDegrees | null;
  /** Head-pose compensated ocular rotation (eye-in-orbit). */
  leftEyeCorrected: GazeDegrees | null | undefined;
  rightEyeCorrected: GazeDegrees | null | undefined;
  /** Head rotation delta subtracted from raw gaze this frame. */
  headRotationDelta: HeadRotationDelta | null;
  gazeStability: number;
  headPose: HeadPose;
  headPose3D: HeadPose3D | null;
  /** Raw landmark-derived nod / turn angles (no smoothing). */
  headMovementAngles: HeadMovementAngles | null;
  /** Session-baseline-relative pitch for charts (degrees). */
  headChartPitchDeg: number;
  /** Session-baseline-relative yaw for charts (degrees). */
  headChartYawDeg: number;
  /**
   * Kalman-smoothed head velocity magnitude (°/s) from Nasal Root (168).
   * Used by the VOR head-vs-eye velocity graph. NaN when tracking is lost.
   */
  nasalRootHeadVelocityDegPerSec: number;
  /**
   * Kalman-smoothed eye velocity magnitude (°/s) from the mean of both
   * pupil centers (468 + 473). Used by the VOR head-vs-eye velocity graph.
   * NaN when tracking is lost.
   */
  pupilCenterEyeVelocityDegPerSec: number;
  leftIris: HeadRelativeIris | null;
  rightIris: HeadRelativeIris | null;
  fovGaze: FovGazePoint | null;
  faceDetected: boolean;
  /** Head-pose-isolated binocular gaze (degrees). Null when tracking is lost. */
  eyeInHeadDeg: GazeDegrees | null;
  /** Real-time VOR gain (|eye velocity| / |head velocity|). Null when paused. */
  vorGain: number | null;
};

export type TrackingSession = {
  id: string;
  startedAt: number;
  endedAt: number | null;
  label: string;
};
