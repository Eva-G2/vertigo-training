"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { CongratsModal } from "@/components/CongratsModal";
import { HeadExercise } from "@/components/HeadExercise";
import { useApp } from "@/components/providers/AppProvider";
import { formatStageStep, t } from "@/lib/i18n";
import { onCongratsNext, onTrainingComplete } from "@/lib/training-flow";
import type { Step, StepMetrics } from "@/lib/types";

export default function StepTrainingPage() {
  const router = useRouter();
  const params = useParams();
  const stage = Number(params.stage);
  const step = Number(params.step) as Step;
  const { state, updateTraining } = useApp();
  const { locale } = state;

  const [showCongrats, setShowCongrats] = useState(false);
  const [metrics, setMetrics] = useState<StepMetrics | null>(null);
  const [exerciseDone, setExerciseDone] = useState(false);
  const hideTrackingRef = useRef<(() => void) | null>(null);

  const handleComplete = useCallback(
    (m: StepMetrics) => {
      setMetrics(m);
      setExerciseDone(true);
      updateTraining(onTrainingComplete({ ...state, stage, step }, m));
    },
    [state, stage, step, updateTraining],
  );

  const handleNext = () => {
    if (!exerciseDone || !metrics) return;
    hideTrackingRef.current?.();
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
      <div className="flex flex-1 flex-col gap-8 py-4">
        <h1 className="text-center text-3xl font-bold text-foreground">
          {formatStageStep(locale, stage, step)}
        </h1>

        <div className="flex flex-1 flex-col items-center">
          <HeadExercise
            step={step}
            onComplete={handleComplete}
            trackingEnabled={stage === 1 && step === 1}
            onRegisterHideTracking={(hide) => {
              hideTrackingRef.current = hide;
            }}
          />
        </div>

        <div className="flex justify-end">
          <Button
            label={`${t(locale, "next")} →`}
            onClick={handleNext}
            disabled={!exerciseDone}
            align="right"
          />
        </div>
      </div>

      {showCongrats && metrics && (
        <CongratsModal
          locale={locale}
          metrics={metrics}
          onNext={handleCongratsNext}
        />
      )}
    </AppShell>
  );
}
