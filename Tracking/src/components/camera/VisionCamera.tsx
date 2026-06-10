import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CameraService } from "@/services/camera";
import type { CameraStatus } from "@/services/camera";
import { FaceMeshOverlay } from "./FaceMeshOverlay";
import { CalibrationOverlay } from "./CalibrationOverlay";
import { useEyeTracking } from "@/state";
import { useVisionPipeline } from "@/vision/hooks";

export function VisionCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<CameraService | null>(null);
  const [cameraState, setCameraState] = useState<CameraStatus>("idle");
  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const {
    state,
    startSession,
    startRecording,
    pauseRecording,
    resumeRecording,
    clearSamples,
    endSession,
    captureCalibration,
    runCalibration,
    resetCalibration,
  } = useEyeTracking();
  const { status, error, start, stop, isReady, isRunning, trackingService } =
    useVisionPipeline(videoRef, { enableOpenCvPreprocess: true });
  const { latestFaceLandmarks, latestSample, calibration } = state;

  const stopCamera = useCallback(() => {
    cameraRef.current?.stop();
    cameraRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;

    const camera = new CameraService();
    cameraRef.current = camera;

    const unsubscribe = camera.onStatusChange(setCameraState);

    try {
      await camera.initialize(videoRef.current);
    } catch {
      unsubscribe();
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    void startCamera().then((cleanup) => {
      unsubscribe = cleanup;
    });

    return () => {
      unsubscribe?.();
      stop();
      stopCamera();
    };
  }, [startCamera, stop, stopCamera]);

  useEffect(() => {
    if (cameraState === "active" && isReady && !isRunning) {
      start();
    }
  }, [cameraState, isReady, isRunning, start]);

  const handleSessionToggle = () => {
    if (!state.session) {
      startSession();
      startRecording();
      return;
    }

    if (state.recordingStatus === "recording") {
      pauseRecording();
      return;
    }

    if (state.recordingStatus === "paused") {
      resumeRecording();
    }
  };

  const calibrationTargets = useMemo(
    () => trackingService?.getFovCalibrator().getRequiredTargets() ?? [],
    [trackingService],
  );

  const capturedLabels = useMemo(() => {
    const model = trackingService?.getFovCalibrator().getModel();
    return new Set(model?.samples.map((sample) => sample.target.label) ?? []);
  }, [trackingService, calibration.sampleCount]);

  const handleOpenCalibration = () => {
    resetCalibration();
    setCalibrationOpen(true);
  };

  const handleCloseCalibration = () => {
    setCalibrationOpen(false);
  };

  const handleRunCalibration = () => {
    const success = runCalibration();
    if (success) {
      setCalibrationOpen(false);
    }
    return success;
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-[3px] border-blue bg-dark-blue/10">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full -scale-x-100 object-cover"
        />
        {cameraState === "active" && (
          <FaceMeshOverlay
            videoRef={videoRef}
            landmarks={latestFaceLandmarks}
            active={isRunning}
          />
        )}
        {calibrationOpen && cameraState === "active" && (
          <CalibrationOverlay
            videoRef={videoRef}
            landmarks={latestFaceLandmarks}
            active={calibrationOpen}
            targets={calibrationTargets}
            capturedLabels={capturedLabels}
            isCalibrated={calibration.isCalibrated}
            faceDetected={Boolean(latestSample?.faceDetected)}
            onCapture={captureCalibration}
            onRunCalibration={handleRunCalibration}
            onClose={handleCloseCalibration}
          />
        )}
        {cameraState !== "active" && (
          <div className="absolute inset-0 flex min-h-48 items-center justify-center bg-dark-blue/10 px-6 text-center text-foreground/70">
            {cameraState === "denied"
              ? "Camera access denied. Enable camera permissions to start tracking."
              : cameraState === "error"
                ? "Camera unavailable in this browser."
                : "Starting camera..."}
          </div>
        )}

        <div className="absolute left-3 top-3 rounded-full bg-dark-blue/80 px-3 py-1 text-xs font-medium text-white">
          Vision: {status}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSessionToggle}
          disabled={cameraState !== "active" || !isReady}
          className="rounded-xl bg-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-dark-blue disabled:cursor-not-allowed disabled:opacity-50"
        >
          {!state.session
            ? "Start Session"
            : state.recordingStatus === "recording"
              ? "Pause Recording"
              : "Resume Recording"}
        </button>

        <button
          type="button"
          onClick={clearSamples}
          disabled={state.samples.length === 0}
          className="rounded-xl border-2 border-blue px-4 py-2 text-sm font-semibold text-blue transition hover:bg-blue/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear Samples
        </button>

        <button
          type="button"
          onClick={() => {
            stop();
            endSession();
          }}
          disabled={!state.session}
          className="rounded-xl border-2 border-dark-blue px-4 py-2 text-sm font-semibold text-dark-blue transition hover:bg-dark-blue/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          End Session
        </button>
      </div>

      <div className="rounded-2xl border-2 border-cyan/40 bg-card p-4">
        <h3 className="text-sm font-semibold text-dark-blue">FOV Calibration</h3>
        <p className="mt-1 text-xs text-foreground/70">
          A distance check runs before calibration. Once positioned, fixate each
          target at ±20° and capture all five points.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCalibration}
            disabled={cameraState !== "active" || !isReady || calibrationOpen}
            className="rounded-lg bg-cyan px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start FOV Calibration
          </button>
          <button
            type="button"
            onClick={resetCalibration}
            className="rounded-lg border border-dark-blue px-3 py-1.5 text-xs font-medium text-dark-blue transition hover:bg-dark-blue/10"
          >
            Reset Calibration
          </button>
          <span className="text-xs text-foreground/60">
            {calibration.isCalibrated
              ? "Calibrated"
              : `${calibration.sampleCount} samples`}
          </span>
        </div>
      </div>
    </section>
  );
}
