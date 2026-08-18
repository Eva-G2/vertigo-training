"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { CongratsModal } from "@/components/CongratsModal";
import { LiveCameraPageLayout } from "@/components/LiveCameraPageLayout";
import {
  HeadExercise,
  type TrackingSessionControls,
} from "@/components/HeadExercise";
import { useApp } from "@/components/providers/AppProvider";
import { formatStageStep, t } from "@/lib/i18n";
import { onCongratsNext, onTrainingComplete } from "@/lib/training-flow";
import { upsertTrainingRecord } from "@/lib/supabase/training-records";
import {
  SHOULDER_ROTATION_CUE_TIMES_SEC,
  SHOULDER_UP_CUE_TIMES_SEC,
  WAIST_LEFT_CUE_TIMES_SEC,
  WAIST_RIGHT_CUE_TIMES_SEC,
} from "@/lib/pacingMetronome";
import type { Step, StepAnalysisSnapshot, StepMetrics } from "@/lib/types";
import { isStage1TrackingStep } from "@/lib/stage1Steps";
import { isStage2TrackingStep } from "@/lib/stage2Steps";
import { isStage3Step, isStage3TrackingStep } from "@/lib/stage3Steps";
import {
  computeShoulderShrugMetrics,
  computeWaistTurnMetrics,
  sessionResultsToStepMetrics,
} from "@/services/analytics";
import { EyeTrackingProvider } from "@/state";

