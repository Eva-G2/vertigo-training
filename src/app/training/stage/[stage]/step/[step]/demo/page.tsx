"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { LiveCameraPageLayout } from "@/components/LiveCameraPageLayout";
import { LiveCameraStageFrame } from "@/components/LiveCameraStageFrame";
import { Stage1Step3DemoCueButtons } from "@/components/Stage1Step3DemoCueButtons";
import { Stage2DemoCueButtons } from "@/components/Stage2DemoCueButtons";
import { Stage3DemoCueButtons } from "@/components/Stage3DemoCueButtons";
import { VideoDemo } from "@/components/VideoDemo";
import { useApp } from "@/components/providers/AppProvider";
import { formatStageStep, t } from "@/lib/i18n";
import { getDemoVideoSrc } from "@/lib/stage1Steps";
import { getStage3DemoVideoSrc, isStage3Step } from "@/lib/stage3Steps";
import { onDemoContinue } from "@/lib/training-flow";
import type { Step } from "@/lib/types";

export default function StepDemoPage() {
  const router = useRouter();
  const params = useParams();
  const stage = Number(params.stage);
  const step = Number(params.step) as Step;
  const { state, updateTraining } = useApp();
  const { locale } = state;

  if (stage === 3 && !isStage3Step(step)) {
    notFound();
  }

  const isStage1Step3 = stage === 1 && step === 3;
  const videoSrc =
    stage === 3 ? getStage3DemoVideoSrc(step) : getDemoVideoSrc(stage, step);
  const leftAction =
    isStage1Step3 ? (
      <Stage1Step3DemoCueButtons />
    ) : stage === 2 && (step === 1 || step === 2) ? (
      <Stage2DemoCueButtons step={step} />
    ) : stage === 3 && (step === 1 || step === 3) ? (
      <Stage3DemoCueButtons step={step} />
    ) : undefined;

  const handleContinue = () => {
    updateTraining(onDemoContinue({ ...state, stage, step }));
    router.push(`/training/stage/${stage}/step/${step}`);
  };

  return (
    <AppShell disableLogoLink>
      <LiveCameraPageLayout
        title={formatStageStep(locale, stage, step)}
        titleClassName="text-center"
        frameSize="demo"
        video={
          <LiveCameraStageFrame
            frameSize="demo"
            leftAction={leftAction}
            action={
              <Button
                label={`${t(locale, "next")} →`}
                onClick={handleContinue}
                align="right"
              />
            }
            video={
              <VideoDemo
                videoSrc={videoSrc}
                stage2Media={stage === 2}
                stage3Media={stage === 3}
              />
            }
          />
        }
      />
    </AppShell>
  );
}
