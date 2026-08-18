"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/Card";
import { StepAnalysisGraphs } from "@/components/StepAnalysisGraphs";
import { useApp } from "@/components/providers/AppProvider";
import { formatStageStep, getAnalyticsCopy, t } from "@/lib/i18n";
import {
  SHOULDER_ROTATION_CUE_TIMES_SEC,
  SHOULDER_UP_CUE_TIMES_SEC,
} from "@/lib/pacingMetronome";
import {
  buildHeadMovementSlice,
  buildShoulderMovementSlice,
} from "@/lib/step-analysis-view";
import type { Step } from "@/lib/types";

export default function StepAnalysisPage() {
  const params = useParams();
  const stage = Number(params.stage);
  const step = Number(params.step) as Step;
  const { state } = useApp();
  const { locale, stepResults, stepAnalysis } = state;
  const metrics = stepResults[step];
  const analysis = stepAnalysis[step];
  const analyticsCopy = getAnalyticsCopy(locale);

  return (
    <AppShell>
      <div className="flex flex-1 flex-col items-center gap-8 py-8">
        <h1 className="text-3xl font-bold text-blue">
          {formatStageStep(locale, stage, step)}
        </h1>

        {metrics ? (
          <Card className="w-full">
            <div className="space-y-4 rounded-[20px] border-[3px] border-cyan bg-cyan/10 p-6">
              <MetricRow
                label={t(locale, "completion")}
                value={`${metrics.completionPct}%`}
              />
              <MetricRow
                label={t(locale, "accuracy")}
                value={`${metrics.accuracyPct}%`}
              />
              <MetricRow
                label={t(locale, "averageAngle")}
                value={`${metrics.averageAngleDeg}°`}
              />
            </div>

            {analysis ? (
              <div className="mt-8">
                <StepAnalysisGraphs
                  graphDatasets={analysis.graphDatasets}
                  copy={analyticsCopy}
                  showEyeMovement={stage !== 2}
                  headMovement={buildHeadMovementSlice(
                    analysis.headMovementPoints,
                    analysis.showNoddingTarget,
                    analysis.showTurningTarget,
                  )}
                  shoulderMovement={buildShoulderMovementSlice(
                    analysis.shoulderMovementPoints,
                    stage === 3 && step === 1
                      ? SHOULDER_UP_CUE_TIMES_SEC
                      : stage === 3 && step === 2
                        ? SHOULDER_ROTATION_CUE_TIMES_SEC
                        : undefined,
                  )}
                  exerciseMode={analysis.exerciseMode}
                />
              </div>
            ) : null}
          </Card>
        ) : null}

        <Link
          href={`/training/stage/${stage}/complete`}
          className="text-base font-semibold text-blue underline-offset-4 transition hover:text-dark-blue hover:underline"
        >
          ← {t(locale, "stageComplete")}
        </Link>
      </div>
    </AppShell>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-lg">
      <span className="font-medium text-foreground/80">{label}</span>
      <span className="font-bold text-foreground">{value}</span>
    </div>
  );
}
