/**
 * Localizable copy for the tracking analytics dashboard.
 *
 * The Tracking module is consumed both standalone and embedded in the host app.
 * Host apps supply a translated {@link AnalyticsCopy} via props; when omitted the
 * English {@link DEFAULT_ANALYTICS_COPY} keeps the standalone build self-contained.
 *
 * Strings containing `{token}` placeholders are interpolated at the call site.
 */
export type AnalyticsCopy = {
  pipeline: string;
  recording: string;
  samples: string;
  movement: string;
  vergence: string;
  vertical: string;
  calibration: string;
  injected: string;
  pending: string;
  leftCorrectedH: string;
  rightCorrectedH: string;
  stability: string;
  fovGaze: string;
  notCalibrated: string;
  verticalEyeMovement: string;
  horizontalEyeMovement: string;
  /** `Switch to {mode}` */
  switchTo: string;
  sourceRaw: string;
  sourceIsolated: string;
  correctedTitle: string;
  correctedSubtitle: string;
  rawTitle: string;
  rawSubtitle: string;
  leftEyeCorrected: string;
  rightEyeCorrected: string;
  leftEyeRaw: string;
  rightEyeRaw: string;
  targetPath: string;
  targetPosition: string;
  calibrationRequired: string;
  waitingSamples: string;
  vergenceTracking: string;
  vergenceRequired: string;
  waitingVergence: string;
  convergenceAngle: string;
  gazeStability: string;
  stabilityIndex: string;
  headTilt: string;
  rollDegrees: string;
  headPitchMovement: string;
  headYawMovement: string;
  headPitchDegrees: string;
  headYawDegrees: string;
  headMovementSubtitle: string;
  waitingHeadPose: string;
  combinedHeadMovement: string;
  headEyeVelocity: string;
  headEyeVelocitySubtitle: string;
  headVelocity: string;
  eyeVelocity: string;
  scrollToView: string;
  shoulderVerticalMovement: string;
  shoulderHorizontalMovement: string;
  shoulderMovementSubtitle: string;
  waitingShoulderMovement: string;
  leftShoulder: string;
  rightShoulder: string;
};

export const DEFAULT_ANALYTICS_COPY: AnalyticsCopy = {
  pipeline: "Pipeline",
  recording: "Recording",
  samples: "Samples",
  movement: "Movement",
  vergence: "Vergence",
  vertical: "Vertical",
  calibration: "Calibration",
  injected: "Injected",
  pending: "Pending",
  leftCorrectedH: "Left corrected (H)",
  rightCorrectedH: "Right corrected (H)",
  stability: "Stability",
  fovGaze: "FOV gaze",
  notCalibrated: "Not calibrated",
  verticalEyeMovement: "Vertical Eye Movement",
  horizontalEyeMovement: "Horizontal Eye Movement",
  switchTo: "Switch to {mode}",
  sourceRaw: "Raw",
  sourceIsolated: "Corrected",
  correctedTitle: "Corrected eye movement",
  correctedSubtitle: "Eye-in-orbit movement after subtracting head rotation.",
  rawTitle: "Raw eye movement",
  rawSubtitle: "Uncorrected eye movement relative to the target.",
  leftEyeCorrected: "Left Eye (corrected)",
  rightEyeCorrected: "Right Eye (corrected)",
  leftEyeRaw: "Left Eye (raw)",
  rightEyeRaw: "Right Eye (raw)",
  targetPath: "Target Path",
  targetPosition: "Target Position",
  calibrationRequired:
    "Calibration required before tracking data can be plotted.",
  waitingSamples: "Waiting for tracking samples…",
  vergenceTracking: "Vergence Tracking",
  vergenceRequired: "Calibration required before vergence data can be plotted.",
  waitingVergence: "Waiting for vergence tracking samples…",
  convergenceAngle: "Convergence Angle (Degrees)",
  gazeStability: "Gaze Stability",
  stabilityIndex: "Stability index",
  headTilt: "Head Tilt (rotation)",
  rollDegrees: "Roll (degrees)",
  headPitchMovement: "Head Pitch (vertical)",
  headYawMovement: "Head Yaw (horizontal)",
  headPitchDegrees: "Pitch (degrees)",
  headYawDegrees: "Yaw (degrees)",
  headMovementSubtitle:
    "Head rotation relative to the session baseline. Compare with eye gaze above.",
  waitingHeadPose: "Waiting for head pose samples…",
  combinedHeadMovement: "Combined Head Movement (Pitch & Yaw)",
  headEyeVelocity: "Head vs. Eye Velocity",
  headEyeVelocitySubtitle: "Angular velocity during the session.",
  headVelocity: "Head velocity",
  eyeVelocity: "Eye velocity",
  scrollToView: "Scroll to view full record",
  shoulderVerticalMovement: "Shoulder Vertical Movement",
  shoulderHorizontalMovement: "Shoulder Horizontal Movement",
  shoulderMovementSubtitle:
    "Left and right shoulder motion relative to the session baseline.",
  waitingShoulderMovement: "Waiting for shoulder movement samples…",
  leftShoulder: "Left Shoulder",
  rightShoulder: "Right Shoulder",
};
