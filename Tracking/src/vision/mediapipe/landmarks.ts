import type { EyeMetrics, HeadPose, Point2D } from "@/types/eye-tracking";

/** MediaPipe Face Mesh landmark indices for vestibular eye tracking. */
export const LANDMARKS = {
  noseTip: 1,
  chin: 152,
  forehead: 10,
  leftEyeOuter: 33,
  leftEyeInner: 133,
  rightEyeOuter: 263,
  rightEyeInner: 362,
  leftIrisCenter: 468,
  rightIrisCenter: 473,
} as const;

type Landmark = { x: number; y: number; z?: number };

function toPoint(landmark: Landmark): Point2D {
  return { x: landmark.x, y: landmark.y };
}

function computeEyeMetrics(
  iris: Point2D,
  outer: Point2D,
  inner: Point2D,
): EyeMetrics {
  const centerX = (outer.x + inner.x) / 2;
  const centerY = (outer.y + inner.y) / 2;
  const width = Math.max(Math.abs(inner.x - outer.x), 0.001);

  return {
    center: iris,
    horizontal: (iris.x - centerX) / (width / 2),
    vertical: (iris.y - centerY) / (width / 2),
  };
}

function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function estimateHeadPose(landmarks: Landmark[]): HeadPose {
  const nose = landmarks[LANDMARKS.noseTip];
  const chin = landmarks[LANDMARKS.chin];
  const forehead = landmarks[LANDMARKS.forehead];
  const leftEye = landmarks[LANDMARKS.leftEyeOuter];
  const rightEye = landmarks[LANDMARKS.rightEyeOuter];

  const roll = radToDeg(
    Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x),
  );
  const pitch = radToDeg(
    Math.atan2(forehead.y - chin.y, forehead.z! - chin.z!),
  );
  const yaw = radToDeg(
    Math.atan2(nose.x - (leftEye.x + rightEye.x) / 2, nose.z!),
  );

  return {
    roll,
    pitch: Number.isFinite(pitch) ? pitch : 0,
    yaw: Number.isFinite(yaw) ? yaw : 0,
  };
}

export function extractEyeMetrics(landmarks: Landmark[]): {
  leftEye: EyeMetrics;
  rightEye: EyeMetrics;
  headPose: HeadPose;
} | null {
  const leftIris = landmarks[LANDMARKS.leftIrisCenter];
  const rightIris = landmarks[LANDMARKS.rightIrisCenter];
  if (!leftIris || !rightIris) {
    return null;
  }

  const leftEye = computeEyeMetrics(
    toPoint(leftIris),
    toPoint(landmarks[LANDMARKS.leftEyeOuter]),
    toPoint(landmarks[LANDMARKS.leftEyeInner]),
  );

  const rightEye = computeEyeMetrics(
    toPoint(rightIris),
    toPoint(landmarks[LANDMARKS.rightEyeOuter]),
    toPoint(landmarks[LANDMARKS.rightEyeInner]),
  );

  return {
    leftEye,
    rightEye,
    headPose: estimateHeadPose(landmarks),
  };
}

export function computeGazeStability(
  leftEye: EyeMetrics,
  rightEye: EyeMetrics,
): number {
  const horizontalDelta = Math.abs(leftEye.horizontal - rightEye.horizontal);
  const verticalDelta = Math.abs(leftEye.vertical - rightEye.vertical);
  const combined = horizontalDelta + verticalDelta;
  return Math.max(0, 1 - combined);
}
