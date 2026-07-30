"use client";

import { useCallback, useEffect, useRef } from "react";
import { mapLandmarkToDisplay } from "@/vision/overlay/coordinateMap";
import { ShoulderMovementRecorder } from "@/services/analytics/shoulderMovementChart";

const POSE_VERSION = "0.5.1675469404";
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
/** 10px diameter green dots. */
const DOT_RADIUS_PX = 5;
const SHOULDER_DOT_COLOR = "#22c55e";
const MIN_VISIBILITY = 0.2;
const FRAME_INTERVAL_MS = 1000 / 12;

type PoseLandmark = {
  x: number;
  y: number;
  visibility?: number;
};

type PoseResults = {
  poseLandmarks?: PoseLandmark[];
};

type PoseInstance = {
  setOptions: (options: {
    selfieMode: boolean;
    modelComplexity: number;
    smoothLandmarks: boolean;
    enableSegmentation: boolean;
    minDetectionConfidence: number;
    minTrackingConfidence: number;
  }) => void;
  onResults: (callback: (results: PoseResults) => void) => void;
  initialize: () => Promise<void>;
  send: (input: {
    image: HTMLVideoElement | HTMLCanvasElement;
  }) => Promise<void>;
  close: () => Promise<void>;
};

type PoseConstructor = new (options: {
  locateFile: (file: string) => string;
}) => PoseInstance;

declare global {
  interface Window {
    Pose: PoseConstructor;
  }
}

type ShoulderPoseOverlayProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  active?: boolean;
  /** When true, append shoulder samples into the Stage 3 analytics recorder. */
  recording?: boolean;
};

function readConfidentShoulder(
  landmarks: PoseLandmark[] | undefined,
  index: number,
): { x: number; y: number } | null {
  const landmark = landmarks?.[index];
  if (!landmark) return null;
  if (landmark.visibility != null && landmark.visibility < MIN_VISIBILITY) {
    return null;
  }
  return { x: landmark.x, y: landmark.y };
}

function syncCanvasSize(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const context = canvas.getContext("2d");
  if (!context) return null;

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return context;
}

function drawShoulders(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  displayWidth: number,
  displayHeight: number,
  landmarks: PoseLandmark[] | undefined,
) {
  context.clearRect(0, 0, displayWidth, displayHeight);

  if (!landmarks?.length || video.videoWidth === 0 || video.videoHeight === 0) {
    return;
  }

  context.fillStyle = SHOULDER_DOT_COLOR;
  context.shadowColor = "rgba(0, 0, 0, 0.45)";
  context.shadowBlur = 2;

  for (const index of [LEFT_SHOULDER, RIGHT_SHOULDER]) {
    const landmark = landmarks[index];
    if (!landmark) continue;
    if (
      landmark.visibility != null &&
      landmark.visibility < MIN_VISIBILITY
    ) {
      continue;
    }

    const { x, y } = mapLandmarkToDisplay(
      landmark,
      video,
      displayWidth,
      displayHeight,
    );
    context.beginPath();
    context.arc(x, y, DOT_RADIUS_PX, 0, Math.PI * 2);
    context.fill();
  }

  context.shadowBlur = 0;
}

