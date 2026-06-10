import type { TrackingService } from "@/services/tracking";
import { FaceMeshProcessor } from "@/vision/mediapipe/FaceMeshProcessor";
import { enhanceFrameForTracking } from "@/vision/opencv/imageProcessing";
import { loadOpenCV } from "@/vision/opencv/OpenCVLoader";
import type {
  VisionPipelineCallbacks,
  VisionPipelineConfig,
  VisionPipelineResult,
  VisionPipelineStatus,
} from "./types";

const DEFAULT_CONFIG: VisionPipelineConfig = {
  refineLandmarks: true,
  maxNumFaces: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  enableOpenCvPreprocess: true,
};

export class VisionPipeline {
  private config: VisionPipelineConfig;
  private callbacks: VisionPipelineCallbacks;
  private faceMesh: FaceMeshProcessor;
  private preprocessCanvas: HTMLCanvasElement;
  private animationFrameId: number | null = null;
  private video: HTMLVideoElement | null = null;
  private status: VisionPipelineStatus = "idle";

  constructor(
    callbacks: VisionPipelineCallbacks,
    config: Partial<VisionPipelineConfig> = {},
  ) {
    this.callbacks = callbacks;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.faceMesh = new FaceMeshProcessor(this.config);
    this.preprocessCanvas = document.createElement("canvas");
  }

  private setStatus(status: VisionPipelineStatus): void {
    this.status = status;
    this.callbacks.onStatusChange(status);
  }

  async initialize(): Promise<void> {
    this.setStatus("loading");

    try {
      await this.faceMesh.initialize();

      if (this.config.enableOpenCvPreprocess) {
        await loadOpenCV();
      }

      this.setStatus("ready");
    } catch (error) {
      this.setStatus("error");
      this.callbacks.onError(
        error instanceof Error ? error : new Error("Vision pipeline init failed"),
      );
      throw error;
    }
  }

  start(video: HTMLVideoElement): void {
    if (this.status !== "ready" && this.status !== "running") {
      throw new Error("Vision pipeline must be ready before starting");
    }

    this.video = video;
    this.setStatus("running");
    this.tick();
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.video = null;
    if (this.status === "running") {
      this.setStatus("ready");
    }
  }

  dispose(): void {
    this.stop();
    this.faceMesh.dispose();
    if (this.status !== "error") {
      this.setStatus("idle");
    }
  }

  setCallbacks(callbacks: VisionPipelineCallbacks): void {
    this.callbacks = callbacks;
  }

  getStatus(): VisionPipelineStatus {
    return this.status;
  }

  getTrackingService(): TrackingService {
    return this.faceMesh.getTrackingService();
  }

  private tick = (): void => {
    if (!this.video || this.status !== "running") return;

    void this.processCurrentFrame().finally(() => {
      this.animationFrameId = requestAnimationFrame(this.tick);
    });
  };

  private async processCurrentFrame(): Promise<void> {
    if (
      !this.video ||
      this.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      this.video.videoWidth === 0 ||
      this.video.videoHeight === 0
    ) {
      return;
    }

    const timestamp = performance.now();
    let input: HTMLVideoElement | HTMLCanvasElement = this.video;

    if (this.config.enableOpenCvPreprocess) {
      enhanceFrameForTracking(this.video, this.preprocessCanvas);
      input = this.preprocessCanvas;
    }

    try {
      const results = await this.faceMesh.processFrame(input);
      if (!results) return;

      const sample = this.faceMesh.resultsToSample(results, timestamp);
      const rawLandmarks = results.multiFaceLandmarks?.[0] ?? null;
      const faceLandmarks = rawLandmarks
        ? rawLandmarks.map((landmark) => ({
            x: landmark.x,
            y: landmark.y,
            z: landmark.z,
          }))
        : null;
      const result: VisionPipelineResult = {
        sample,
        faceLandmarks,
        processedCanvas: this.config.enableOpenCvPreprocess
          ? this.preprocessCanvas
          : undefined,
      };

      this.callbacks.onResult(result);
    } catch (error) {
      this.callbacks.onError(
        error instanceof Error ? error : new Error("Frame processing failed"),
      );
    }
  }
}
