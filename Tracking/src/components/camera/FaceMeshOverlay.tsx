import { useCallback, useEffect, useRef } from "react";
import type { FaceLandmarkPoint } from "@/types/face-mesh-frame";
import { drawFaceMeshOverlay } from "@/vision/overlay";

type FaceMeshOverlayProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarks: FaceLandmarkPoint[] | null;
  active: boolean;
  /** When true, only the two pupil + crosshairs are drawn. */
  pupilsOnly?: boolean;
  /** When true, only the face bounding oval is drawn. */
  ovalOnly?: boolean;
};

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

/**
 * Transparent canvas overlay aligned to the video feed. Draws a face bounding
 * oval and pupil crosshairs from MediaPipe Face Mesh landmarks in real time.
 */
export function FaceMeshOverlay({
  videoRef,
  landmarks,
  active,
  pupilsOnly = false,
  ovalOnly = false,
}: FaceMeshOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const landmarksRef = useRef(landmarks);

  landmarksRef.current = landmarks;

  const renderOverlay = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!video || !canvas || !container || !active) return;

    const { clientWidth, clientHeight } = container;
    if (clientWidth === 0 || clientHeight === 0) return;

    const context = syncCanvasSize(canvas, clientWidth, clientHeight);
    if (!context) return;

    drawFaceMeshOverlay(
      context,
      landmarksRef.current,
      video,
      clientWidth,
      clientHeight,
      { pupilsOnly, ovalOnly },
    );
  }, [active, ovalOnly, pupilsOnly, videoRef]);

  useEffect(() => {
    renderOverlay();
  }, [renderOverlay]);

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
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      />
    </div>
  );
}
