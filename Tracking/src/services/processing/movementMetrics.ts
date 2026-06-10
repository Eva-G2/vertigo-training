import type { Point2D } from "@/types/eye-tracking";
import type { MovementRotation, MovementVelocity } from "./types";

function normalizeAngleDelta(deltaDeg: number): number {
  let normalized = deltaDeg;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}

export function computeMovementVelocity(
  previous: Point2D,
  current: Point2D,
  deltaMs: number,
): MovementVelocity {
  if (deltaMs <= 0) {
    return { x: 0, y: 0, speed: 0 };
  }

  const dtSec = deltaMs / 1000;
  const x = (current.x - previous.x) / dtSec;
  const y = (current.y - previous.y) / dtSec;

  return {
    x,
    y,
    speed: Math.hypot(x, y),
  };
}

export function computeMovementRotation(
  velocity: MovementVelocity,
  previousDirectionDeg: number | null,
  deltaMs: number,
): MovementRotation {
  if (velocity.speed < 1e-6) {
    return {
      directionDeg: previousDirectionDeg ?? 0,
      angularVelocityDegPerSec: 0,
    };
  }

  const directionDeg = (Math.atan2(velocity.y, velocity.x) * 180) / Math.PI;
  const angularVelocityDegPerSec =
    previousDirectionDeg === null || deltaMs <= 0
      ? 0
      : normalizeAngleDelta(directionDeg - previousDirectionDeg) /
        (deltaMs / 1000);

  return { directionDeg, angularVelocityDegPerSec };
}
