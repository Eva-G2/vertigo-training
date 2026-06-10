"use client";

import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { CalibrationCameraFeed } from "@/components/CalibrationCameraFeed";
import { useApp } from "@/components/providers/AppProvider";
import { useTestContext } from "@/components/providers/TestContext";
import { formatStagePrepare, t } from "@/lib/i18n";
import { onPrepareStart } from "@/lib/training-flow";

export default function StagePreparePage() {
  const router = useRouter();
  const params = useParams();
  const stage = Number(params.stage);
  const { state, updateTraining } = useApp();
  const { locale } = state;
  const { isCalibrated } = useTestContext();

  const handleStart = () => {
    if (!isCalibrated) return;
    updateTraining(onPrepareStart({ ...state, stage }));
    router.push(`/training/stage/${stage}/step/1/demo`);
  };

  return (
    <AppShell disableLogoLink>
      <div className="flex flex-1 flex-col gap-8 py-4">
        <h1 className="text-center text-3xl font-bold text-foreground">
          {formatStagePrepare(locale, stage)}
        </h1>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <CalibrationCameraFeed className="min-h-[min(60vh,480px)]" />
          {!isCalibrated && (
            <p className="mt-4 max-w-xl text-center text-sm text-foreground/70">
              {t(locale, "calibrationRequired")}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            label={`${t(locale, "next")} →`}
            onClick={handleStart}
            disabled={!isCalibrated}
            align="right"
          />
        </div>
      </div>
    </AppShell>
  );
}
