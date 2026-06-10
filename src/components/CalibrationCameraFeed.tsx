"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CameraPermissionModal } from "./CameraPermissionModal";
import { HeadSilhouetteOverlay } from "./HeadSilhouetteOverlay";
import { useApp } from "./providers/AppProvider";
import { useTestContext } from "./providers/TestContext";
import { t } from "@/lib/i18n";
import { CalibrationOverlay } from "@/components/camera/CalibrationOverlay";
import { FaceMeshOverlay } from "@/components/camera/FaceMeshOverlay";
import type { FovCalibrationSample } from "@/services/tracking/types";
import { EyeTrackingProvider, useEyeTracking } from "@/state";
import { useVisionPipeline } from "@/vision/hooks/useVisionPipeline";
import { waitForVideoFrame } from "@/vision/utils/waitForVideoFrame";

type CameraState = "pending" | "prompt" | "active" | "denied" | "error";

type CalibrationCameraFeedInnerProps = {
  className?: string;
};

function CalibrationCameraFeedInner({
  className = "",
}: CalibrationCameraFeedInnerProps) {
  const { state } = useApp();
  const { locale } = state;
  const { setCalibration } = useTestContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      return "error";
    }
    return "pending";
  });
  const [videoReady, setVideoReady] = useState(false);
  const {
    state: trackingState,
    captureCalibration,
    runCalibration,
    getCalibrationFactors,
    resetCalibration,
  } = useEyeTracking();
  const { start, isReady, isRunning, trackingService } = useVisionPipeline(
    videoRef,
    { enableOpenCvPreprocess: false },
  );
  const { latestFaceLandmarks, latestSample, calibration } = trackingState;

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
      resetCalibration();
      void start();
    }
  }, [
    cameraState,
    videoReady,
    isReady,
    isRunning,
    resetCalibration,
    start,
  ]);

  useEffect(() => {
    if (!calibration.isCalibrated) return;

    const factors = getCalibrationFactors();
    if (!factors) return;

    setCalibration({
      status: "CALIBRATED",
      kL: factors.kL,
      kR: factors.kR,
      kLY: factors.kLY,
      kRY: factors.kRY,
      leftBaseline: factors.leftBaseline,
      rightBaseline: factors.rightBaseline,
    });
  }, [calibration.isCalibrated, getCalibrationFactors, setCalibration]);

  const calibrationTargets = useMemo(
    () => trackingService?.getFovCalibrator().getRequiredTargets() ?? [],
    [trackingService],
  );

  const capturedLabels = useMemo((): Set<string> => {
    const model = trackingService?.getFovCalibrator().getModel();
    return new Set(
      model?.samples.map((sample: FovCalibrationSample) => sample.target.label) ??
        [],
    );
  }, [trackingService, calibration.sampleCount]);

  const handleAllow = () => {
    void startCamera();
  };

  const handleDeny = () => {
    setCameraState("denied");
  };

  const calibrationActive =
    cameraState === "active" && videoReady && isReady && !calibration.isCalibrated;

  return (
    <>
      <div
        className={`relative flex w-full flex-1 items-center justify-center ${className}`}
      >
        {calibrationActive && (
          <CalibrationOverlay
            videoRef={videoRef}
            landmarks={latestFaceLandmarks}
            active={calibrationActive}
            targets={calibrationTargets}
            capturedLabels={capturedLabels}
            isCalibrated={calibration.isCalibrated}
            faceDetected={Boolean(latestSample?.faceDetected)}
            onCapture={captureCalibration}
            onRunCalibration={runCalibration}
            onClose={() => undefined}
            embedded
            viewportTargets
          />
        )}

        <div className="relative z-10 mx-auto aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-[20px] border-[3px] border-blue bg-dark-blue/10">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full -scale-x-100 object-cover ${
              cameraState === "active" ? "block" : "hidden"
            }`}
          />

          {cameraState !== "active" && (
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

          {cameraState === "active" && isRunning && (
            <FaceMeshOverlay
              videoRef={videoRef}
              landmarks={latestFaceLandmarks}
              active
              pupilsOnly
            />
          )}

          {(cameraState === "active" || cameraState === "pending") && (
            <HeadSilhouetteOverlay useHeadIcon />
          )}

          {calibration.isCalibrated && (
            <div className="absolute right-3 top-3 rounded-full bg-green-500/90 px-3 py-1 text-xs font-semibold text-white">
              {t(locale, "calibrationComplete")}
            </div>
          )}
        </div>
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

type CalibrationCameraFeedProps = {
  className?: string;
};

export function CalibrationCameraFeed({
  className = "",
}: CalibrationCameraFeedProps) {
  return (
    <EyeTrackingProvider>
      <CalibrationCameraFeedInner className={className} />
    </EyeTrackingProvider>
  );
}
