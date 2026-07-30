import type { Locale } from "./types";

export type Stage2DemoCueCopy = {
  label: string;
};

export type Stage2StepDemoCopy = {
  first: Stage2DemoCueCopy;
  second: Stage2DemoCueCopy;
};

const step1Copy: Record<Locale, Stage2StepDemoCopy> = {
  en: {
    first: { label: "Rotate head up when hearing this" },
    second: { label: "Rotate head down when hearing this" },
  },
  "zh-Hant": {
    first: { label: "聽到這個聲音時，向上轉動頭部" },
    second: { label: "聽到這個聲音時，向下轉動頭部" },
  },
  "zh-Hans": {
    first: { label: "听到这个声音时，向上转动头部" },
    second: { label: "听到这个声音时，向下转动头部" },
  },
};

const step2Copy: Record<Locale, Stage2StepDemoCopy> = {
  en: {
    first: { label: "Turn head to left when hearing this" },
    second: { label: "Turn head to right when hearing this" },
  },
  "zh-Hant": {
    first: { label: "聽到這個聲音時，將頭轉向左邊" },
    second: { label: "聽到這個聲音時，將頭轉向右邊" },
  },
  "zh-Hans": {
    first: { label: "听到这个声音时，将头转向左边" },
    second: { label: "听到这个声音时，将头转向右边" },
  },
};

export function getStage2Step1DemoCopy(locale: Locale): Stage2StepDemoCopy {
  return step1Copy[locale];
}

export function getStage2Step2DemoCopy(locale: Locale): Stage2StepDemoCopy {
  return step2Copy[locale];
}
