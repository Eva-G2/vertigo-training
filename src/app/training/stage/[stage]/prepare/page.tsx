"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { CalibrationCameraFeed } from "@/components/CalibrationCameraFeed";
import { LiveCameraPageLayout, LIVE_VIDEO_FILL_CLASS } from "@/components/LiveCameraPageLayout";
import { LiveCameraStageFrame } from "@/components/LiveCameraStageFrame";
import type { CalibrationUiState } from "@/components/camera/CalibrationOverlay";
import { calibrationUiStatesEqual } from "@/components/camera/CalibrationOverlay";
import { useApp } from "@/components/providers/AppProvider";
import { useTestContext } from "@/components/providers/TestContext";
import { formatStagePrepare, getCalibrationCopy, t } from "@/lib/i18n";
import { onPrepareStart } from "@/lib/training-flow";

function Stage2PrepareRedirect() {
  const router = useRouter();
  const { state, updateTraining } = useApp();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    updateTraining(onPrepareStart({ ...state, stage: 2 }));
    router.replace("/training/stage/2/step/1/demo");
  }, [router, state, updateTraining]);

  return null;
}

function Stage3PrepareRedirect() {
  const router = useRouter();
  const { state, updateTraining } = useApp();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    updateTraining(onPrepareStart({ ...state, stage: 3 }));
    router.replace("/training/stage/3/step/1/demo");
  }, [router, state, updateTraining]);

  return null;
}

function Stage1PreparePage() {
  const router = useRouter();
  const { state, updateTraining } = useApp();
  const { locale } = state;
  const { isCalibrated } = useTestContext();

  const captureRef = useRef<(() => void) | null>(null);
  const [calibrationUi, setCalibrationUi] = useState<CalibrationUiState | null>(
    null,
  );

  const handleCalibrationUiChange = useCallback(
    (next: CalibrationUiState | null) => {
      setCalibrationUi((previous) =>
        calibrationUiStatesEqual(previous, next) ? previous : next,
      );
    },
    [],
  );

  const handleStart = () => {
    if (!isCalibrated) return;
    updateTraining(onPrepareStart({ ...state, stage: 1 }));
    router.push("/training/stage/1/step/1/demo");
  };

  const calibrationCopy = getCalibrationCopy(locale);
  const instruction = isCalibrated
    ? t(locale, "calibrationComplete")
    : (calibrationUi?.instruction ?? calibrationCopy.faceCamera);

  return (
    <AppShell disableLogoLink>
      <LiveCameraPageLayout
        title={formatStagePrepare(locale, 1)}
        titleClassName="text-left sm:text-4xl"
        titleContainerClassName="pl-[10vw] pr-[40px]"
        video={
          <LiveCameraStageFrame
            aboveVideo={
              <p className="min-h-[3.5rem] text-center text-lg font-semibold text-foreground sm:text-xl">
                {instruction}
              </p>
            }
            action={
              isCalibrated ? (
                <Button
                  label={`${t(locale, "next")} →`}
                  onClick={handleStart}
                />
              ) : (
                <Button
                  label={calibrationCopy.capture}
                  onClick={() => captureRef.current?.()}
                  disabled={!calibrationUi?.canCapture}
                />
              )
            }
            video={
              <CalibrationCameraFeed
                className={LIVE_VIDEO_FILL_CLASS}
                onCalibrationStateChange={handleCalibrationUiChange}
                captureActionRef={captureRef}
              />
            }
          />
        }
      />
    </AppShell>
  );
}

export default function StagePreparePage() {
  const params = useParams();
  const stage = Number(params.stage);

  if (stage === 2) {
    return <Stage2PrepareRedirect />;
  }

  if (stage === 3) {
    return <Stage3PrepareRedirect />;
  }

  return <Stage1PreparePage />;
}
