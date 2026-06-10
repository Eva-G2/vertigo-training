import type { Results } from "@mediapipe/face_mesh";
import type { HeadPose3D, Point3D } from "@/types/eye-tracking";
import { LANDMARKS } from "@/vision/mediapipe/landmarks";
import type {
  HeadPoseEstimationResult,
  MediaPipeLandmark,
} from "./types";

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

function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

function rotationMatrixToEuler(
  matrix: HeadPose3D["rotationMatrix"],
): Pick<HeadPose3D, "roll" | "pitch" | "yaw"> {
  const sy = Math.sqrt(matrix[0][0] ** 2 + matrix[1][0] ** 2);
  const singular = sy < 1e-6;

  let roll: number;
  let pitch: number;
  let yaw: number;

  if (!singular) {
    roll = radToDeg(Math.atan2(matrix[2][1], matrix[2][2]));
    pitch = radToDeg(Math.atan2(-matrix[2][0], sy));
    yaw = radToDeg(Math.atan2(matrix[1][0], matrix[0][0]));
  } else {
    roll = radToDeg(Math.atan2(-matrix[1][2], matrix[1][1]));
    pitch = radToDeg(Math.atan2(-matrix[2][0], sy));
    yaw = 0;
  }

  return { roll, pitch, yaw };
}

function buildRotationMatrixFromLandmarks(
  landmarks: MediaPipeLandmark[],
): HeadPose3D["rotationMatrix"] {
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

function poseFromRotationMatrix(
  rotationMatrix: HeadPose3D["rotationMatrix"],
  translation: Point3D,
): HeadPose3D {
  const euler = rotationMatrixToEuler(rotationMatrix);
  return {
    ...euler,
    rotationMatrix,
    translation,
  };
}

function poseFromFaceGeometry(results: Results): HeadPose3D | null {
  const geometry = results.multiFaceGeometry?.[0];
  const matrixData = geometry?.getPoseTransformMatrix?.();
  if (!matrixData || !window.matrixDataToMatrix) return null;

  const matrix = window.matrixDataToMatrix(matrixData);
  if (matrix.length < 3 || matrix[0].length < 3) return null;

  const rotationMatrix: HeadPose3D["rotationMatrix"] = [
    [matrix[0][0], matrix[0][1], matrix[0][2]],
    [matrix[1][0], matrix[1][1], matrix[1][2]],
    [matrix[2][0], matrix[2][1], matrix[2][2]],
  ];

  const translation: Point3D = {
    x: matrix[0][3] ?? 0,
    y: matrix[1][3] ?? 0,
    z: matrix[2][3] ?? 0,
  };

  return poseFromRotationMatrix(rotationMatrix, translation);
}

/**
 * Estimates 3D head pose from MediaPipe Face Mesh results.
 * Prefers the face-geometry transform matrix when available, otherwise
 * derives orientation from stable facial landmarks.
 */
export function estimateHeadPose3D(
  results: Results,
  landmarks: MediaPipeLandmark[],
): HeadPoseEstimationResult {
  const geometryPose = poseFromFaceGeometry(results);
  if (geometryPose) {
    return { pose: geometryPose, usedFaceGeometry: true };
  }

  const leftEye = toPoint3D(landmarks[LANDMARKS.leftEyeOuter]);
  const rightEye = toPoint3D(landmarks[LANDMARKS.rightEyeOuter]);
  const translation: Point3D = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2,
    z: (leftEye.z + rightEye.z) / 2,
  };

  const rotationMatrix = buildRotationMatrixFromLandmarks(landmarks);
  return {
    pose: poseFromRotationMatrix(rotationMatrix, translation),
    usedFaceGeometry: false,
  };
}
