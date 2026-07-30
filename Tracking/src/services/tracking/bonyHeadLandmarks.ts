/**
 * Five high-stability bony Face Mesh landmarks for head-pose overlay / VOR.
 * Indices match MediaPipe Face Mesh topology.
 */
export const BONY_HEAD_LANDMARKS = {
  /** Nasal root / bridge — VOR tracking anchor (drawn green). */
  nasalRoot: 168,
  /** Left zygomatic (cheekbone). */
  leftZygomatic: 187,
  /** Right zygomatic (cheekbone). */
  rightZygomatic: 411,
  /** Forehead / glabella. */
  forehead: 10,
  /** Menton / chin. */
  menton: 152,
} as const;

export type BonyHeadLandmarkKey = keyof typeof BONY_HEAD_LANDMARKS;

export const BONY_HEAD_LANDMARK_ORDER: BonyHeadLandmarkKey[] = [
  "nasalRoot",
  "leftZygomatic",
  "rightZygomatic",
  "forehead",
  "menton",
];

/** White overlay dots (nasal root is drawn green separately). */
export const BONY_HEAD_WHITE_KEYS: BonyHeadLandmarkKey[] = [
  "forehead",
  "leftZygomatic",
  "rightZygomatic",
  "menton",
];

/** Minimum MediaPipe visibility/presence (or heuristic score) to draw a solid dot. */
export const BONY_LANDMARK_CONFIDENCE_THRESHOLD = 0.6;

/**
 * MediaPipe Face Mesh z is relative depth (smaller = closer to camera).
 * Landmarks farther behind the nasal root than this are treated as occluded /
 * facing away (profile turn). Tuned so forward-facing cheeks stay visible.
 */
export const FACE_MESH_OCCLUSION_Z_MARGIN = 0.035;

/** Consecutive low-score frames before a dot is hidden (anti-flicker). */
export const BONY_OVERLAY_HIDE_BUFFER_FRAMES = 2;

export type LandmarkWithConfidence = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
};

function mediaPipeVisibilityScore(
  landmark: LandmarkWithConfidence,
): number {
  return Math.max(
    Number.isFinite(landmark.visibility) ? landmark.visibility! : 0,
    Number.isFinite(landmark.presence) ? landmark.presence! : 0,
  );
}

/**
 * Trackability for any Face Mesh landmark index (full 468-point overlay).
 *
 * Why dots previously never hid: classic `@mediapipe/face_mesh` does not fill
 * `visibility` / `presence`, and it still emits estimated x/y/z for occluded
 * points. The old check only required finite in-frame x/y, so every point
 * stayed "visible". This uses z-depth vs the nasal root as a facing-away /
 * occlusion proxy when MediaPipe scores are missing.
 */
export function isFaceMeshLandmarkTrackable(
  landmark: LandmarkWithConfidence | undefined,
  allLandmarks: LandmarkWithConfidence[] | null | undefined,
  threshold = BONY_LANDMARK_CONFIDENCE_THRESHOLD,
): boolean {
  if (!landmark || !Number.isFinite(landmark.x) || !Number.isFinite(landmark.y)) {
    return false;
  }

  if (landmark.x < 0 || landmark.x > 1 || landmark.y < 0 || landmark.y > 1) {
    return false;
  }

  const fromMediaPipe = mediaPipeVisibilityScore(landmark);
  if (fromMediaPipe > 0) {
    return fromMediaPipe > threshold;
  }

  const z = Number.isFinite(landmark.z) ? landmark.z! : null;
  if (z == null) {
    // No depth channel → cannot detect profile occlusion reliably.
    return true;
  }

  const nasal = allLandmarks?.[BONY_HEAD_LANDMARKS.nasalRoot];
  const nasalZ =
    nasal && Number.isFinite(nasal.z) ? nasal.z! : null;
  if (nasalZ == null) {
    return true;
  }

  // Larger z than the nasal root ⇒ farther from camera ⇒ likely back/side.
  return z <= nasalZ + FACE_MESH_OCCLUSION_Z_MARGIN;
}

/**
 * Returns a 0–1 trackability score for named bony anchors.
 * Prefers MediaPipe visibility/presence when present; otherwise uses
 * depth relative to the nasal root.
 */
export function landmarkVisibilityScore(
  landmark: LandmarkWithConfidence | undefined,
  key: BonyHeadLandmarkKey,
  allLandmarks: LandmarkWithConfidence[] | null | undefined,
): number {
  if (!landmark || !Number.isFinite(landmark.x) || !Number.isFinite(landmark.y)) {
    return 0;
  }

  const fromMediaPipe = mediaPipeVisibilityScore(landmark);
  if (fromMediaPipe > 0) {
    return Math.min(1, fromMediaPipe);
  }

  if (landmark.x < 0 || landmark.x > 1 || landmark.y < 0 || landmark.y > 1) {
    return 0;
  }

  const z = Number.isFinite(landmark.z) ? landmark.z! : 0;
  const nasal = allLandmarks?.[BONY_HEAD_LANDMARKS.nasalRoot];
  const nasalZ = nasal && Number.isFinite(nasal.z) ? nasal.z! : z;
  const depthDelta = z - nasalZ;

  if (key === "nasalRoot") {
    return 1;
  }

  // Continuous score from depth behind the nasal root.
  if (depthDelta <= 0) {
    return 1;
  }

  const margin = FACE_MESH_OCCLUSION_Z_MARGIN;
  if (depthDelta >= margin * 2) {
    return 0;
  }

  return Math.max(0, 1 - depthDelta / (margin * 2));
}

export function isLandmarkConfident(
  landmark: LandmarkWithConfidence | undefined,
  key: BonyHeadLandmarkKey,
  allLandmarks: LandmarkWithConfidence[] | null | undefined,
  threshold = BONY_LANDMARK_CONFIDENCE_THRESHOLD,
): boolean {
  return landmarkVisibilityScore(landmark, key, allLandmarks) > threshold;
}
