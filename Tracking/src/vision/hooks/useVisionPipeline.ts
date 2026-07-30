import { useCallback, useEffect, useRef, useState } from "react";
import type { TrackingService } from "@/services/tracking";
import { useEyeTracking } from "@/state";
import {
  acquireVisionPipeline,
  releaseVisionPipeline,
} from "@/vision/pipeline/visionPipelineManager";
import type { VisionPipelineStatus } from "@/vision/pipeline/types";
import { waitForVideoFrame } from "@/vision/utils/waitForVideoFrame";

type UseVisionPipelineOptions = {
  autoStart?: boolean;
  enableOpenCvPreprocess?: boolean;
};

export function useVisionPipeline(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: UseVisionPipelineOptions = {},
) {
  const {
    ingestSample,
    updateFaceLandmarks,
    setPipelineStatus,
    registerTrackingService,
    recordMovementSample,
  } = useEyeTracking();
  const callbacksRef = useRef({
    ingestSample,
    updateFaceLandmarks,
    recordMovementSample,
  });
  const [status, setStatus] = useState<VisionPipelineStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [trackingService, setTrackingService] = useState<TrackingService | null>(
    null,
  );

  callbacksRef.current = {
    ingestSample,
    updateFaceLandmarks,
    recordMovementSample,
  };

  const initialize = useCallback(async () => {
    const pipeline = await acquireVisionPipeline(
      {
        onResult: ({ sample, faceLandmarks }) => {
          const callbacks = callbacksRef.current;
          callbacks.updateFaceLandmarks(faceLandmarks);
          if (sample) {
            callbacks.ingestSample(sample);
            callbacks.recordMovementSample(sample);
          }
        },
        onStatusChange: (nextStatus) => {
          setStatus(nextStatus);
          setPipelineStatus(nextStatus);
        },
        onError: (err) => setError(err.message),
      },
      { enableOpenCvPreprocess: options.enableOpenCvPreprocess ?? true },
    );

    const service = pipeline.getTrackingService();
    setTrackingService(service);
    registerTrackingService(service);
    setStatus(pipeline.getStatus());

    if (options.autoStart && videoRef.current) {
      pipeline.start(videoRef.current);
    }

    return pipeline;
  }, [
    options.autoStart,
    options.enableOpenCvPreprocess,
    registerTrackingService,
    setPipelineStatus,
    videoRef,
  ]);

  const start = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    await waitForVideoFrame(video);

    const pipeline = await acquireVisionPipeline(
      {
        onResult: ({ sample, faceLandmarks }) => {
          const callbacks = callbacksRef.current;
          callbacks.updateFaceLandmarks(faceLandmarks);
          if (sample) {
            callbacks.ingestSample(sample);
            callbacks.recordMovementSample(sample);
          }
        },
        onStatusChange: (nextStatus) => {
          setStatus(nextStatus);
          setPipelineStatus(nextStatus);
        },
        onError: (err) => setError(err.message),
      },
      { enableOpenCvPreprocess: options.enableOpenCvPreprocess ?? true },
    );

    pipeline.start(video);
  }, [
    options.enableOpenCvPreprocess,
    setPipelineStatus,
    videoRef,
  ]);

  const stop = useCallback(() => {
    releaseVisionPipeline();
    setStatus((current) => (current === "running" ? "ready" : current));
  }, []);

  useEffect(() => {
    let mounted = true;

    void initialize().catch((err) => {
      if (!mounted) return;
      setError(err instanceof Error ? err.message : "Vision pipeline init failed");
    });

    return () => {
      mounted = false;
      registerTrackingService(null);
      releaseVisionPipeline();
    };
  }, [initialize, registerTrackingService]);

  return {
    status,
    error,
    initialize,
    start,
    stop,
    trackingService,
    isReady: status === "ready" || status === "running",
    isRunning: status === "running",
  };
}
