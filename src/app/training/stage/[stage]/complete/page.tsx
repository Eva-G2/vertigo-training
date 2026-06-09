"use client";

import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useApp } from "@/components/providers/AppProvider";
import { t } from "@/lib/i18n";
import type { Step } from "@/lib/types";

const STEPS: Step[] = [1, 2, 3];

export default function StageCompletePage() {
  const router = useRouter();
  const params = useParams();
  const stage = Number(params.stage);
  const { state, logout, resetTraining } = useApp();
  const { locale, stepResults } = state;

  const handleReturnHome = () => {
    router.push("/");
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleRestart = () => {
    resetTraining();
    router.push(`/training/stage/${stage}/prepare`);
  };

  return (
    <AppShell>
      <div className="flex flex-1 flex-col items-center gap-8 py-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-yellow bg-yellow/20 text-5xl">
          🏆
        </div>

        <h1 className="text-3xl font-bold text-blue">{t(locale, "stageComplete")}</h1>
        <p className="max-w-lg text-center text-lg text-foreground/80">
          {t(locale, "stageCompleteMessage")}
        </p>

        <Card className="w-full max-w-lg">
          <h2 className="mb-4 text-center text-xl font-bold text-cyan">
            {t(locale, "congratsTitle")}
          </h2>
          <div className="space-y-3">
            {STEPS.map((s) => {
              const result = stepResults[s];
              if (!result) return null;
              return (
                <div
                  key={s}
                  className="flex items-center justify-between rounded-[20px] border-[3px] border-blue/30 px-4 py-3"
                >
                  <span className="font-medium">
                    {t(locale, "stageStep").replace("{n}", String(stage)).replace("{m}", String(s))}
                  </span>
                  <span className="text-sm text-foreground/70">
                    {result.completionPct}% · {result.accuracyPct}% · {result.averageAngleDeg}°
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Button label={t(locale, "returnHome")} onClick={handleReturnHome} />
          <Button
            variant="secondary"
            label={t(locale, "restart")}
            onClick={handleRestart}
          />
          <Button
            variant="secondary"
            label={t(locale, "logout")}
            onClick={handleLogout}
          />
        </div>
      </div>
    </AppShell>
  );
}
