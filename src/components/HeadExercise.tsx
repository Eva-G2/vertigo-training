"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Step, StepAnalysisSnapshot, StepMetrics } from "@/lib/types";
import {
  computeSessionResults,
  type SessionResults,
  type TrackingSessionAxis,
  type HeadAccuracyAxis,
} from "@/services/analytics";
import {
  isStage2Step1NoddingSession,
  isStage2Step2TurningSession,
  pursuitRecordsToHeadMovementPoints,
  samplesToHeadMovementPoints,
} from "@/services/analytics/headPoseChart";
import { ShoulderMovementRecorder } from "@/services/analytics/shoulderMovementChart";
import { DEFAULT_SINE_STIMULUS } from "@/services/processing";
import { buildTrackingGraphDatasets } from "@/components/tracking/trackingGraphData";
import type { TrackingExerciseMode } from "@/components/tracking";
import { CameraFeed } from "./CameraFeed";
import { CameraPermissionModal } from "./CameraPermissionModal";
import { LiveCameraStageFrame } from "./LiveCameraStageFrame";
import { LIVE_VIDEO_FILL_CLASS } from "./LiveCameraPageLayout";
import { SmoothPursuitGameOverlay } from "./SmoothPursuitGameOverlay";
import { Stage3FollowVideo } from "./Stage3FollowVideo";
import { useApp } from "./providers/AppProvider";
import { useTestContext } from "./providers/TestContext";
import { getAnalyticsCopy, t } from "@/lib/i18n";
import {
  HEAD_NOD_TOTAL_MS,
  HEAD_TURN_TOTAL_MS,
  SHOULDER_PACING_TOTAL_MS,
  SHOULDER_ROTATION_TOTAL_MS,
  WAIST_TURN_TOTAL_MS,
} from "@/lib/pacingMetronome";
import { STAGE2_SESSION_DURATION_MS } from "@/lib/stage2Steps";
import { resolveHeadNodGuideBounds } from "@/services/analytics/headNodGuideGeometry";
import { useEyeTracking } from "@/state";
import {
  TrackingEnabledVideo,
  type PrepCalibrationPayload,
} from "@/components/tracking";

export type TrackingSessionControls = {
  computeSessionResults: () => SessionResults | null;
  captureAnalysisSnapshot: () => StepAnalysisSnapshot | null;
};

type HeadExerciseProps = {
  stage: number;
  step: Step;
  onComplete: (metrics: StepMetrics) => void;
  trackingEnabled?: boolean;
  staticMarker?: boolean;
  onRegisterHideTracking?: (hide: () => void) => void;
  onRegisterSessionControls?: (controls: TrackingSessionControls) => void;
  onStartedChange?: (started: boolean) => void;
  onTrackingSessionComplete?: () => void;
  actionSlot?: React.ReactNode;
};

const TARGET_ANGLES: Record<Step, number> = {
  1: 15,
  2: 25,
  3: 35,
  4: 35,
};

const TOLERANCE = 8;
const SESSION_DURATION_MS = 8000;

type TrackingSessionControlsRegistrarProps = {
  stage: number;
  step: Step;
  onRegisterSessionControls?: (controls: TrackingSessionControls) => void;
};

