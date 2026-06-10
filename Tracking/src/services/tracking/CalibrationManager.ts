import {
  getOptimalDistanceRange,
  type DistanceRange,
} from "./distanceEstimation";
import { TARGET_ANGLE_DEG } from "./fovCalibration";

export type CalibrationPhase =
  | "idle"
  | "distance_check"
  | "collecting"
  | "complete";

export type CalibrationStatus =
  | "IDLE"
  | "DISTANCE_CHECK"
  | "COLLECTING"
  | "POINTS_COMPLETE"
  | "CALIBRATED";

export type DistanceFeedback =
  | "unknown"
  | "too_close"
  | "too_far"
  | "confirmed";

const CONFIRMATION_FRAMES = 20;

export class CalibrationManager {
  private phase: CalibrationPhase = "idle";
  private status: CalibrationStatus = "IDLE";
  private distanceConfirmed = false;
  private confirmationFrames = 0;
  private distanceRange: DistanceRange;

  constructor(targetAngleDeg = TARGET_ANGLE_DEG) {
    this.distanceRange = getOptimalDistanceRange(targetAngleDeg);
  }

  getPhase(): CalibrationPhase {
    return this.phase;
  }

  getStatus(): CalibrationStatus {
    return this.status;
  }

  getDistanceRange(): DistanceRange {
    return this.distanceRange;
  }

  isDistanceConfirmed(): boolean {
    return this.distanceConfirmed;
  }

  canCollect(): boolean {
    return this.phase === "collecting";
  }

  start(): void {
    this.phase = "distance_check";
    this.status = "DISTANCE_CHECK";
    this.distanceConfirmed = false;
    this.confirmationFrames = 0;
    this.distanceRange = getOptimalDistanceRange(TARGET_ANGLE_DEG);
  }

  reset(): void {
    this.phase = "idle";
    this.status = "IDLE";
    this.distanceConfirmed = false;
    this.confirmationFrames = 0;
  }

  /**
   * Updates pre-calibration distance feedback. Returns whether the manager
   * auto-advanced to COLLECTING after sustained in-range confirmation.
   */
  updateDistance(distanceCm: number | null): DistanceFeedback {
    if (this.phase !== "distance_check" && this.phase !== "collecting") {
      return "unknown";
    }

    if (distanceCm === null) {
      this.distanceConfirmed = false;
      this.confirmationFrames = 0;
      return "unknown";
    }

    const { minCm, maxCm } = this.distanceRange;

    if (distanceCm < minCm) {
      this.distanceConfirmed = false;
      this.confirmationFrames = 0;
      return "too_close";
    }

    if (distanceCm > maxCm) {
      this.distanceConfirmed = false;
      this.confirmationFrames = 0;
      return "too_far";
    }

    if (this.phase === "collecting") {
      this.distanceConfirmed = true;
      return "confirmed";
    }

    this.distanceConfirmed = true;
    this.confirmationFrames += 1;

    if (this.confirmationFrames >= CONFIRMATION_FRAMES) {
      this.phase = "collecting";
      this.status = "COLLECTING";
    }

    return "confirmed";
  }

  /**
   * Safety gate: blocks COLLECTING unless distance check has confirmed range.
   */
  tryEnterCollecting(): boolean {
    if (this.phase !== "distance_check" || !this.distanceConfirmed) {
      return false;
    }

    this.phase = "collecting";
    this.status = "COLLECTING";
    return true;
  }

  markComplete(): void {
    this.phase = "complete";
    this.status = "POINTS_COMPLETE";
  }

  markCalibrated(): void {
    this.phase = "complete";
    this.status = "CALIBRATED";
  }
}
