import { useEffect, useRef } from "react";
import type { GazeRecenterBaseline, TrackingService } from "@/services/tracking";
import { useEyeTracking } from "@/state";
import type { PrepCalibrationPayload } from "./injectPrepCalibration";

type UseBackgroundTrackingOptions = {
  trackingService: TrackingService | null;
  isRunning: boolean;
  prepCalibration: PrepCalibrationPayload | null;
  gazeRecenterBaseline?: GazeRecenterBaseline | null;
  sessionLabel?: string;
  /** When false, calibration is injected but recording waits for a manual trigger. */
  autoStartRecording?: boolean;
};

/**
 * Starts vision-pipeline recording asynchronously so tracking never blocks
 * the main UI thread or camera/video playback.
 */
export function useBackgroundTracking({
  trackingService,
  isRunning,
  prepCalibration,
  gazeRecenterBaseline = null,
  sessionLabel = "Stage 1 Step 1 demo",
  autoStartRecording = true,
}: UseBackgroundTrackingOptions) {
  const {
    startSession,
    startRecording,
    endSession,
    pauseRecording,
    applyPrepCalibration,
    applyRecenterBaseline,
    state,
  } = useEyeTracking();
  const startedRef = useRef(false);
  const calibrationInjectedRef = useRef(false);
  const trackingStateRef = useRef(state);
  trackingStateRef.current = state;

  useEffect(() => {
    if (!trackingService || !prepCalibration || calibrationInjectedRef.current) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      applyPrepCalibration({
        kL: prepCalibration.kL,
        kR: prepCalibration.kR,
        kLY: prepCalibration.kLY,
        kRY: prepCalibration.kRY,
        leftBaseline: prepCalibration.leftBaseline ?? undefined,
        rightBaseline: prepCalibration.rightBaseline ?? undefined,
      });
      if (gazeRecenterBaseline) {
        applyRecenterBaseline(gazeRecenterBaseline);
      }
      calibrationInjectedRef.current = true;
    });

    return () => cancelAnimationFrame(frameId);
  }, [
    applyPrepCalibration,
    applyRecenterBaseline,
    gazeRecenterBaseline,
    prepCalibration,
    trackingService,
  ]);

  useEffect(() => {
    if (
      !autoStartRecording ||
      !isRunning ||
      !trackingService ||
      !prepCalibration ||
      startedRef.current
    ) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      const { session, recordingStatus } = trackingStateRef.current;
      if (!session) {
        startSession(sessionLabel);
      }
      if (recordingStatus !== "recording") {
        startRecording();
      }
      startedRef.current = true;
    });

    return () => cancelAnimationFrame(frameId);
  }, [
    autoStartRecording,
    isRunning,
    prepCalibration,
    sessionLabel,
    startRecording,
    startSession,
    trackingService,
  ]);

  useEffect(() => {
    return () => {
      if (startedRef.current) {
        pauseRecording();
        endSession();
        startedRef.current = false;
      }
      calibrationInjectedRef.current = false;
    };
  }, [endSession, pauseRecording]);
}