function TrackingSessionControlsRegistrar({
  stage,
  step,
  onRegisterSessionControls,
}: TrackingSessionControlsRegistrarProps) {
  const {
    stopTrackingAnalytics,
    getVerticalPursuitDataset,
    getVerticalPursuitRecords,
    getMovementRecords,
    getCalibrationFactors,
    state: trackingState,
  } = useEyeTracking();

  const trackingAxis = useMemo((): TrackingSessionAxis => {
    if (stage === 3) {
      return step === 3 ? "horizontal" : "vertical";
    }

    if (step === 3) {
      return "vergence";
    }

    if (stage === 2) {
      return step === 2 ? "horizontal" : "vertical";
    }

    return step === 2 ? "horizontal" : "vertical";
  }, [stage, step]);

  const exerciseMode = useMemo((): TrackingExerciseMode => {
    if (stage === 3) {
      return step === 3 ? "horizontal" : "vertical";
    }

    if (step === 3) {
      return "vergence";
    }

    if (stage === 2) {
      return step === 2 ? "horizontal" : "vertical";
    }

    return step === 2 ? "horizontal" : "vertical";
  }, [stage, step]);

  const headAccuracyAxis = useMemo((): HeadAccuracyAxis | undefined => {
    if (stage !== 2) {
      return undefined;
    }

    if (step === 1) {
      return "pitch";
    }

    if (step === 2) {
      return "yaw";
    }

    return undefined;
  }, [stage, step]);

  const buildSessionResults = useCallback((): SessionResults | null => {
    stopTrackingAnalytics();

    const dataset = getVerticalPursuitDataset();
    const verticalRecords = getVerticalPursuitRecords();
    const horizontalRecords = getMovementRecords();
    const calibrationFactors = getCalibrationFactors();

    const elapsedSeconds =
      verticalRecords.length > 0
        ? verticalRecords[verticalRecords.length - 1]!.elapsedSec
        : dataset
          ? Math.max(0, (dataset.endedAt - dataset.startedAt) / 1000)
          : 0;

    if (
      verticalRecords.length === 0 &&
      horizontalRecords.length === 0 &&
      elapsedSeconds <= 0
    ) {
      return null;
    }

    return computeSessionResults({
      axis: trackingAxis,
      elapsedSeconds,
      viewportHeight: window.innerHeight,
      verticalRecords,
      horizontalRecords,
      horizontalCalibration: calibrationFactors ?? undefined,
      stimulusAmplitude: DEFAULT_SINE_STIMULUS.amplitude,
      headAccuracyAxis,
    });
  }, [
    getCalibrationFactors,
    getMovementRecords,
    getVerticalPursuitDataset,
    getVerticalPursuitRecords,
    headAccuracyAxis,
    stopTrackingAnalytics,
    trackingAxis,
  ]);

  const captureAnalysisSnapshot = useCallback((): StepAnalysisSnapshot | null => {
    const verticalRecords = getVerticalPursuitRecords();
    const horizontalRecords = getMovementRecords();
    const calibrationFactors = getCalibrationFactors();

    const graphDatasets = buildTrackingGraphDatasets({
      exerciseMode,
      pursuitRecords: verticalRecords,
      movementRecords: horizontalRecords,
      samples: trackingState.samples,
      verticalCalibration: calibrationFactors
        ? {
            kLY: calibrationFactors.kLY,
            kRY: calibrationFactors.kRY,
            leftBaseline: calibrationFactors.leftBaseline,
            rightBaseline: calibrationFactors.rightBaseline,
          }
        : null,
      horizontalCalibration: calibrationFactors
        ? {
            kL: calibrationFactors.kL,
            kR: calibrationFactors.kR,
            leftBaseline: calibrationFactors.leftBaseline,
            rightBaseline: calibrationFactors.rightBaseline,
          }
        : null,
      stimulus: DEFAULT_SINE_STIMULUS,
    });

    const durationSec =
      verticalRecords.length > 0
        ? verticalRecords[verticalRecords.length - 1]!.elapsedSec
        : horizontalRecords.length > 1
          ? (horizontalRecords[horizontalRecords.length - 1]!.timestamp -
              horizontalRecords[0]!.timestamp) /
            1000
          : 0;

    const headMovementPoints =
      stage === 3
        ? []
        : verticalRecords.length >= 2
          ? pursuitRecordsToHeadMovementPoints(verticalRecords)
          : trackingState.samples.length >= 2
            ? samplesToHeadMovementPoints(trackingState.samples)
            : [];

    const shoulderMovementPoints =
      stage === 3 ? ShoulderMovementRecorder.getPoints() : [];

    const sessionLabel = trackingState.session?.label;
    const showNoddingTarget = isStage2Step1NoddingSession(sessionLabel);
    const showTurningTarget = isStage2Step2TurningSession(sessionLabel);

    if (
      graphDatasets.vertical.length < 2 &&
      graphDatasets.horizontal.length < 2 &&
      headMovementPoints.length < 2 &&
      shoulderMovementPoints.length < 2
    ) {
      return null;
    }

    return {
      exerciseMode,
      durationSec,
      graphDatasets,
      headMovementPoints:
        headMovementPoints.length >= 2 ? headMovementPoints : undefined,
      showNoddingTarget,
      showTurningTarget,
      shoulderMovementPoints:
        shoulderMovementPoints.length >= 2
          ? shoulderMovementPoints
          : undefined,
    };
  }, [
    exerciseMode,
    getCalibrationFactors,
    getMovementRecords,
    getVerticalPursuitRecords,
    stage,
    trackingState.samples,
    trackingState.session?.label,
  ]);

  const onRegisterRef = useRef(onRegisterSessionControls);
  onRegisterRef.current = onRegisterSessionControls;

  useEffect(() => {
    onRegisterRef.current?.({
      computeSessionResults: buildSessionResults,
      captureAnalysisSnapshot,
    });
  }, [buildSessionResults, captureAnalysisSnapshot]);

  return null;
}

