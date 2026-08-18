import type { AppState, Locale, Sound, Theme } from "./types";

export const STORAGE_KEYS = {
  locale: "vt-locale",
  theme: "vt-theme",
  sound: "vt-sound",
  showBoneLandmarks: "vt-show-bone-landmarks",
} as const;

export const initialState: AppState = {
  locale: "en",
  theme: "light",
  sound: "on",
  showBoneLandmarks: true,
  auth: { status: "anonymous" },
  stage: 1,
  step: 1,
  phase: "prepare",
  stageStartedAt: {},
  stepResults: {},
  stepAnalysis: {},
};

export function loadPersistedPreferences(): Pick<
  AppState,
  "locale" | "theme" | "sound" | "showBoneLandmarks"
> {
  if (typeof window === "undefined") {
    return {
      locale: "en",
      theme: "light",
      sound: "on",
      showBoneLandmarks: true,
    };
  }

  const locale = (localStorage.getItem(STORAGE_KEYS.locale) as Locale) || "en";
  const theme = (localStorage.getItem(STORAGE_KEYS.theme) as Theme) || "light";
  const sound = (localStorage.getItem(STORAGE_KEYS.sound) as Sound) || "on";
  const boneRaw = localStorage.getItem(STORAGE_KEYS.showBoneLandmarks);
  const showBoneLandmarks = boneRaw == null ? true : boneRaw === "true";

  return { locale, theme, sound, showBoneLandmarks };
}

export function persistPreferences(
  locale: Locale,
  theme: Theme,
  sound: Sound,
  showBoneLandmarks: boolean,
): void {
  localStorage.setItem(STORAGE_KEYS.locale, locale);
  localStorage.setItem(STORAGE_KEYS.theme, theme);
  localStorage.setItem(STORAGE_KEYS.sound, sound);
  localStorage.setItem(
    STORAGE_KEYS.showBoneLandmarks,
    showBoneLandmarks ? "true" : "false",
  );
}
