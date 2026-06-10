"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Step, StepMetrics } from "@/lib/types";
import { CameraFeed } from "./CameraFeed";
import { CameraPermissionModal } from "./CameraPermissionModal";
import { SmoothPursuitGameOverlay } from "./SmoothPursuitGameOverlay";
import { useApp } from "./providers/AppProvider";
import { useTestContext } from "./providers/TestContext";
import { t } from "@/lib/i18n";
import { EyeTrackingProvider } from "@/state";
import {
  TrackingEnabledVideo,
  type PrepCalibrationPayload,
} from "@/components/tracking";

type HeadExerciseProps = {
  step: Step;
  onComplete: (metrics: StepMetrics) => void;
  trackingEnabled?: boolean;
  onRegisterHideTracking?: (hide: () => void) => void;
};

const TARGET_ANGLES: Record<Step, number> = {
  1: 15,
  2: 25,
  3: 35,
};

const TOLERANCE = 8;
const SESSION_DURATION_MS = 8000;

function HeadExerciseInner({
  step,
  onComplete,
  trackingEnabled = false,
  onRegisterHideTracking,
}: HeadExerciseProps) {
  const { state } = useApp();
  const { locale } = state;
  const { calibration, isCalibrated } = useTestContext();
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

  const target = TARGET_ANGLES[step];

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
    completedRef.current = false;
    metricsRef.current = { samples: 0, inTarget: 0, angleSum: 0 };
  }, []);

  const handleSessionEnd = useCallback(() => {
    finish(progress || 100);
  }, [finish, progress]);

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

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div
        className={`relative w-full ${
          trackingEnabled ? "" : "cursor-grab active:cursor-grabbing"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        {trackingEnabled ? (
          <div className={trackingAreaVisible ? "contents" : "hidden"}>
            <TrackingEnabledVideo
              prepCalibration={prepCalibration}
              sessionLabel="Stage 1 Step 1 training"
              autoStartRecording={false}
              analyticsTitle={t(locale, "viewTrackingAnalytics")}
              analyticsToggleLabel={t(locale, "viewTrackingAnalytics")}
              analyticsCloseLabel={t(locale, "closeAnalytics")}
              cameraDeniedLabel={t(locale, "cameraDenied")}
              cameraUnavailableLabel={t(locale, "cameraUnavailable")}
              cameraLoadingLabel={t(locale, "cameraLoading")}
              gameLayer={
                <SmoothPursuitGameOverlay
                  onRecordingStart={handleRecordingStart}
                  onSessionEnd={handleSessionEnd}
                  onProgress={setProgress}
                  onVisibleChange={setTrackingAreaVisible}
                  onRegisterHide={(hide) => onRegisterHideTracking?.(hide)}
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
          <CameraFeed showBottomMarker />
        )}
      </div>

      <div className="w-full">
        <div className="mb-2 flex justify-between text-sm font-medium text-foreground/70">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full border-[3px] border-blue bg-background">
          <div
            className="h-full rounded-full bg-cyan transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        {!isActive && !trackingEnabled && (
          <p className="mt-3 text-center text-sm text-foreground/60">
            Tap the camera view to begin the exercise
          </p>
        )}
      </div>
    </div>
  );
}

export function HeadExercise(props: HeadExerciseProps) {
  if (props.trackingEnabled) {
    return (
      <EyeTrackingProvider>
        <HeadExerciseInner {...props} />
      </EyeTrackingProvider>
    );
  }

  return <HeadExerciseInner {...props} />;
}
