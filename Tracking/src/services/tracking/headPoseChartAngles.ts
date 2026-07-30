import type { HeadMovementAngles, Point3D } from "@/types/eye-tracking";
import { LANDMARKS } from "@/vision/mediapipe/landmarks";
import type { MediaPipeLandmark } from "./types";

export type { HeadMovementAngles };

function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

function toPoint3D(landmark: MediaPipeLandmark): Point3D {
  return { x: landmark.x, y: landmark.y, z: landmark.z ?? 0 };
}

function subtract(a: Point3D, b: Point3D): Point3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function normalize(vector: Point3D): Point3D {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  };
}

function cross(a: Point3D, b: Point3D): Point3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

type HeadRotationMatrix = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

/**
 * Builds a head-orientation matrix from full Face Mesh landmarks
 * (outer eyes, forehead, chin) — used by pitch/yaw charts.
 * Rows: inter-ocular (right), chin→forehead (down-face), forward (toward camera).
 */
export function buildHeadOrientationMatrix(
  landmarks: MediaPipeLandmark[],
): HeadRotationMatrix {
  const leftEye = toPoint3D(landmarks[LANDMARKS.leftEyeOuter]);
  const rightEye = toPoint3D(landmarks[LANDMARKS.rightEyeOuter]);
  const forehead = toPoint3D(landmarks[LANDMARKS.forehead]);
  const chin = toPoint3D(landmarks[LANDMARKS.chin]);
  const xAxis = normalize(subtract(rightEye, leftEye));
  const yAxis = normalize(subtract(chin, forehead));
  const zAxis = normalize(cross(xAxis, yAxis));
  const yAxisOrtho = normalize(cross(zAxis, xAxis));

  return [
    [xAxis.x, yAxisOrtho.x, zAxis.x],
    [xAxis.y, yAxisOrtho.y, zAxis.y],
    [xAxis.z, yAxisOrtho.z, zAxis.z],
  ];
}

/**
 * Camera-aligned Euler extraction for vestibular head-movement charts.
 *
 * Uses the landmark orientation matrix (not the generic aerospace decomposition
 * in headPoseEstimation) so pitch tracks vertical nodding and yaw tracks turning.
 */
export function eulerFromHeadOrientationMatrix(
  matrix: HeadRotationMatrix,
): HeadMovementAngles {
  // Row 0 ≈ inter-ocular (right), row 1 ≈ down-face, row 2 ≈ forward.
  const pitchDeg = radToDeg(Math.atan2(matrix[1][2], matrix[2][2]));
  const yawDeg = radToDeg(Math.atan2(matrix[0][2], matrix[2][2]));
  const rollDeg = radToDeg(Math.atan2(matrix[0][1], matrix[0][0]));

  return {
    pitchDeg: Number.isFinite(pitchDeg) ? pitchDeg : 0,
    yawDeg: Number.isFinite(yawDeg) ? yawDeg : 0,
    rollDeg: Number.isFinite(rollDeg) ? rollDeg : 0,
  };
}

/**
 * Full Face Mesh head angles for Stage 2 pitch/yaw graphs.
 *
 * Uses the multi-landmark orientation matrix from outer eyes, forehead, and chin
 * (not Nasal Root–only or bony-subset ratios). No smoothing is applied.
 * VOR head velocity remains a separate nasal-root stream.
 */
export function computeHeadMovementAngles(
  landmarks: MediaPipeLandmark[],
): HeadMovementAngles {
  const matrix = buildHeadOrientationMatrix(landmarks);
  return eulerFromHeadOrientationMatrix(matrix);
}

/** @deprecated Prefer {@link computeHeadMovementAngles}; kept as an explicit alias. */
export function computeFullFaceHeadChartAngles(
  landmarks: MediaPipeLandmark[],
): HeadMovementAngles {
  return computeHeadMovementAngles(landmarks);
}
