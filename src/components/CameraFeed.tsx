"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CameraPermissionModal } from "./CameraPermissionModal";
import { HeadSilhouetteOverlay } from "./HeadSilhouetteOverlay";
import { useApp } from "./providers/AppProvider";
import { t } from "@/lib/i18n";

type CameraFeedProps = {
  showBottomMarker?: boolean;
  className?: string;
};

type CameraState = "pending" | "prompt" | "active" | "denied" | "error";

export function CameraFeed({
  showBottomMarker = false,
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
        className={`relative aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-[20px] border-[3px] border-blue bg-dark-blue/10 ${className}`}
      >
        {cameraState === "active" ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
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
          <HeadSilhouetteOverlay showBottomMarker={showBottomMarker} />
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
