import type { FaceMesh } from "@mediapipe/face_mesh";

export {};

declare global {
  interface Window {
    FaceMesh: typeof FaceMesh;
    matrixDataToMatrix?: (matrixData: unknown) => number[][];
  }
}
