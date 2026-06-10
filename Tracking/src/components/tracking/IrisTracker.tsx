import { FaceMeshOverlay } from "@/components/camera/FaceMeshOverlay";
import type { FaceLandmarkPoint } from "@/types/face-mesh-frame";

type IrisTrackerProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarks: FaceLandmarkPoint[] | null;
  active: boolean;
};

/**
 * Renders iris pupil crosshairs from MediaPipe iris landmarks.
 */
export function IrisTracker({
  videoRef,
  landmarks,
  active,
}: IrisTrackerProps) {
  return (
    <FaceMeshOverlay
      videoRef={videoRef}
      landmarks={landmarks}
      active={active}
      pupilsOnly
    />
  );
}
