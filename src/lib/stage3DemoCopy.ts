import type { Locale } from "./types";

export type Stage3DemoCueCopy = {
  label: string;
};

export type Stage3StepDemoCopy = {
  first: Stage3DemoCueCopy;
  second: Stage3DemoCueCopy;
};

const step1Copy: Record<Locale, Stage3StepDemoCopy> = {
  en: {
    first: { label: "Shrug shoulders up when hearing this" },
    second: { label: "Lower shoulders down when hearing this" },
  },
  "zh-Hant": {
    first: { label: "聽到這個聲音時，向上聳肩" },
    second: { label: "聽到這個聲音時，向下放鬆肩膀" },
  },
  "zh-Hans": {
    first: { label: "听到这个声音时，向上耸肩" },
    second: { label: "听到这个声音时，向下放松肩膀" },
  },
};

const step3Copy: Record<Locale, Stage3StepDemoCopy> = {
  en: {
    first: { label: "Twist waist to the left when hearing this" },
    second: { label: "Twist waist to the right when hearing this" },
  },
  "zh-Hant": {
    first: { label: "聽到這個聲音時，向左扭腰" },
    second: { label: "聽到這個聲音時，向右扭腰" },
  },
  "zh-Hans": {
    first: { label: "听到这个声音时，向左扭腰" },
    second: { label: "听到这个声音时，向右扭腰" },
  },
};

export function getStage3Step1DemoCopy(locale: Locale): Stage3StepDemoCopy {
  return step1Copy[locale];
}

export function getStage3Step3DemoCopy(locale: Locale): Stage3StepDemoCopy {
  return step3Copy[locale];
}