function loadPoseScript(assetBase: string): Promise<void> {
  if (window.Pose) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const selector = `script[data-mediapipe-pose="${assetBase}"]`;
    const existing = document.querySelector<HTMLScriptElement>(selector);

    const handleLoad = () =>
      window.Pose
        ? resolve()
        : reject(new Error("MediaPipe Pose is unavailable"));

    if (existing) {
      if (window.Pose) {
        resolve();
      } else {
        existing.addEventListener("load", handleLoad, { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("Failed to load MediaPipe Pose script")),
          { once: true },
        );
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `${assetBase}/pose.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.mediapipePose = assetBase;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Failed to load MediaPipe Pose script")),
      { once: true },
    );
    document.head.appendChild(script);
  });
}

/**
 * Draws 2px white dots on MediaPipe Pose left/right shoulder landmarks.
 * Intended for Stage 3 S3S1–S3S3 only; isolated from Face Mesh analytics.
 */
export function ShoulderPoseOverlay({
  videoRef,
  active = true,
  recording = false,
}: ShoulderPoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const landmarksRef = useRef<PoseLandmark[] | null>(null);
  const recordingRef = useRef(recording);

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  useEffect(() => {
    if (!active || !recording) {
      ShoulderMovementRecorder.stop();
      return;
    }

    ShoulderMovementRecorder.start();
    return () => {
      ShoulderMovementRecorder.stop();
    };
  }, [active, recording]);

  const renderOverlay = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!video || !canvas || !container || !active) return;

    const { clientWidth, clientHeight } = container;
    if (clientWidth === 0 || clientHeight === 0) return;

    const context = syncCanvasSize(canvas, clientWidth, clientHeight);
    if (!context) return;

    drawShoulders(
      context,
      video,
      clientWidth,
      clientHeight,
      landmarksRef.current ?? undefined,
    );
  }, [active, videoRef]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let animationFrameId: number | null = null;
    let pose: PoseInstance | null = null;
    let frameInFlight = false;
    let lastFrameAt = 0;

    const clearOverlay = () => {
      landmarksRef.current = null;
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const context = syncCanvasSize(
        canvas,
        container.clientWidth,
        container.clientHeight,
      );
      context?.clearRect(0, 0, container.clientWidth, container.clientHeight);
    };

    const loadPose = async () => {
      const assetBase = `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${POSE_VERSION}`;
      await loadPoseScript(assetBase);
      if (cancelled) return;

      pose = new window.Pose({
        locateFile: (file) => `${assetBase}/${file}`,
      });
      pose.setOptions({
        // Match CSS -scale-x-100 preview used by TrackingEnabledVideo / Stage 3.
        selfieMode: true,
        modelComplexity: 0,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      pose.onResults((results) => {
        if (cancelled) return;
        landmarksRef.current = results.poseLandmarks ?? null;
        if (recordingRef.current) {
          ShoulderMovementRecorder.pushSample(
            readConfidentShoulder(results.poseLandmarks, LEFT_SHOULDER),
            readConfidentShoulder(results.poseLandmarks, RIGHT_SHOULDER),
          );
        }
        renderOverlay();
      });
      await pose.initialize();
      if (cancelled) return;

      const processFrame = (now: number) => {
        if (cancelled) return;

        const video = videoRef.current;
        if (
          video &&
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          video.videoWidth > 0 &&
          video.videoHeight > 0 &&
          !frameInFlight &&
          now - lastFrameAt >= FRAME_INTERVAL_MS
        ) {
          frameInFlight = true;
          lastFrameAt = now;
          void pose!
            .send({ image: video })
            .catch((error) => {
              console.error("MediaPipe Pose frame failed", error);
              landmarksRef.current = null;
              renderOverlay();
            })
            .finally(() => {
              frameInFlight = false;
            });
        }

        animationFrameId = window.requestAnimationFrame(processFrame);
      };

      animationFrameId = window.requestAnimationFrame(processFrame);
    };

    void loadPose().catch((error) => {
      console.error("MediaPipe Pose failed to initialize", error);
      clearOverlay();
    });

    return () => {
      cancelled = true;
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      clearOverlay();
      void pose?.close();
    };
  }, [active, renderOverlay, videoRef]);

  useEffect(() => {
    if (!active) return;

    let frameId = 0;
    const draw = () => {
      renderOverlay();
      frameId = requestAnimationFrame(draw);
    };
    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [active, renderOverlay]);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container || !active) return;

    const resizeObserver = new ResizeObserver(() => {
      renderOverlay();
    });
    resizeObserver.observe(container);
    resizeObserver.observe(video);

    const handleMetadata = () => renderOverlay();
    video.addEventListener("loadedmetadata", handleMetadata);
    video.addEventListener("resize", handleMetadata);

    return () => {
      resizeObserver.disconnect();
      video.removeEventListener("loadedmetadata", handleMetadata);
      video.removeEventListener("resize", handleMetadata);
    };
  }, [active, renderOverlay, videoRef]);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-20"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
