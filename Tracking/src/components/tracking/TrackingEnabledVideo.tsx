"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OvalFaceTracker } from "./OvalFaceTracker";
import { IrisTracker } from "./IrisTracker";
import { useBackgroundTracking } from "./useBackgroundTracking";
import { TrackingAnalyticsModal } from "./TrackingAnalyticsModal";
import { useEyeTracking } from "@/state";
import { useVisionPipeline } from "@/vision/hooks/useVisionPipeline";
import { waitForVideoFrame } from "@/vision/utils/waitForVideoFrame";
import type { PrepCalibrationPayload } from "./injectPrepCalibration";

type CameraState = "pending" | "prompt" | "active" | "denied" | "error";

type TrackingEnabledVideoProps = {
  prepCalibration: PrepCalibrationPayload | null;
  overlayContent?: React.ReactNode;
  sessionLabel?: string;
  analyticsTitle: string;
  analyticsCloseLabel: string;
  analyticsToggleLabel: string;
  cameraDeniedLabel: string;
  cameraUnavailableLabel: string;
  cameraLoadingLabel: string;
  renderCameraPermissionModal?: (handlers: {
    onAllow: () => void;
    onDeny: () => void;
  }) => React.ReactNode;
  gameLayer?: React.ReactNode;
  autoStartRecording?: boolean;
  className?: string;
};

export function TrackingEnabledVideo({
  prepCalibration,
  overlayContent,
  sessionLabel,
  analyticsTitle,
  analyticsCloseLabel,
  analyticsToggleLabel,
  cameraDeniedLabel,
  cameraUnavailableLabel,
  cameraLoadingLabel,
  renderCameraPermissionModal,
  gameLayer,
  autoStartRecording = true,
  className = "",
}: TrackingEnabledVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      return "error";
    }
    return "pending";
  });
  const [videoReady, setVideoReady] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const { state: trackingState } = useEyeTracking();
  const { start, isReady, isRunning, trackingService } = useVisionPipeline(
    videoRef,
    { enableOpenCvPreprocess: false },
  );
  const { latestFaceLandmarks } = trackingState;

  useBackgroundTracking({
    trackingService,
    isRunning,
    prepCalibration,
    sessionLabel,
    autoStartRecording,
  });

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setVideoReady(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const bindStreamToVideo = useCallback(async (stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return false;

    video.srcObject = stream;
    await waitForVideoFrame(video);
    await video.play();
    setVideoReady(true);
    return true;
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        setCameraState("active");
        await bindStreamToVideo(streamRef.current);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraState("active");
      await bindStreamToVideo(stream);
    } catch {
      setCameraState("denied");
      setVideoReady(false);
    }
  }, [bindStreamToVideo]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setCameraState("error");
      return;
    }

    let mounted = true;

    navigator.permissions
      ?.query({ name: "camera" as PermissionName })
      .then((result) => {
        if (!mounted) return;
        if (result.state === "granted") {
          void startCamera();
        } else if (result.state === "denied") {
          setCameraState("denied");
        } else {
          setCameraState("prompt");
        }
      })
      .catch(() => {
        if (mounted) setCameraState("prompt");
      });

    return () => {
      mounted = false;
      stopStream();
    };
  }, [startCamera, stopStream]);

  useEffect(() => {
    if (cameraState === "active" && videoReady && isReady && !isRunning) {
      void start();
    }
  }, [cameraState, videoReady, isReady, isRunning, start]);

  const cameraMessage = useMemo(() => {
    if (cameraState === "denied") return cameraDeniedLabel;
    if (cameraState === "error") return cameraUnavailableLabel;
    return cameraLoadingLabel;
  }, [
    cameraDeniedLabel,
    cameraLoadingLabel,
    cameraState,
    cameraUnavailableLabel,
  ]);

  const trackingActive = cameraState === "active" && isRunning;

  return (
    <>
      <div
        className={`relative aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-[20px] border-[3px] border-blue bg-card ${className}`}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full -scale-x-100 object-cover ${
            cameraState === "active" ? "block" : "hidden"
          }`}
        />

        {(cameraState === "active" || cameraState === "pending") &&
          overlayContent && (
            <div className="pointer-events-none absolute inset-0 z-10">
              {overlayContent}
            </div>
          )}

        {cameraState !== "active" && (
          <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-dark-blue/20">
            <p className="px-6 text-center text-lg text-foreground/70">
              {cameraMessage}
            </p>
          </div>
        )}

        {gameLayer}

        {trackingActive && (
          <>
            <OvalFaceTracker
              videoRef={videoRef}
              landmarks={latestFaceLandmarks}
              active
            />
            <IrisTracker
              videoRef={videoRef}
              landmarks={latestFaceLandmarks}
              active
            />
          </>
        )}

      </div>

      {trackingActive && (
        <button
          type="button"
          onClick={() => setAnalyticsOpen(true)}
          className="fixed bottom-6 left-6 z-30 rounded-xl border-2 border-blue bg-card/90 px-3 py-2 text-xs font-semibold text-blue shadow-sm backdrop-blur transition hover:bg-blue/10"
        >
          {analyticsToggleLabel}
        </button>
      )}

      <TrackingAnalyticsModal
        open={analyticsOpen}
        title={analyticsTitle}
        closeLabel={analyticsCloseLabel}
        onClose={() => setAnalyticsOpen(false)}
      />

      {cameraState === "prompt" &&
        renderCameraPermissionModal?.({
          onAllow: () => {
            void startCamera();
          },
          onDeny: () => {
            setCameraState("denied");
          },
        })}
    </>
  );
}
