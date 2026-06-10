import type { FaceLandmarkBoundingBox, FaceLandmarkPoint } from "@/types/face-mesh-frame";

/**
 * Computes an axis-aligned bounding box from normalized face mesh landmarks.
 * Mirrors the bounding_box output used by MediaPipe face detection pipelines.
 */
export function computeLandmarkBoundingBox(
  landmarks: FaceLandmarkPoint[],
): FaceLandmarkBoundingBox | null {
  if (landmarks.length === 0) return null;

  let xMin = 1;
  let yMin = 1;
  let xMax = 0;
  let yMax = 0;

  for (const landmark of landmarks) {
    xMin = Math.min(xMin, landmark.x);
    yMin = Math.min(yMin, landmark.y);
    xMax = Math.max(xMax, landmark.x);
    yMax = Math.max(yMax, landmark.y);
  }

  const centerX = (xMin + xMax) / 2;
  const centerY = (yMin + yMax) / 2;

  return {
    xMin,
    yMin,
    xMax,
    yMax,
    centerX,
    centerY,
    radiusX: (xMax - xMin) / 2,
    radiusY: (yMax - yMin) / 2,
  };
}
