/**
 * Localizable copy for the eye-calibration overlay and surrounding camera UI.
 *
 * The Tracking module is consumed both standalone and embedded in the host app.
 * Host apps supply a translated {@link CalibrationCopy} via props; when omitted the
 * English {@link DEFAULT_CALIBRATION_COPY} keeps the standalone build self-contained.
 *
 * Strings containing `{token}` placeholders are interpolated at the call site, and
 * {@link CalibrationCopy.targetNames} maps internal target labels to localized names.
 */
export type CalibrationCopy = {
  faceCamera: string;
  moveFurther: string;
  moveCloser: string;
  positionConfirmed: string;
  calibratingFov: string;
  /** `Look at the {target} target, and click on Capture when ready.` */
  lookAtTargetReady: string;
  /** `Look at the {target} target` */
  lookAtTarget: string;
  distanceCheckTitle: string;
  fovTitle: string;
  estimatedDistance: string;
  targetDistance: string;
  targetShort: string;
  /** `{deg}° visual angle` */
  visualAngle: string;
  adjustDistance: string;
  /** `Capture each point at ±{deg}° ({target})` */
  captureEachPoint: string;
  capture: string;
  allPointsCaptured: string;
  calibrateFov: string;
  cancelCalibration: string;
  /** Internal target label -> localized name (center/left/right/up/down). */
  targetNames: Record<string, string>;
};

export const DEFAULT_CALIBRATION_COPY: CalibrationCopy = {
  faceCamera: "Face the camera to begin",
  moveFurther: "Move further",
  moveCloser: "Move closer",
  positionConfirmed: "Position confirmed",
  calibratingFov: "Calibrating field of view…",
  lookAtTargetReady:
    "Look at the {target} target, and click on Confirm when ready.",
  lookAtTarget: "Look at the {target} target",
  distanceCheckTitle: "Pre-Calibration Distance Check",
  fovTitle: "FOV Calibration — fixate the highlighted target",
  estimatedDistance: "Estimated distance",
  targetDistance: "Target distance",
  targetShort: "Target",
  visualAngle: "{deg}° visual angle",
  adjustDistance: "Adjust your distance before confirming the next point.",
  captureEachPoint: "Confirm each point at ±{deg}° ({target})",
  capture: "Confirm",
  allPointsCaptured: "All calibration points captured",
  calibrateFov: "Calibrate FOV",
  cancelCalibration: "Cancel calibration",
  targetNames: {
    center: "center",
    left: "left",
    right: "right",
    up: "up",
    down: "down",
  },
};

/** Replaces `{token}` placeholders in a copy template. */
export function fillCopy(
  template: string,
  tokens: Record<string, string | number>,
): string {
  return Object.entries(tokens).reduce(
    (text, [token, value]) => text.replaceAll(`{${token}}`, String(value)),
    template,
  );
}
