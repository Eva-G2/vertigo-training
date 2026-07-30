import type { Locale } from "./types";

export type Stage1Step3DemoCopy = {
  holdFingerOut: string;
  moveFingerTowardNose: string;
};

const copy: Record<Locale, Stage1Step3DemoCopy> = {
  en: {
    holdFingerOut: "When you hear this, hold out finger with straight arm",
    moveFingerTowardNose: "When you hear this, move your finger towards your nose",
  },
  "zh-Hant": {
    holdFingerOut: "聽到這個聲音時，伸直手臂並伸出手指",
    moveFingerTowardNose: "聽到這個聲音時，將手指移向鼻子",
  },
  "zh-Hans": {
    holdFingerOut: "听到这个声音时，伸直手臂并伸出手指",
    moveFingerTowardNose: "听到这个声音时，将手指移向鼻子",
  },
};

export function getStage1Step3DemoCopy(locale: Locale): Stage1Step3DemoCopy {
  return copy[locale];
}
