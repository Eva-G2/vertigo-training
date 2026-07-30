"use client";

import Image from "next/image";
import { useCallback } from "react";
import { Button } from "./Button";
import { useApp } from "./providers/AppProvider";
import {
  getStage2Step1DemoCopy,
  getStage2Step2DemoCopy,
} from "@/lib/stage2DemoCopy";
import {
  BEEP_AWAY_HZ,
  BEEP_LEFT_HZ,
  BEEP_RIGHT_HZ,
  BEEP_TOWARD_HZ,
  playToneBeep,
} from "@/lib/pacingMetronome";

const cueButtonClassName =
  "h-auto w-full whitespace-normal px-4 py-4 text-base leading-snug";

type Stage2DemoCueButtonsProps = {
  step: 1 | 2;
};

export function Stage2DemoCueButtons({ step }: Stage2DemoCueButtonsProps) {
  const { state } = useApp();
  const { locale, sound } = state;
  const copy =
    step === 1 ? getStage2Step1DemoCopy(locale) : getStage2Step2DemoCopy(locale);
  const cues =
    step === 1
      ? [
          {
            imageSrc: "/images/S2S1_Up.png",
            label: copy.first.label,
            frequencyHz: BEEP_AWAY_HZ,
          },
          {
            imageSrc: "/images/S2S1_Down.png",
            label: copy.second.label,
            frequencyHz: BEEP_TOWARD_HZ,
          },
        ]
      : [
          {
            imageSrc: "/images/S2S2_L.png",
            label: copy.first.label,
            frequencyHz: BEEP_LEFT_HZ,
          },
          {
            imageSrc: "/images/S2S2_R.png",
            label: copy.second.label,
            frequencyHz: BEEP_RIGHT_HZ,
          },
        ];

  const playCue = useCallback(
    (frequencyHz: number) => {
      if (sound !== "on") return;
      void playToneBeep(frequencyHz);
    },
    [sound],
  );

  return (
    <div className="flex w-full flex-col gap-3 min-[1068px]:w-[360px]">
      {cues.map((cue) => (
        <Button
          key={cue.imageSrc}
          label={
            <span className="flex w-full flex-col items-stretch gap-3">
              <span className="relative aspect-[4/3] w-full overflow-hidden rounded-[12px]">
                <Image
                  src={cue.imageSrc}
                  alt=""
                  fill
                  sizes="360px"
                  className="stage2-demo-media object-contain p-2"
                />
              </span>
              <span className="text-center leading-snug">{cue.label}</span>
            </span>
          }
          onClick={() => playCue(cue.frequencyHz)}
          align="left"
          className={cueButtonClassName}
        />
      ))}
    </div>
  );
}
