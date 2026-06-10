import type { MovementComparisonRecord } from "@/services/processing/types";
import {
  MAX_DEVIATION_DEGREES,
  normalizedToDegrees,
} from "@/services/processing/degreesConversion";
import { computeMovementVelocity } from "@/services/processing/movementMetrics";
import type { Point2D } from "@/types/eye-tracking";
import type { SaccadeDetectionConfig, SaccadeEvent } from "./types";

export const DEFAULT_SACCADE_CONFIG: SaccadeDetectionConfig = {
  velocityThresholdDegPerSec: 40,
};

function normalizedSpeedToDegreesPerSec(
  speed: number,
  stimulusAmplitude: number,
): number {
  if (stimulusAmplitude <= 0) return 0;
  return (speed / stimulusAmplitude) * MAX_DEVIATION_DEGREES;
}

function toPositionDeg(
  point: Point2D,
  stimulusAmplitude: number,
): Point2D {
  return {
    x: normalizedToDegrees(point.x, stimulusAmplitude),
    y: normalizedToDegrees(point.y, stimulusAmplitude),
  };
}

function detectEyeSaccades(
  records: MovementComparisonRecord[],
  eye: "left" | "right",
  stimulusAmplitude: number,
  config: SaccadeDetectionConfig,
): SaccadeEvent[] {
  const saccades: SaccadeEvent[] = [];

  for (let index = 1; index < records.length; index += 1) {
    const previous = records[index - 1]!;
    const current = records[index]!;
    const deltaMs = current.timestamp - previous.timestamp;
    if (deltaMs <= 0) continue;

    const previousPoint = eye === "left" ? previous.leftEye : previous.rightEye;
    const currentPoint = eye === "left" ? current.leftEye : current.rightEye;

    const velocity = computeMovementVelocity(
      previousPoint,
      currentPoint,
      deltaMs,
    );
    const speedDegPerSec = normalizedSpeedToDegreesPerSec(
      velocity.speed,
      stimulusAmplitude,
    );

    if (speedDegPerSec >= config.velocityThresholdDegPerSec) {
      saccades.push({
        recordIndex: index,
        elapsedMs: current.elapsedMs,
        eye,
        speedDegPerSec,
        positionDeg: toPositionDeg(currentPoint, stimulusAmplitude),
      });
    }
  }

  return saccades;
}

/**
 * Identifies saccades as rapid eye movements where per-eye velocity
 * exceeds the configured degrees-per-second threshold.
 */
export function detectSaccades(
  records: MovementComparisonRecord[],
  stimulusAmplitude: number,
  config: SaccadeDetectionConfig = DEFAULT_SACCADE_CONFIG,
): SaccadeEvent[] {
  return [
    ...detectEyeSaccades(records, "left", stimulusAmplitude, config),
    ...detectEyeSaccades(records, "right", stimulusAmplitude, config),
  ].sort((a, b) => a.elapsedMs - b.elapsedMs);
}
