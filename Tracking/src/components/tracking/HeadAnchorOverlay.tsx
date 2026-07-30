import { useCallback, useEffect, useRef } from "react";
import type { FaceLandmarkPoint } from "@/types/face-mesh-frame";
import { drawBonyHeadAnchorOverlay } from "@/vision/overlay/bonyHeadAnchorOverlay";

type HeadAnchorOverlayProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarks: FaceLandmarkPoint[] | null;
  active: boolean;
  /** When false, hides the white Face Mesh dots (green nasal root stays). */
  showWhiteMeshDots?: boolean;
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
 * Canvas overlay: 2px white dots on all Face Mesh landmarks used for head
 * pitch/yaw, plus a 5px green nasal root (168) for VOR.
 * Dots hide when a landmark is not confidently tracked.
 */
export function HeadAnchorOverlay({
  videoRef,
  landmarks,
  active,
  showWhiteMeshDots = true,
}: HeadAnchorOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const landmarksRef = useRef(landmarks);
  const showWhiteMeshDotsRef = useRef(showWhiteMeshDots);

  landmarksRef.current = landmarks;
  showWhiteMeshDotsRef.current = showWhiteMeshDots;

  const renderOverlay = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!video || !canvas || !container || !active) return;

    const { clientWidth, clientHeight } = container;
    if (clientWidth === 0 || clientHeight === 0) return;

    const context = syncCanvasSize(canvas, clientWidth, clientHeight);
    if (!context) return;

    drawBonyHeadAnchorOverlay(
      context,
      landmarksRef.current,
      video,
      clientWidth,
      clientHeight,
      { showWhiteMeshDots: showWhiteMeshDotsRef.current },
    );
  }, [active, videoRef]);

  useEffect(() => {
    renderOverlay();
  }, [renderOverlay, showWhiteMeshDots]);

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
