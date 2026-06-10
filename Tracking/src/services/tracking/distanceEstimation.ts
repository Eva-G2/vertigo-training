import {
  FACEMESH_LEFT_EYE,
  FACEMESH_RIGHT_EYE,
} from "@/vision/mediapipe/faceMeshConnections";
import type { MediaPipeLandmark } from "./types";

/** Average adult inter-pupillary distance (mm). */
export const STANDARD_IPD_MM = 63;

/** MediaPipe Face Mesh default vertical field of view (degrees). */
const MEDIAPIPE_VERTICAL_FOV_DEG = 63;

const MOVING_AVERAGE_WINDOW = 8;

function uniqueLandmarkIndices(
  connections: Array<[number, number]>,
): number[] {
  const indices = new Set<number>();
  for (const [start, end] of connections) {
    indices.add(start);
    indices.add(end);
  }
  return [...indices];
}

/** Eye-region indices derived from FACEMESH_TESSELATION subgroups. */
const LEFT_EYE_INDICES = uniqueLandmarkIndices(FACEMESH_LEFT_EYE);
const RIGHT_EYE_INDICES = uniqueLandmarkIndices(FACEMESH_RIGHT_EYE);

function averageLandmarkPoint(
  landmarks: MediaPipeLandmark[],
  indices: number[],
): { x: number; y: number } | null {
  if (indices.length === 0) {
    return null;
  }

  let x = 0;
  let y = 0;
  let count = 0;

  for (const index of indices) {
    const landmark = landmarks[index];
    if (!landmark) {
      continue;
    }
    x += landmark.x;
    y += landmark.y;
    count += 1;
  }

  if (count === 0) {
    return null;
  }

  return { x: x / count, y: y / count };
}

/**
 * Estimates camera-to-user distance (cm) from inter-pupillary distance in pixels.
 *
 * Uses eye-region landmarks from the MediaPipe face mesh tessellation and a
 * fixed 63 mm IPD with the default MediaPipe vertical FOV model.
 */
export function estimateDistance(
  landmarks: MediaPipeLandmark[],
  frameWidthPx: number,
  frameHeightPx: number,
): number | null {
  if (
    landmarks.length === 0 ||
    frameWidthPx <= 0 ||
    frameHeightPx <= 0
  ) {
    return null;
  }

  const leftCenter = averageLandmarkPoint(landmarks, LEFT_EYE_INDICES);
  const rightCenter = averageLandmarkPoint(landmarks, RIGHT_EYE_INDICES);
  if (!leftCenter || !rightCenter) {
    return null;
  }

  const ipdPx = Math.hypot(
    (rightCenter.x - leftCenter.x) * frameWidthPx,
    (rightCenter.y - leftCenter.y) * frameHeightPx,
  );

  if (ipdPx < 1) {
    return null;
  }

  const focalLengthPx =
    (frameHeightPx / 2) /
    Math.tan((MEDIAPIPE_VERTICAL_FOV_DEG / 2) * (Math.PI / 180));

  const distanceCm = (STANDARD_IPD_MM * focalLengthPx) / ipdPx / 10;
  return Number.isFinite(distanceCm) ? distanceCm : null;
}

export type DistanceRange = {
  optimalCm: number;
  minCm: number;
  maxCm: number;
};

/** Estimates physical screen width in centimeters from CSS pixels. */
export function estimateScreenWidthCm(): number {
  const cssWidth = window.screen.width / (window.devicePixelRatio || 1);
  const ppiEstimate = 96;
  return (cssWidth / ppiEstimate) * 2.54;
}

/**
 * Distance at which half the screen width subtends `targetAngleDeg` visual angle.
 * Used to gate calibration until the user is at arm's length for laptop screens.
 */
export function getOptimalDistanceRange(
  targetAngleDeg: number,
  screenWidthCm = estimateScreenWidthCm(),
  toleranceRatio = 0.15,
): DistanceRange {
  const halfWidthCm = screenWidthCm / 2;
  const optimalCm =
    halfWidthCm / Math.tan((targetAngleDeg * Math.PI) / 180);

  return {
    optimalCm,
    minCm: optimalCm * (1 - toleranceRatio),
    maxCm: optimalCm * (1 + toleranceRatio),
  };
}

export class DistanceSmoother {
  private readonly values: number[] = [];
  private readonly windowSize: number;

  constructor(windowSize = MOVING_AVERAGE_WINDOW) {
    this.windowSize = windowSize;
  }

  reset(): void {
    this.values.length = 0;
  }

  push(rawDistanceCm: number | null): number | null {
    if (rawDistanceCm === null) {
      return this.average();
    }

    this.values.push(rawDistanceCm);
    if (this.values.length > this.windowSize) {
      this.values.shift();
    }

    return this.average();
  }

  private average(): number | null {
    if (this.values.length === 0) {
      return null;
    }

    const sum = this.values.reduce((total, value) => total + value, 0);
    return sum / this.values.length;
  }
}
