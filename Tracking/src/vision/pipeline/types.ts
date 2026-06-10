import type { EyeTrackingSample } from "@/types/eye-tracking";
import type { FaceLandmarkPoint } from "@/types/face-mesh-frame";

export type VisionPipelineStatus =
  | "idle"
  | "loading"
  | "ready"
  | "running"
  | "error";

export type VisionPipelineConfig = {
  refineLandmarks: boolean;
  maxNumFaces: number;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
  enableOpenCvPreprocess: boolean;
};

export type VisionFrameInput = {
  video: HTMLVideoElement;
  timestamp: number;
};

export type VisionPipelineResult = {
  sample: EyeTrackingSample;
  faceLandmarks: FaceLandmarkPoint[] | null;
  processedCanvas?: HTMLCanvasElement;
};

export type VisionPipelineCallbacks = {
  onResult: (result: VisionPipelineResult) => void;
  onStatusChange: (status: VisionPipelineStatus) => void;
  onError: (error: Error) => void;
};
