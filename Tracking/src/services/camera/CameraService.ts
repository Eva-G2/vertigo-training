import type { CameraConstraints, CameraInitResult, CameraStatus } from "./types";

const DEFAULT_CONSTRAINTS: CameraConstraints = {
  facingMode: "user",
  width: 1280,
  height: 720,
};

export class CameraService {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private status: CameraStatus = "idle";
  private statusListeners = new Set<(status: CameraStatus) => void>();

  getStatus(): CameraStatus {
    return this.status;
  }

  onStatusChange(listener: (status: CameraStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(status: CameraStatus): void {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  /**
   * Requests camera access and binds the stream to a video element.
   * Creates a detached video element when none is supplied.
   */
  async initialize(
    videoElement?: HTMLVideoElement,
    constraints: CameraConstraints = DEFAULT_CONSTRAINTS,
  ): Promise<CameraInitResult> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.setStatus("error");
      throw new Error("Camera API is unavailable in this environment");
    }

    this.setStatus("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: constraints.facingMode ?? DEFAULT_CONSTRAINTS.facingMode,
          width: { ideal: constraints.width ?? DEFAULT_CONSTRAINTS.width },
          height: { ideal: constraints.height ?? DEFAULT_CONSTRAINTS.height },
        },
        audio: false,
      });

      const video = videoElement ?? document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.srcObject = stream;
      await video.play();

      this.stream = stream;
      this.video = video;
      this.setStatus("active");

      return { stream, video };
    } catch {
      this.setStatus("denied");
      throw new Error("Camera permission denied or hardware unavailable");
    }
  }

  /** Attaches an already-active stream to a new video element. */
  attachToVideo(videoElement: HTMLVideoElement): HTMLVideoElement {
    if (!this.stream) {
      throw new Error("CameraService must be initialized before attaching video");
    }

    videoElement.srcObject = this.stream;
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.muted = true;
    void videoElement.play();
    this.video = videoElement;
    return videoElement;
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.video;
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;

    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }

    this.setStatus("idle");
  }
}
