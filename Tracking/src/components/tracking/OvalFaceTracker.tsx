import { FaceMeshOverlay } from "@/components/camera/FaceMeshOverlay";
import type { FaceLandmarkPoint } from "@/types/face-mesh-frame";

type OvalFaceTrackerProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarks: FaceLandmarkPoint[] | null;
  active: boolean;
};

/**
 * Renders the face bounding oval overlay from MediaPipe landmarks.
 */
export function OvalFaceTracker({
  videoRef,
  landmarks,
  active,
}: OvalFaceTrackerProps) {
  return (
    <FaceMeshOverlay
      videoRef={videoRef}
      landmarks={landmarks}
      active={active}
      ovalOnly
    />
  );
}
