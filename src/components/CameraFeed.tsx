"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CameraPermissionModal } from "./CameraPermissionModal";
import { HeadSilhouetteOverlay } from "./HeadSilhouetteOverlay";
import { ShoulderPoseOverlay } from "./ShoulderPoseOverlay";
import { useApp } from "./providers/AppProvider";
import { t } from "@/lib/i18n";

type CameraFeedProps = {
  showBottomMarker?: boolean;
  /**
   * Mirror the live preview horizontally (same correction as Stage 1/2
   * TrackingEnabledVideo / calibration camera).
   */
  mirrorPreview?: boolean;
  /**
   * Keep a single letter A at the calibration origin (viewport center)
   * for the whole session, without top/bottom silhouette markers.
   */
  showCalibrationOriginMarker?: boolean;
  /** Track and mark the two shoulder landmarks with MediaPipe Pose. */
  trackShoulders?: boolean;
  className?: string;
};

type CameraState = "pending" | "prompt" | "active" | "denied" | "error";

const MARKER_SHADOW = "2px 5px 6px rgba(0, 0, 0, 0.5)";

export function CameraFeed({
  showBottomMarker = false,
  mirrorPreview = false,
  showCalibrationOriginMarker = false,
  trackShoulders = false,
  className = "",
}: CameraFeedProps) {
  const { state } = useApp();
  const { locale } = state;
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return "error";
    return "pending";
  });

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("active");
    } catch {
      setCameraState("denied");
    }
  }, []);

  useEffect(() => {
    if (cameraState === "error") return;

    navigator.permissions
      ?.query({ name: "camera" as PermissionName })
      .then((result) => {
        if (result.state === "granted") {
          startCamera();
        } else if (result.state === "denied") {
          setCameraState("denied");
        } else {
          setCameraState("prompt");
        }
      })
      .catch(() => setCameraState("prompt"));

    return () => stopStream();
  }, [cameraState, startCamera, stopStream]);

  const handleAllow = () => {
    startCamera();
  };

  const handleDeny = () => {
    setCameraState("denied");
  };

  return (
    <>
      <div
        className={`relative w-full overflow-hidden rounded-[20px] border-[3px] border-blue bg-dark-blue/10 ${className || "aspect-[4/3]"}`}
      >
        {cameraState === "active" ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover ${
              mirrorPreview ? "-scale-x-100" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-dark-blue/20">
            <p className="px-6 text-center text-lg text-foreground/70">
              {cameraState === "denied"
                ? t(locale, "cameraDenied")
                : cameraState === "error"
                  ? t(locale, "cameraUnavailable")
                  : t(locale, "cameraLoading")}
            </p>
          </div>
        )}

        {(cameraState === "active" || cameraState === "pending") && (
          <HeadSilhouetteOverlay
            showBottomMarker={
              showBottomMarker && !showCalibrationOriginMarker
            }
            useHeadIcon={showCalibrationOriginMarker}
          />
        )}

        {trackShoulders && cameraState === "active" && (
          <ShoulderPoseOverlay videoRef={videoRef} />
        )}

        {showCalibrationOriginMarker &&
          (cameraState === "active" || cameraState === "pending") && (
            <div
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
              aria-hidden="true"
            >
              <span
                className="block text-6xl font-extrabold text-blue"
                style={{ textShadow: MARKER_SHADOW }}
              >
                A
              </span>
            </div>
          )}
      </div>

      {cameraState === "prompt" && (
        <CameraPermissionModal
          locale={locale}
          onAllow={handleAllow}
          onDeny={handleDeny}
        />
      )}
    </>
  );
}
