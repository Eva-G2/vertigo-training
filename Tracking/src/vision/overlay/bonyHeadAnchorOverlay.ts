import {
  BONY_HEAD_LANDMARKS,
  BONY_OVERLAY_HIDE_BUFFER_FRAMES,
  isFaceMeshLandmarkTrackable,
  isLandmarkConfident,
  type LandmarkWithConfidence,
} from "@/services/tracking/bonyHeadLandmarks";
import type { FaceLandmarkPoint } from "@/types/face-mesh-frame";
import { mapLandmarkToDisplay } from "./coordinateMap";

const WHITE_DOT_RADIUS_PX = 1; // 2px diameter
const GREEN_DOT_RADIUS_PX = 2.5; // 5px diameter
const NASAL_ROOT_COLOR = "#22c55e";
const WHITE_DOT_COLOR = "#ffffff";

/** Classic Face Mesh topology size used for head pitch / yaw. */
export const FACE_MESH_LANDMARK_COUNT = 468;

type HideBufferState = {
  frames: Int16Array;
};

const hideBuffers = new WeakMap<object, HideBufferState>();

function getHideBuffer(
  context: CanvasRenderingContext2D,
  landmarkCount: number,
): HideBufferState {
  let state = hideBuffers.get(context);
  if (!state || state.frames.length < landmarkCount) {
    state = {
      frames: new Int16Array(Math.max(landmarkCount, FACE_MESH_LANDMARK_COUNT)),
    };
    hideBuffers.set(context, state);
  }
  return state;
}

function shouldDrawLandmarkIndex(
  context: CanvasRenderingContext2D,
  index: number,
  landmarkCount: number,
  confident: boolean,
): boolean {
  const buffer = getHideBuffer(context, landmarkCount);
  if (confident) {
    buffer.frames[index] = 0;
    return true;
  }

  const lostFrames = (buffer.frames[index] ?? 0) + 1;
  buffer.frames[index] = lostFrames;
  return lostFrames < BONY_OVERLAY_HIDE_BUFFER_FRAMES;
}

/**
 * Draws full Face Mesh tracking anchors for head pitch / yaw:
 * - 2px white dots on all mesh landmarks (up to 468), optional
 * - 5px green dot on nasal root (168) for VOR
 *
 * Dots disappear when a landmark is not confidently tracked (MediaPipe
 * visibility when available; otherwise z-depth vs nasal root).
 */
export function drawBonyHeadAnchorOverlay(
  context: CanvasRenderingContext2D,
  landmarks: FaceLandmarkPoint[] | null,
  video: HTMLVideoElement,
  displayWidth: number,
  displayHeight: number,
  options: { showWhiteMeshDots?: boolean } = {},
): void {
  context.clearRect(0, 0, displayWidth, displayHeight);

  if (!landmarks?.length) {
    return;
  }

  const showWhiteMeshDots = options.showWhiteMeshDots !== false;
  const typed = landmarks as LandmarkWithConfidence[];
  const meshCount = Math.min(typed.length, FACE_MESH_LANDMARK_COUNT);
  const nasalIndex = BONY_HEAD_LANDMARKS.nasalRoot;

  context.save();

  if (showWhiteMeshDots) {
    context.fillStyle = WHITE_DOT_COLOR;
    for (let index = 0; index < meshCount; index += 1) {
      if (index === nasalIndex) {
        continue;
      }

      const landmark = typed[index];
      const confident = isFaceMeshLandmarkTrackable(landmark, typed);
      if (
        !shouldDrawLandmarkIndex(context, index, meshCount, confident) ||
        !landmark
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
      context.arc(x, y, WHITE_DOT_RADIUS_PX, 0, Math.PI * 2);
      context.fill();
    }
  }

  const nasal = typed[nasalIndex];
  const nasalConfident = isLandmarkConfident(nasal, "nasalRoot", typed);
  if (
    shouldDrawLandmarkIndex(context, nasalIndex, meshCount, nasalConfident) &&
    nasal
  ) {
    const { x, y } = mapLandmarkToDisplay(
      nasal,
      video,
      displayWidth,
      displayHeight,
    );
    context.shadowColor = "rgba(0, 0, 0, 0.45)";
    context.shadowBlur = 2;
    context.beginPath();
    context.arc(x, y, GREEN_DOT_RADIUS_PX, 0, Math.PI * 2);
    context.fillStyle = NASAL_ROOT_COLOR;
    context.fill();
  }

  context.restore();
}
