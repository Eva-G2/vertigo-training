import { LANDMARKS } from "@/vision/mediapipe/landmarks";
import type { FaceLandmarkBoundingBox, FaceLandmarkPoint } from "@/types/face-mesh-frame";
import { computeLandmarkBoundingBox } from "./boundingBox";
import { mapLandmarkToDisplay } from "./coordinateMap";

const OVERLAY_STYLE = {
  stroke: "#ffffff",
  lineWidth: 2,
  crosshairArm: 10,
} as const;

function drawCrosshair(
  context: CanvasRenderingContext2D,
  landmark: FaceLandmarkPoint,
  video: HTMLVideoElement,
  displayWidth: number,
  displayHeight: number,
  arm: number,
): void {
  const { x, y } = mapLandmarkToDisplay(
    landmark,
    video,
    displayWidth,
    displayHeight,
  );

  context.beginPath();
  context.moveTo(x - arm, y);
  context.lineTo(x + arm, y);
  context.moveTo(x, y - arm);
  context.lineTo(x, y + arm);
  context.stroke();
}

function drawFaceOval(
  context: CanvasRenderingContext2D,
  boundingBox: FaceLandmarkBoundingBox,
  video: HTMLVideoElement,
  displayWidth: number,
  displayHeight: number,
): void {
  const topLeft = mapLandmarkToDisplay(
    { x: boundingBox.xMin, y: boundingBox.yMin },
    video,
    displayWidth,
    displayHeight,
  );
  const bottomRight = mapLandmarkToDisplay(
    { x: boundingBox.xMax, y: boundingBox.yMax },
    video,
    displayWidth,
    displayHeight,
  );

  const centerX = (topLeft.x + bottomRight.x) / 2;
  const centerY = (topLeft.y + bottomRight.y) / 2;
  const radiusX = Math.abs(bottomRight.x - topLeft.x) / 2;
  const radiusY = Math.abs(bottomRight.y - topLeft.y) / 2;

  context.beginPath();
  context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  context.stroke();
}

export type FaceMeshOverlayOptions = {
  /** When true, only draws the two pupil + crosshairs (no face oval). */
  pupilsOnly?: boolean;
  /** When true, only draws the face bounding oval (no pupil crosshairs). */
  ovalOnly?: boolean;
};

/**
 * Renders Face Mesh debug overlays: face bounding oval and pupil crosshairs.
 */
export function drawFaceMeshOverlay(
  context: CanvasRenderingContext2D,
  landmarks: FaceLandmarkPoint[] | null,
  video: HTMLVideoElement,
  displayWidth: number,
  displayHeight: number,
  options: FaceMeshOverlayOptions = {},
): void {
  context.clearRect(0, 0, displayWidth, displayHeight);

  if (!landmarks?.length) return;

  const leftPupil = landmarks[LANDMARKS.leftIrisCenter];
  const rightPupil = landmarks[LANDMARKS.rightIrisCenter];
  if (!leftPupil && !rightPupil) return;

  const drawOval = !options.pupilsOnly;
  const drawPupils = !options.ovalOnly;

  if (drawOval) {
    const boundingBox = computeLandmarkBoundingBox(landmarks);
    if (boundingBox) {
      context.save();
      context.strokeStyle = OVERLAY_STYLE.stroke;
      context.lineWidth = OVERLAY_STYLE.lineWidth;
      drawFaceOval(context, boundingBox, video, displayWidth, displayHeight);
      context.restore();
    }
  }

  if (!drawPupils) return;

  context.save();
  context.strokeStyle = OVERLAY_STYLE.stroke;
  context.lineWidth = OVERLAY_STYLE.lineWidth;
  context.shadowColor = "rgba(0, 0, 0, 0.45)";
  context.shadowBlur = 2;

  if (leftPupil) {
    drawCrosshair(
      context,
      leftPupil,
      video,
      displayWidth,
      displayHeight,
      OVERLAY_STYLE.crosshairArm,
    );
  }
  if (rightPupil) {
    drawCrosshair(
      context,
      rightPupil,
      video,
      displayWidth,
      displayHeight,
      OVERLAY_STYLE.crosshairArm,
    );
  }

  context.restore();
}
