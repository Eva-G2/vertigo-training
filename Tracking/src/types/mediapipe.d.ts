import type { FaceMesh } from "@mediapipe/face_mesh";
import type { Hands } from "@mediapipe/hands";

export {};

declare global {
  interface Window {
    FaceMesh: typeof FaceMesh;
    Hands: typeof Hands;
    matrixDataToMatrix?: (matrixData: unknown) => number[][];
  }
}