function HeadExerciseInner({
  stage,
  step,
  onComplete,
  trackingEnabled = false,
  staticMarker = false,
  onRegisterHideTracking,
  onRegisterSessionControls,
  onStartedChange,
  onTrackingSessionComplete,
  actionSlot,
}: HeadExerciseProps) {
  const { state } = useApp();
  const { locale, showBoneLandmarks } = state;
  const { calibration, isCalibrated, recenterBaseline: storedRecenterBaseline } =
    useTestContext();
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [trackingAreaVisible, setTrackingAreaVisible] = useState(true);
  const metricsRef = useRef({
    samples: 0,
    inTarget: 0,
    angleSum: 0,
  });
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const currentAngleRef = useRef(0);
  const followVideoRef = useRef<HTMLVideoElement | null>(null);

  const target = TARGET_ANGLES[step];
  const headNoddingMetronome = stage === 2 && step === 1;
  const headTurningMetronome = stage === 2 && step === 2;
  const shoulderMetronome = stage === 3 && step === 1;
  const shoulderRotationMetronome = stage === 3 && step === 2;
  const waistTurningMetronome = stage === 3 && step === 3;
  const showShoulderLandmarks = stage === 3 && step >= 1 && step <= 3;
  const headNodGuideBounds = useMemo(
    () =>
      headNoddingMetronome
        ? resolveHeadNodGuideBounds(
            calibration.leftBaseline,
            calibration.rightBaseline,
            calibration.chinNormalizedY,
          )
        : null,
    [
      calibration.chinNormalizedY,
      calibration.leftBaseline,
      calibration.rightBaseline,
      headNoddingMetronome,
    ],
  );
  const pursuitAxis =
    stage === 2
      ? step === 2
        ? "horizontal"
        : "vertical"
      : stage === 3
        ? step === 3
          ? "horizontal"
          : "vertical"
        : step === 2
          ? "horizontal"
          : "vertical";
  const exerciseMode = step === 3 && stage !== 3 ? "vergence" : "smooth-pursuit";
  const staticSessionDurationMs = headNoddingMetronome
    ? HEAD_NOD_TOTAL_MS
    : headTurningMetronome
      ? HEAD_TURN_TOTAL_MS
      : shoulderMetronome
        ? SHOULDER_PACING_TOTAL_MS
        : shoulderRotationMetronome
          ? SHOULDER_ROTATION_TOTAL_MS
          : waistTurningMetronome
            ? WAIST_TURN_TOTAL_MS
            : stage === 3
              ? SESSION_DURATION_MS
              : STAGE2_SESSION_DURATION_MS;

  const prepCalibration = useMemo((): PrepCalibrationPayload | null => {
    if (
      !trackingEnabled ||
      !isCalibrated ||
      calibration.kL == null ||
      calibration.kR == null ||
      calibration.kLY == null ||
      calibration.kRY == null
    ) {
      return null;
    }

    return {
      kL: calibration.kL,
      kR: calibration.kR,
      kLY: calibration.kLY,
      kRY: calibration.kRY,
      leftBaseline: calibration.leftBaseline,
      rightBaseline: calibration.rightBaseline,
      faceTopNormalizedY: calibration.faceTopNormalizedY,
      chinNormalizedY: calibration.chinNormalizedY,
    };
  }, [calibration, isCalibrated, trackingEnabled]);

  const finish = useCallback(
    (completionPct = 100) => {
      if (completedRef.current) return;
      completedRef.current = true;

      const { samples, inTarget, angleSum } = metricsRef.current;
      const accuracyPct =
        samples > 0 ? Math.round((inTarget / samples) * 100) : 0;
      const averageAngleDeg =
        samples > 0 ? Math.round(Math.abs(angleSum / samples)) : 0;

      onComplete({
        completionPct: Math.min(100, Math.round(completionPct)) || 85,
        accuracyPct: accuracyPct || 75,
        averageAngleDeg: averageAngleDeg || target,
      });
    },
    [onComplete, target],
  );

  useEffect(() => {
    if (trackingEnabled || !isActive) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - (startTimeRef.current ?? Date.now());
      const pct = Math.min(100, (elapsed / SESSION_DURATION_MS) * 100);
      setProgress(pct);

      const angle = currentAngleRef.current;
      const inTarget = Math.abs(angle - target) <= TOLERANCE;
      metricsRef.current.samples += 1;
      if (inTarget) metricsRef.current.inTarget += 1;
      metricsRef.current.angleSum += angle;

      if (pct >= 100) {
        clearInterval(interval);
        finish(pct);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [finish, isActive, target, trackingEnabled]);

  const handleRecordingStart = useCallback(() => {
    setIsActive(true);
    onStartedChange?.(true);
    completedRef.current = false;
    metricsRef.current = { samples: 0, inTarget: 0, angleSum: 0 };
  }, [onStartedChange]);

  const handleSessionEnd = useCallback(() => {
    if (trackingEnabled) {
      onTrackingSessionComplete?.();
      return;
    }

    finish(progress || 100);
  }, [finish, onTrackingSessionComplete, progress, trackingEnabled]);

  const handlePointerDown = () => {
    if (trackingEnabled || isActive) return;
    setIsActive(true);
    startTimeRef.current = Date.now();
    completedRef.current = false;
    metricsRef.current = { samples: 0, inTarget: 0, angleSum: 0 };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isActive || trackingEnabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const deltaY = e.clientY - (rect.top + rect.height / 2);
    const deltaX = e.clientX - (rect.left + rect.width / 2);
    currentAngleRef.current = Math.max(
      -45,
      Math.min(45, (deltaY / rect.height) * 90 + deltaX * 0.05),
    );
  };

  const progressPct = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <>
      {trackingEnabled && (
        <TrackingSessionControlsRegistrar
          stage={stage}
          step={step}
          onRegisterSessionControls={onRegisterSessionControls}
        />
      )}
      <LiveCameraStageFrame
        action={actionSlot}
        video={
          <div
            className={`relative ${LIVE_VIDEO_FILL_CLASS} ${
              trackingEnabled ? "" : "cursor-grab active:cursor-grabbing"
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
          >
            {trackingEnabled ? (
              <div
                className={
                  trackingAreaVisible ? "contents" : "hidden h-full w-full"
                }
              >
                {shoulderMetronome ? (
                  <Stage3FollowVideo videoRef={followVideoRef} />
                ) : null}
                <TrackingEnabledVideo
                  className={LIVE_VIDEO_FILL_CLASS}
                  prepCalibration={prepCalibration}
                  gazeRecenterBaseline={storedRecenterBaseline}
                  sessionLabel={`Stage ${stage} Step ${step} training`}
                  autoStartRecording={false}
                  showBoneLandmarks={showBoneLandmarks}
                  showShoulderLandmarks={showShoulderLandmarks}
                  analyticsTitle={t(locale, "viewTrackingAnalytics")}
                  analyticsToggleLabel={t(locale, "viewTrackingAnalytics")}
                  analyticsCloseLabel={t(locale, "closeAnalytics")}
                  analyticsCopy={getAnalyticsCopy(locale)}
                  cameraDeniedLabel={t(locale, "cameraDenied")}
                  cameraUnavailableLabel={t(locale, "cameraUnavailable")}
                  cameraLoadingLabel={t(locale, "cameraLoading")}
                  gameLayer={
                    <SmoothPursuitGameOverlay
                      trackingAxis={pursuitAxis}
                      exerciseMode={exerciseMode}
                      staticMarker={staticMarker}
                      headNoddingMetronome={headNoddingMetronome}
                      headTurningMetronome={headTurningMetronome}
                      shoulderMetronome={shoulderMetronome}
                      shoulderRotationMetronome={shoulderRotationMetronome}
                      waistTurningMetronome={waistTurningMetronome}
                      headNodGuideBounds={headNodGuideBounds}
                      staticSessionDurationMs={staticSessionDurationMs}
                      sessionLabel={`Stage ${stage} Step ${step} training`}
                      onRecordingStart={handleRecordingStart}
                      onSessionEnd={handleSessionEnd}
                      onProgress={setProgress}
                      onVisibleChange={setTrackingAreaVisible}
                      onRegisterHide={(hide) => onRegisterHideTracking?.(hide)}
                      followVideoRef={
                        shoulderMetronome ? followVideoRef : undefined
                      }
                    />
                  }
                  renderCameraPermissionModal={({ onAllow, onDeny }) => (
                    <CameraPermissionModal
                      locale={locale}
                      onAllow={onAllow}
                      onDeny={onDeny}
                    />
                  )}
                />
              </div>
            ) : (
              <CameraFeed
                showBottomMarker={stage !== 3}
                mirrorPreview={stage === 3}
                showCalibrationOriginMarker={stage === 3}
                className={LIVE_VIDEO_FILL_CLASS}
              />
            )}
          </div>
        }
        progress={
          <>
            <div className="mb-2 flex justify-between text-sm font-medium text-foreground/70">
              <span>Progress</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full border-[3px] border-blue bg-background">
              <div
                className="h-full rounded-full bg-cyan"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {!isActive && !trackingEnabled && (
              <p className="mt-3 text-center text-sm text-foreground/60">
                Tap the camera view to begin the exercise
              </p>
            )}
          </>
        }
      />
    </>
  );
}

export function HeadExercise(props: HeadExerciseProps) {
  return <HeadExerciseInner {...props} />;
}
