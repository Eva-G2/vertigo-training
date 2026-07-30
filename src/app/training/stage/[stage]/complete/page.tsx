"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { StageRecordsReport } from "@/components/StageRecordsReport";
import { useApp } from "@/components/providers/AppProvider";
import { formatStageStep, t } from "@/lib/i18n";
import { getStageSteps, startNextStage } from "@/lib/training-flow";
import type { Step } from "@/lib/types";

export default function StageCompletePage() {
  const router = useRouter();
  const params = useParams();
  const stage = Number(params.stage);
  const { state, updateTraining } = useApp();
  const { locale, stepResults } = state;
  const steps = getStageSteps(stage);

  const handleReturnHome = () => {
    router.push("/");
  };

  const handleRestart = () => {
    updateTraining({
      stage,
      step: 1,
      phase: "prepare",
      stepResults: {},
      stepAnalysis: {},
    });
    router.push(`/training/stage/${stage}/prepare`);
  };

  const handleContinueStage2 = () => {
    updateTraining(startNextStage(state, 2));
    router.push("/training/stage/2/prepare");
  };

  const handleContinueStage3 = () => {
    updateTraining(startNextStage(state, 3));
    router.push("/training/stage/3/prepare");
  };

  return (
    <AppShell>
      <div className="flex flex-1 flex-col items-center gap-8 py-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-yellow bg-yellow/20 text-5xl">
          🏆
        </div>

        <h1 className="text-3xl font-bold text-blue">{t(locale, "stageComplete")}</h1>

        <Card className="w-[80%]">
          <h2 className="mb-4 text-center text-xl font-bold text-cyan">
            {t(locale, "congratsTitle")}
          </h2>
          <div className="space-y-3">
            {steps.map((s: Step) => {
              const result = stepResults[s];
              if (!result) return null;
              return (
                <Link
                  key={s}
                  href={`/training/stage/${stage}/step/${s}/analysis`}
                  className="flex flex-col items-start gap-1 rounded-[20px] border-[3px] border-blue/30 px-4 py-3 transition hover:border-blue hover:bg-blue/5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium">
                    {formatStageStep(locale, stage, s)}
                  </span>
                  <span className="text-sm text-foreground/70">
                    {result.completionPct}% · {result.accuracyPct}% ·{" "}
                    {result.averageAngleDeg}°
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
          <Button
            variant="secondary"
            label={t(locale, "restart")}
            onClick={handleRestart}
          />
          <StageRecordsReport stage={stage} />
          <Button
            variant="secondary"
            label={t(locale, "returnHome")}
            onClick={handleReturnHome}
          />
          {stage === 1 && (
            <Button
              label={t(locale, "continueToStage2")}
              onClick={handleContinueStage2}
            />
          )}
          {stage === 2 && (
            <Button
              label="Continue to Stage 3"
              onClick={handleContinueStage3}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
