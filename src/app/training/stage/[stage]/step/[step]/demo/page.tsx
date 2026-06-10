"use client";

import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { VideoDemo } from "@/components/VideoDemo";
import { useApp } from "@/components/providers/AppProvider";
import { formatStageStep, t } from "@/lib/i18n";
import { onDemoContinue } from "@/lib/training-flow";
import type { Step } from "@/lib/types";

export default function StepDemoPage() {
  const router = useRouter();
  const params = useParams();
  const stage = Number(params.stage);
  const step = Number(params.step) as Step;
  const { state, updateTraining } = useApp();
  const { locale } = state;

  const handleContinue = () => {
    updateTraining(onDemoContinue({ ...state, stage, step }));
    router.push(`/training/stage/${stage}/step/${step}`);
  };

  return (
    <AppShell disableLogoLink>
      <div className="flex flex-1 flex-col gap-8 py-4">
        <h1 className="text-center text-3xl font-bold text-foreground">
          {formatStageStep(locale, stage, step)}
        </h1>

        <div className="flex flex-1 flex-col items-center">
          <VideoDemo
            videoSrc={
              stage === 1 && step === 1
                ? "/videos/S1S1(vertical).mp4"
                : undefined
            }
          />
        </div>

        <div className="flex justify-end">
          <Button
            label={`${t(locale, "next")} →`}
            onClick={handleContinue}
            align="right"
          />
        </div>
      </div>
    </AppShell>
  );
}
