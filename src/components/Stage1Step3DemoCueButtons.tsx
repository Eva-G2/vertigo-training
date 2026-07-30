"use client";

import { useCallback } from "react";
import { Button } from "./Button";
import { useApp } from "./providers/AppProvider";
import { getStage1Step3DemoCopy } from "@/lib/stage1Step3DemoCopy";
import {
  BEEP_AWAY_HZ,
  BEEP_TOWARD_HZ,
  playToneBeep,
} from "@/lib/pacingMetronome";

const cueButtonClassName =
  "h-auto min-h-[80px] w-full whitespace-normal px-6 py-4 text-left text-base leading-snug";

export function Stage1Step3DemoCueButtons() {
  const { state } = useApp();
  const { locale, sound } = state;
  const copy = getStage1Step3DemoCopy(locale);

  const playHoldCue = useCallback(() => {
    if (sound !== "on") return;
    void playToneBeep(BEEP_AWAY_HZ);
  }, [sound]);

  const playMoveCue = useCallback(() => {
    if (sound !== "on") return;
    void playToneBeep(BEEP_TOWARD_HZ);
  }, [sound]);

  return (
    <div className="flex w-full flex-col gap-3 min-[1068px]:w-[360px]">
      <Button
        label={copy.holdFingerOut}
        onClick={playHoldCue}
        align="left"
        className={cueButtonClassName}
      />
      <Button
        label={copy.moveFingerTowardNose}
        onClick={playMoveCue}
        align="left"
        className={cueButtonClassName}
      />
    </div>
  );
}