function StepTrainingPageContent() {
  const router = useRouter();
  const params = useParams();
  const stage = Number(params.stage);
  const step = Number(params.step) as Step;
  const { state, updateTraining } = useApp();
  const { locale } = state;
  const trackingEnabled =
    (stage === 1 && isStage1TrackingStep(step)) ||
    (stage === 2 && isStage2TrackingStep(step)) ||
    (stage === 3 && isStage3TrackingStep(step));
  const staticMarker =
    (stage === 2 && isStage2TrackingStep(step)) ||
    (stage === 3 && isStage3TrackingStep(step));

  const [showCongrats, setShowCongrats] = useState(false);
  const [metrics, setMetrics] = useState<StepMetrics | null>(null);
  const [exerciseDone, setExerciseDone] = useState(false);
  const [started, setStarted] = useState(false);
  const hideTrackingRef = useRef<(() => void) | null>(null);
  const sessionControlsRef = useRef<TrackingSessionControls | null>(null);
  const sessionFinalizedRef = useRef(false);
  const stepStartedAtRef = useRef<number | null>(null);

  const handleRegisterHideTracking = useCallback((hide: () => void) => {
    hideTrackingRef.current = hide;
  }, []);

  const handleRegisterSessionControls = useCallback(
    (controls: TrackingSessionControls) => {
      sessionControlsRef.current = controls;
    },
    [],
  );

  const handleStartedChange = useCallback((value: boolean) => {
    if (value && stepStartedAtRef.current == null) {
      stepStartedAtRef.current = Date.now();
    }
    setStarted(value);
  }, []);

  const openCongrats = useCallback(
    (computedMetrics: StepMetrics, analysisSnapshot?: StepAnalysisSnapshot) => {
      const startedAtMs = stepStartedAtRef.current ?? Date.now();
      const durationSec =
        analysisSnapshot?.durationSec != null &&
        analysisSnapshot.durationSec > 0
          ? analysisSnapshot.durationSec
          : Math.max(0, (Date.now() - startedAtMs) / 1000);
      const metricsWithTiming: StepMetrics = {
        ...computedMetrics,
        startedAtMs,
        durationSec: Math.round(durationSec * 10) / 10,
      };

      setMetrics(metricsWithTiming);
      setExerciseDone(true);
      updateTraining(
        onTrainingComplete(
          { ...state, stage, step },
          metricsWithTiming,
          analysisSnapshot,
        ),
      );
      void upsertTrainingRecord({
        stage,
        step,
        metrics: metricsWithTiming,
        analysis: analysisSnapshot,
      });
      setShowCongrats(true);
    },
    [state, stage, step, updateTraining],
  );

  const finalizeTrackingSession = useCallback(() => {
    if (sessionFinalizedRef.current || !started) {
      return;
    }

    const analysisSnapshot =
      sessionControlsRef.current?.captureAnalysisSnapshot() ?? undefined;
    const sessionResults = sessionControlsRef.current?.computeSessionResults();
    if (!sessionResults) {
      return;
    }

    sessionFinalizedRef.current = true;
    hideTrackingRef.current?.();
    const stepMetrics: StepMetrics = sessionResultsToStepMetrics(sessionResults);

    if (stage === 3 && (step === 1 || step === 2)) {
      const shoulderMetrics = computeShoulderShrugMetrics(
        analysisSnapshot?.shoulderMovementPoints ?? [],
        step === 1
          ? SHOULDER_UP_CUE_TIMES_SEC
          : SHOULDER_ROTATION_CUE_TIMES_SEC,
      );
      stepMetrics.shoulderCompletionCount = shoulderMetrics.completionCount;
      stepMetrics.shoulderMeanPeakLagSec = shoulderMetrics.meanPeakLagSec;
    }

    if (stage === 3 && step === 3) {
      const waistMetrics = computeWaistTurnMetrics(
        analysisSnapshot?.shoulderMovementPoints ?? [],
        WAIST_LEFT_CUE_TIMES_SEC,
        WAIST_RIGHT_CUE_TIMES_SEC,
      );
      stepMetrics.waistLeftTurnCount = waistMetrics.leftTurnCount;
      stepMetrics.waistRightTurnCount = waistMetrics.rightTurnCount;
      stepMetrics.waistMeanPeakLagSec = waistMetrics.meanPeakLagSec;
    }

    openCongrats(stepMetrics, analysisSnapshot);
  }, [openCongrats, stage, started, step]);

  const handleComplete = useCallback(
    (m: StepMetrics) => {
      if (sessionFinalizedRef.current) {
        return;
      }

      sessionFinalizedRef.current = true;
      openCongrats(m);
    },
    [openCongrats],
  );

  const handleNext = () => {
    if (showCongrats) {
      return;
    }

    if (trackingEnabled) {
      finalizeTrackingSession();
      return;
    }

    if (!exerciseDone || !metrics) return;
    setShowCongrats(true);
  };

  const handleCongratsNext = () => {
    const { state: nextState, route } = onCongratsNext({
      ...state,
      stage,
      step,
      stepResults: { ...state.stepResults, [step]: metrics! },
    });
    updateTraining(nextState);
    setShowCongrats(false);
    router.push(route);
  };

  return (
    <AppShell disableLogoLink>
      <LiveCameraPageLayout
        title={formatStageStep(locale, stage, step)}
        titleClassName="text-center"
        video={
          <HeadExercise
            stage={stage}
            step={step}
            onComplete={handleComplete}
            trackingEnabled={trackingEnabled}
            staticMarker={staticMarker}
            onRegisterHideTracking={handleRegisterHideTracking}
            onRegisterSessionControls={handleRegisterSessionControls}
            onStartedChange={handleStartedChange}
            onTrackingSessionComplete={finalizeTrackingSession}
            actionSlot={
              <Button
                label={`${t(locale, "next")} →`}
                onClick={handleNext}
                disabled={
                  trackingEnabled
                    ? !started || showCongrats
                    : !exerciseDone || showCongrats
                }
                align="right"
              />
            }
          />
        }
      />

      {showCongrats && metrics && (
        <CongratsModal
          locale={locale}
          metrics={metrics}
          showTrackingAnalytics={trackingEnabled}
          onNext={handleCongratsNext}
        />
      )}
    </AppShell>
  );
}

export default function StepTrainingPage() {
  const params = useParams();
  const stage = Number(params.stage);
  const step = Number(params.step) as Step;

  if (stage === 3 && !isStage3Step(step)) {
    notFound();
  }

  const trackingEnabled =
    (stage === 1 && isStage1TrackingStep(step)) ||
    (stage === 2 && isStage2TrackingStep(step)) ||
    (stage === 3 && isStage3TrackingStep(step));

  if (trackingEnabled) {
    return (
      <EyeTrackingProvider>
        <StepTrainingPageContent />
      </EyeTrackingProvider>
    );
  }

  return <StepTrainingPageContent />;
}
