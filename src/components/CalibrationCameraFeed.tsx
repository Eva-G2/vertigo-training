"use client";

import {
  type MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CameraPermissionModal } from "./CameraPermissionModal";
import { HeadSilhouetteOverlay } from "./HeadSilhouetteOverlay";
import { useApp } from "./providers/AppProvider";
import { useTestContext } from "./providers/TestContext";
import { getCalibrationCopy, t } from "@/lib/i18n";
import {
  CalibrationOverlay,
  type CalibrationUiState,
  calibrationUiStatesEqual,
} from "@/components/camera/CalibrationOverlay";
import { FaceMeshOverlay } from "@/components/camera/FaceMeshOverlay";
import type { FovCalibrationSample } from "@/services/tracking/types";
import { EyeTrackingProvider, useEyeTracking } from "@/state";
import { extractEyeMetrics } from "@/vision/mediapipe/landmarks";
import { useVisionPipeline } from "@/vision/hooks/useVisionPipeline";
import { waitForVideoFrame } from "@/vision/utils/waitForVideoFrame";

type CameraState = "pending" | "prompt" | "active" | "denied" | "error";

type CalibrationCameraFeedInnerProps = {
  className?: string;
  onCalibrationStateChange?: (state: CalibrationUiState | null) => void;
  captureActionRef?: MutableRefObject<(() => void) | null>;
};

function CalibrationCameraFeedInner({
  className = "",
  onCalibrationStateChange,
  captureActionRef,
}: CalibrationCameraFeedInnerProps) {
  const { state } = useApp();
  const { locale } = state;
  const calibrationCopy = getCalibrationCopy(locale);
  const { setCalibration } = useTestContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [calibrationUi, setCalibrationUi] = useState<CalibrationUiState | null>(
    null,
  );

  const handleUiStateChange = useCallback(
    (next: CalibrationUiState | null) => {
      setCalibrationUi((previous) => {
        if (calibrationUiStatesEqual(previous, next)) {
          return previous;
        }

        onCalibrationStateChange?.(next);
        return next;
      });
    },
    [onCalibrationStateChange],
  );
  const streamRef = useRef<MediaStream | null>(null);
  const calibrationSyncedRef = useRef(false);
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
  const { latestFaceLandmarks, calibration } = trackingState;

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
  }, [cameraState, videoReady, isReady, isRunning, resetCalibration, start]);

  useEffect(() => {
    if (!calibration.isCalibrated) {
      calibrationSyncedRef.current = false;
      return;
    }

    if (calibrationSyncedRef.current) {
      return;
    }

    const factors = getCalibrationFactors();
    if (!factors) return;

    calibrationSyncedRef.current = true;
    setCalibration({
      status: "CALIBRATED",
      kL: factors.kL,
      kR: factors.kR,
      kLY: factors.kLY,
      kRY: factors.kRY,
      leftBaseline: factors.leftBaseline,
      rightBaseline: factors.rightBaseline,
      faceTopNormalizedY: factors.faceTopNormalizedY,
      chinNormalizedY: factors.chinNormalizedY,
    });
  }, [calibration.isCalibrated, getCalibrationFactors, setCalibration]);

  const faceDetected = useMemo(() => {
    if (!latestFaceLandmarks?.length) {
      return false;
    }

    return extractEyeMetrics(latestFaceLandmarks) != null;
  }, [latestFaceLandmarks]);

  const calibrationTargets = useMemo(
    () => trackingService?.getFovCalibrator().getRequiredTargets() ?? [],
    [trackingService],
  );

  const capturedLabels = useMemo((): Set<string> => {
    const model = trackingService?.getFovCalibrator().getModel();
    return new Set(
      model?.samples.map(
        (sample: FovCalibrationSample) => sample.target.label,
      ) ?? [],
    );
  }, [trackingService, calibration.sampleCount]);

  const handleAllow = () => {
    void startCamera();
  };

  const handleDeny = () => {
    setCameraState("denied");
  };

  const calibrationActive =
    cameraState === "active" &&
    videoReady &&
    isReady &&
    !calibration.isCalibrated;

  return (
    <>
      <div className={`relative w-full ${className}`}>
        {calibrationActive && (
          <CalibrationOverlay
            videoRef={videoRef}
            landmarks={latestFaceLandmarks}
            active={calibrationActive}
            targets={calibrationTargets}
            capturedLabels={capturedLabels}
            isCalibrated={calibration.isCalibrated}
            faceDetected={faceDetected}
            onCapture={captureCalibration}
            onRunCalibration={runCalibration}
            onClose={() => undefined}
            onUiStateChange={handleUiStateChange}
            captureActionRef={captureActionRef}
            copy={calibrationCopy}
            embedded
            viewportTargets
          />
        )}

        <div
          className={`relative w-full overflow-hidden rounded-[20px] border-[3px] border-blue bg-dark-blue/10 ${
            className.includes("h-full") ? "h-full" : "aspect-[4/3]"
          }`}
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

            {cameraState === "active" &&
              calibrationUi?.estimatedDistanceCm != null && (
                <div className="absolute bottom-3 left-3 z-20 rounded-md bg-black/55 px-2.5 py-1.5 text-left leading-tight text-white shadow-sm backdrop-blur-sm">
                  <p className="text-xs font-semibold drop-shadow">
                    {calibrationCopy.estimatedDistance}:{" "}
                    {calibrationUi.estimatedDistanceCm.toFixed(1)} cm
                  </p>
                  <p className="text-[11px] font-medium text-white/90 drop-shadow">
                    {calibrationCopy.targetDistance}:{" "}
                    {calibrationUi.targetDistanceCm.toFixed(0)} cm
                  </p>
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
  onCalibrationStateChange?: (state: CalibrationUiState | null) => void;
  captureActionRef?: MutableRefObject<(() => void) | null>;
};

export function CalibrationCameraFeed({
  className = "",
  onCalibrationStateChange,
  captureActionRef,
}: CalibrationCameraFeedProps) {
  return (
    <EyeTrackingProvider>
      <CalibrationCameraFeedInner
        className={className}
        onCalibrationStateChange={onCalibrationStateChange}
        captureActionRef={captureActionRef}
      />
    </EyeTrackingProvider>
  );
}
