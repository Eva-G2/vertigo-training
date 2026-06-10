import type { IrisLandmarkSet, Point3D } from "@/types/eye-tracking";
import { LANDMARKS } from "@/vision/mediapipe/landmarks";
import type { IrisIsolationResult, MediaPipeLandmark } from "./types";

/** Eye-region landmark indices used to bound each iris search area. */
const EYE_REGION = {
  left: [33, 133, 160, 159, 158, 157, 173, 155, 154, 153, 145, 144, 163, 7],
  right: [263, 362, 387, 386, 385, 384, 398, 382, 381, 380, 374, 373, 390, 249],
} as const;

/** Iris ring indices (requires refineLandmarks: true). */
const IRIS_BOUNDARY = {
  left: [469, 470, 471, 472],
  right: [474, 475, 476, 477],
} as const;

function toPoint3D(landmark: MediaPipeLandmark): Point3D {
  return { x: landmark.x, y: landmark.y, z: landmark.z ?? 0 };
}

function centroid(points: Point3D[]): Point3D {
  const total = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
      z: acc.z + point.z,
    }),
    { x: 0, y: 0, z: 0 },
  );

  const count = Math.max(points.length, 1);
  return {
    x: total.x / count,
    y: total.y / count,
    z: total.z / count,
  };
}

function isolateEyeIris(
  landmarks: MediaPipeLandmark[],
  eye: "left" | "right",
): IrisLandmarkSet {
  const regionIndices = EYE_REGION[eye];
  const irisCenterIndex =
    eye === "left" ? LANDMARKS.leftIrisCenter : LANDMARKS.rightIrisCenter;
  const boundaryIndices = IRIS_BOUNDARY[eye];

  const eyeRegionPoints = regionIndices.map((index) => toPoint3D(landmarks[index]));
  const eyeRegionCenter = centroid(eyeRegionPoints);

  const boundary = boundaryIndices.map((index) => toPoint3D(landmarks[index]));
  const centerLandmark = landmarks[irisCenterIndex]
    ? toPoint3D(landmarks[irisCenterIndex])
    : centroid(boundary);

  return {
    eye,
    center: centerLandmark,
    boundary,
    eyeRegionCenter,
  };
}

/**
 * Isolates iris landmarks from the surrounding eye region.
 * Returns per-eye center, boundary ring, and eye-socket reference center.
 */
export function isolateIrisLandmarks(
  landmarks: MediaPipeLandmark[],
): IrisIsolationResult {
  return {
    left: isolateEyeIris(landmarks, "left"),
    right: isolateEyeIris(landmarks, "right"),
  };
}
