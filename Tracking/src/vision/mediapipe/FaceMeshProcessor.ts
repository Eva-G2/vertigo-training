import type { Results } from "@mediapipe/face_mesh";
import type { EyeTrackingSample } from "@/types/eye-tracking";
import { TrackingService } from "@/services/tracking";
import { TrackingStateManager } from "@/services/tracking/TrackingStateManager";
import {
  acquireFaceMesh,
  sendFaceMeshFrame,
  type FaceMeshRuntimeOptions,
} from "./faceMeshSingleton";

export type FaceMeshProcessorConfig = {
  refineLandmarks: boolean;
  maxNumFaces: number;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
};

const DEFAULT_CONFIG: FaceMeshProcessorConfig = {
  refineLandmarks: true,
  maxNumFaces: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
};

export class FaceMeshProcessor {
  private config: FaceMeshProcessorConfig;
  private trackingService: TrackingService;
  private initialized = false;

  constructor(
    config: Partial<FaceMeshProcessorConfig> = {},
    trackingService?: TrackingService,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.trackingService = trackingService ?? new TrackingService();
  }

  getTrackingService(): TrackingService {
    return this.trackingService;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const runtimeOptions: FaceMeshRuntimeOptions = {
      refineLandmarks: this.config.refineLandmarks,
      maxNumFaces: this.config.maxNumFaces,
      minDetectionConfidence: this.config.minDetectionConfidence,
      minTrackingConfidence: this.config.minTrackingConfidence,
      selfieMode: true,
    };

    await acquireFaceMesh(runtimeOptions);
    this.initialized = true;
  }

  async processFrame(
    image: HTMLVideoElement | HTMLCanvasElement,
  ): Promise<Results | null> {
    if (!this.initialized) {
      throw new Error("FaceMeshProcessor is not initialized");
    }

    if (
      image instanceof HTMLVideoElement &&
      (image.videoWidth === 0 || image.videoHeight === 0)
    ) {
      return null;
    }

    return sendFaceMeshFrame(image);
  }

  resultsToSample(results: Results, timestamp: number): EyeTrackingSample | null {
    if (!TrackingStateManager.isActive) {
      return null;
    }

    return this.trackingService.resultsToSample(results, timestamp);
  }

  dispose(): void {
    this.initialized = false;
  }
}
