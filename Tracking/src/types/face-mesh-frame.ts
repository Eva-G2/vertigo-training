export type FaceLandmarkPoint = {
  x: number;
  y: number;
  z?: number;
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
