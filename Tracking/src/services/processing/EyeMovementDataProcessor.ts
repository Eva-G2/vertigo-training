import type { EyeTrackingSample, Point2D } from "@/types/eye-tracking";
import { TrackingStateManager } from "@/services/tracking/TrackingStateManager";
import {
  computeMovementRotation,
  computeMovementVelocity,
} from "./movementMetrics";
import {
  serializeChartJsExport,
  toChartJsMovementExport,
} from "./chartJsExport";
import { DEFAULT_SINE_STIMULUS, getSineWaveTargetPosition } from "./targetStimulus";
import type {
  ChartJsMovementExport,
  IrisPositionRecord,
  MovementComparisonRecord,
  SineWaveStimulusConfig,
} from "./types";

function extractRawLeftEyePosition(sample: EyeTrackingSample): Point2D | null {
  if (!sample.leftIris) return null;
  return { ...sample.leftIris.offsetFromEyeCenter };
}

function extractRawRightEyePosition(sample: EyeTrackingSample): Point2D | null {
  if (!sample.rightIris) return null;
  return { ...sample.rightIris.offsetFromEyeCenter };
}

function extractCorrectedLeftEye(sample: EyeTrackingSample): Point2D | null {
  if (sample.leftEyeCorrected == null) return null;
  return {
    x: sample.leftEyeCorrected.horizontal,
    y: sample.leftEyeCorrected.vertical,
  };
}

function extractCorrectedRightEye(sample: EyeTrackingSample): Point2D | null {
  if (sample.rightEyeCorrected == null) return null;
  return {
    x: sample.rightEyeCorrected.horizontal,
    y: sample.rightEyeCorrected.vertical,
  };
}

function averageEyes(left: Point2D, right: Point2D): Point2D {
  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
  };
}

/**
 * Records iris center coordinates over time, derives velocity and rotation,
 * and compares actual gaze against a sine-wave target stimulus path.
 */
export class EyeMovementDataProcessor {
  private active = false;
  private startedAt = 0;
  private endedAt = 0;
  private stimulus: SineWaveStimulusConfig = DEFAULT_SINE_STIMULUS;
  private irisRecords: IrisPositionRecord[] = [];
  private comparisonRecords: MovementComparisonRecord[] = [];
  private previousDirectionDeg: number | null = null;

  start(stimulus: Partial<SineWaveStimulusConfig> = {}): void {
    this.stimulus = { ...DEFAULT_SINE_STIMULUS, ...stimulus };
    this.startedAt = performance.now();
    this.endedAt = 0;
    this.active = true;
    this.irisRecords = [];
    this.comparisonRecords = [];
    this.previousDirectionDeg = null;
  }

  stop(): void {
    this.active = false;
    this.endedAt = performance.now();
  }

  isActive(): boolean {
    return this.active;
  }

  getStimulusConfig(): SineWaveStimulusConfig {
    return this.stimulus;
  }

  /**
   * Records per-eye iris X/Y from a tracking sample and appends comparison
   * data against the target sine-wave path.
   */
  record(sample: EyeTrackingSample): MovementComparisonRecord | null {
    if (!TrackingStateManager.isActive) {
      return null;
    }

    if (!this.active || !sample.faceDetected) {
      return null;
    }

    const leftEye = extractRawLeftEyePosition(sample);
    const rightEye = extractRawRightEyePosition(sample);
    const correctedLeftEye = extractCorrectedLeftEye(sample);
    const correctedRightEye = extractCorrectedRightEye(sample);
    if (!leftEye || !rightEye) return null;

    const actual = averageEyes(leftEye, rightEye);
    const correctedActual =
      correctedLeftEye && correctedRightEye
        ? averageEyes(correctedLeftEye, correctedRightEye)
        : null;
    const elapsedMs = sample.timestamp - this.startedAt;
    const target = getSineWaveTargetPosition(elapsedMs, this.stimulus);

    const previous = this.irisRecords.at(-1);
    const deltaMs = previous ? sample.timestamp - previous.timestamp : 0;

    const velocity = previous
      ? computeMovementVelocity(previous.actual, actual, deltaMs)
      : { x: 0, y: 0, speed: 0 };

    const rotation = computeMovementRotation(
      velocity,
      this.previousDirectionDeg,
      deltaMs,
    );
    this.previousDirectionDeg = rotation.directionDeg;

    const errorVector = {
      x: actual.x - target.x,
      y: actual.y - target.y,
      magnitude: Math.hypot(actual.x - target.x, actual.y - target.y),
    };

    const irisRecord: IrisPositionRecord = {
      timestamp: sample.timestamp,
      elapsedMs,
      actual,
    };
    this.irisRecords.push(irisRecord);

    const comparison: MovementComparisonRecord = {
      timestamp: sample.timestamp,
      elapsedMs,
      target,
      leftEye,
      rightEye,
      correctedLeftEye,
      correctedRightEye,
      actual,
      correctedActual,
      error: errorVector,
      velocity,
      rotation,
    };
    this.comparisonRecords.push(comparison);
    return comparison;
  }

  getIrisRecords(): IrisPositionRecord[] {
    return this.irisRecords;
  }

  compareAgainstTargetStimulus(): MovementComparisonRecord[] {
    return this.comparisonRecords;
  }

  toChartJsExport(): ChartJsMovementExport {
    return toChartJsMovementExport(
      this.comparisonRecords,
      this.stimulus,
      this.startedAt,
      this.endedAt || performance.now(),
    );
  }

  toJSON(): string {
    return serializeChartJsExport(this.toChartJsExport());
  }

  reset(): void {
    this.active = false;
    this.startedAt = 0;
    this.endedAt = 0;
    this.irisRecords = [];
    this.comparisonRecords = [];
    this.previousDirectionDeg = null;
  }
}
