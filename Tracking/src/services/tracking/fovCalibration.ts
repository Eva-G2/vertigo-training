import type { FovGazePoint, Point2D } from "@/types/eye-tracking";
import type {
  CalibratedGazeDegrees,
  EyeSide,
  FovCalibrationModel,
  FovCalibrationSample,
  FovCalibrationTarget,
  PupilPixelBaseline,
} from "./types";

export const TARGET_ANGLE_DEG = 20;

const EPSILON = 1e-6;

const DEFAULT_TARGETS: FovCalibrationTarget[] = [
  { label: "center", x: 0, y: 0, angleDegX: 0, angleDegY: 0 },
  {
    label: "left",
    x: -1,
    y: 0,
    angleDegX: -TARGET_ANGLE_DEG,
    angleDegY: 0,
  },
  {
    label: "right",
    x: 1,
    y: 0,
    angleDegX: TARGET_ANGLE_DEG,
    angleDegY: 0,
  },
  {
    label: "up",
    x: 0,
    y: -1,
    angleDegX: 0,
    angleDegY: -TARGET_ANGLE_DEG,
  },
  {
    label: "down",
    x: 0,
    y: 1,
    angleDegX: 0,
    angleDegY: TARGET_ANGLE_DEG,
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Maps pupil pixel positions to calibrated gaze angles using per-eye gain factors.
 */
export class FovCalibrator {
  private model: FovCalibrationModel = {
    isCalibrated: false,
    leftBaseline: { x: 0, y: 0 },
    rightBaseline: { x: 0, y: 0 },
    faceTopNormalizedY: null,
    chinNormalizedY: null,
    kL: 0,
    kR: 0,
    kLY: 0,
    kRY: 0,
    samples: [],
  };

  getModel(): FovCalibrationModel {
    return this.model;
  }

  getRequiredTargets(): FovCalibrationTarget[] {
    return DEFAULT_TARGETS;
  }

  addSample(
    target: FovCalibrationTarget,
    leftRaw: Point2D,
    rightRaw: Point2D,
    faceTopNormalizedY?: number,
    chinNormalizedY?: number,
  ): void {
    const sample: FovCalibrationSample = {
      target,
      leftRaw,
      rightRaw,
      capturedAt: performance.now(),
    };

    const existingIndex = this.model.samples.findIndex(
      (item) => item.target.label === target.label,
    );

    if (existingIndex >= 0) {
      this.model.samples[existingIndex] = sample;
    } else {
      this.model.samples.push(sample);
    }

    if (
      target.label === "center" &&
      faceTopNormalizedY != null &&
      Number.isFinite(faceTopNormalizedY)
    ) {
      this.model.faceTopNormalizedY = faceTopNormalizedY;
    }

    if (
      target.label === "center" &&
      chinNormalizedY != null &&
      Number.isFinite(chinNormalizedY)
    ) {
      this.model.chinNormalizedY = chinNormalizedY;
    }

    this.model.isCalibrated = false;
  }

  /**
   * Computes per-eye gain factors from the 5-point calibration sequence.
   * k = TargetAngle_deg / (X_target - X_0)
   */
  calibrate(): boolean {
    const center = this.model.samples.find(
      (sample) => sample.target.label === "center",
    );
    const right = this.model.samples.find(
      (sample) => sample.target.label === "right",
    );
    const down = this.model.samples.find(
      (sample) => sample.target.label === "down",
    );

    if (!center || !right || !down) {
      return false;
    }

    if (this.model.samples.length < DEFAULT_TARGETS.length) {
      return false;
    }

    const x0Left = center.leftRaw.x;
    const y0Left = center.leftRaw.y;
    const x0Right = center.rightRaw.x;
    const y0Right = center.rightRaw.y;

    this.model.leftBaseline = { x: x0Left, y: y0Left };
    this.model.rightBaseline = { x: x0Right, y: y0Right };

    const deltaXLeft = right.leftRaw.x - x0Left;
    const deltaXRight = right.rightRaw.x - x0Right;
    const deltaYLeft = down.leftRaw.y - y0Left;
    const deltaYRight = down.rightRaw.y - y0Right;

    if (
      Math.abs(deltaXLeft) < EPSILON ||
      Math.abs(deltaXRight) < EPSILON ||
      Math.abs(deltaYLeft) < EPSILON ||
      Math.abs(deltaYRight) < EPSILON
    ) {
      return false;
    }

    this.model.kL = right.target.angleDegX / deltaXLeft;
    this.model.kR = right.target.angleDegX / deltaXRight;
    this.model.kLY = down.target.angleDegY / deltaYLeft;
    this.model.kRY = down.target.angleDegY / deltaYRight;
    this.model.isCalibrated = true;

    console.log("[FOV Calibration] k_L:", this.model.kL, "k_R:", this.model.kR);

    return true;
  }

  /**
   * Gaze_deg = (X_raw - X_0) * k
   * Uses the eye-specific horizontal and vertical gain factors.
   */
  getCalibratedGaze(
    rawX: number,
    rawY: number,
    eyeSide: EyeSide,
  ): CalibratedGazeDegrees | null {
    if (!this.model.isCalibrated) {
      return null;
    }

    const baseline =
      eyeSide === "left" ? this.model.leftBaseline : this.model.rightBaseline;
    const kHorizontal = eyeSide === "left" ? this.model.kL : this.model.kR;
    const kVertical = eyeSide === "left" ? this.model.kLY : this.model.kRY;

    return {
      xDeg: (rawX - baseline.x) * kHorizontal,
      yDeg: (rawY - baseline.y) * kVertical,
    };
  }

  /**
   * Projects binocular pupil positions onto the calibrated FOV plane (-1 to 1).
   */
  mapToFovPlane(leftRaw: Point2D, rightRaw: Point2D): FovGazePoint | null {
    const leftGaze = this.getCalibratedGaze(leftRaw.x, leftRaw.y, "left");
    const rightGaze = this.getCalibratedGaze(rightRaw.x, rightRaw.y, "right");

    if (!leftGaze || !rightGaze) {
      return null;
    }

    const xDeg = (leftGaze.xDeg + rightGaze.xDeg) / 2;
    const yDeg = (leftGaze.yDeg + rightGaze.yDeg) / 2;

    return {
      x: clamp(xDeg / TARGET_ANGLE_DEG, -1, 1),
      y: clamp(yDeg / TARGET_ANGLE_DEG, -1, 1),
    };
  }

  /**
   * Injects pre-computed gain factors from an external calibration source
   * (e.g. Stage 1 Prep) without running the on-page calibration routine.
   */
  injectGainFactors(params: {
    kL: number;
    kR: number;
    kLY: number;
    kRY: number;
    leftBaseline?: PupilPixelBaseline;
    rightBaseline?: PupilPixelBaseline;
    faceTopNormalizedY?: number | null;
    chinNormalizedY?: number | null;
  }): void {
    this.model.kL = params.kL;
    this.model.kR = params.kR;
    this.model.kLY = params.kLY;
    this.model.kRY = params.kRY;
    this.model.leftBaseline = params.leftBaseline ?? { x: 0, y: 0 };
    this.model.rightBaseline = params.rightBaseline ?? { x: 0, y: 0 };
    this.model.faceTopNormalizedY = params.faceTopNormalizedY ?? null;
    this.model.chinNormalizedY = params.chinNormalizedY ?? null;
    this.model.isCalibrated = true;
  }

  reset(): void {
    this.model = {
      isCalibrated: false,
      leftBaseline: { x: 0, y: 0 },
      rightBaseline: { x: 0, y: 0 },
      faceTopNormalizedY: null,
    chinNormalizedY: null,
      kL: 0,
      kR: 0,
      kLY: 0,
      kRY: 0,
      samples: [],
    };
  }
}
