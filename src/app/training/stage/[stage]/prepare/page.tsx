"use client";

import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { CameraFeed } from "@/components/CameraFeed";
import { useApp } from "@/components/providers/AppProvider";
import { formatStagePrepare, t } from "@/lib/i18n";
import { onPrepareStart } from "@/lib/training-flow";

export default function StagePreparePage() {
  const router = useRouter();
  const params = useParams();
  const stage = Number(params.stage);
  const { state, updateTraining } = useApp();
  const { locale } = state;

  const handleStart = () => {
    updateTraining(onPrepareStart({ ...state, stage }));
    router.push(`/training/stage/${stage}/step/1/demo`);
  };

  return (
    <AppShell disableLogoLink>
      <div className="flex flex-1 flex-col gap-8 py-4">
        <h1 className="text-center text-3xl font-bold text-foreground">
          {formatStagePrepare(locale, stage)}
        </h1>

        <div className="flex flex-1 flex-col items-center">
          <CameraFeed />
        </div>

        <div className="flex justify-end">
          <Button label={t(locale, "start")} onClick={handleStart} align="right" />
        </div>
      </div>
    </AppShell>
  );
}
