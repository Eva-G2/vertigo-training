export type FaceLandmarkPoint = {
  x: number;
  y: number;
  z?: number;
  /** MediaPipe visibility score when provided (0–1). */
  visibility?: number;
  /** MediaPipe presence score when provided (0–1). */
  presence?: number;
};

export type FaceLandmarkBoundingBox = {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
};
