import type { FaceLandmarkPoint } from "@/types/face-mesh-frame";

export type DisplayPoint = {
  x: number;
  y: number;
};

/**
 * Maps a normalized MediaPipe landmark to canvas coordinates, accounting for
 * CSS object-cover cropping on the video element.
 *
 * With MediaPipe selfieMode enabled, landmarks are in mirror-view space. The
 * video element is horizontally flipped via CSS so the preview matches; the
 * overlay canvas stays unflipped and draws landmarks directly.
 */
export function mapLandmarkToDisplay(
  landmark: FaceLandmarkPoint,
  video: HTMLVideoElement,
  displayWidth: number,
  displayHeight: number,
): DisplayPoint {
  const videoWidth = video.videoWidth || displayWidth;
  const videoHeight = video.videoHeight || displayHeight;

  const scale = Math.max(displayWidth / videoWidth, displayHeight / videoHeight);
  const renderedWidth = videoWidth * scale;
  const renderedHeight = videoHeight * scale;
  const offsetX = (displayWidth - renderedWidth) / 2;
  const offsetY = (displayHeight - renderedHeight) / 2;

  return {
    x: landmark.x * videoWidth * scale + offsetX,
    y: landmark.y * videoHeight * scale + offsetY,
  };
}
