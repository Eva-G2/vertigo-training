import type { AppState, AuthState, Locale, Sound, Theme } from "./types";

export const STORAGE_KEYS = {
  locale: "vt-locale",
  theme: "vt-theme",
  sound: "vt-sound",
  showBoneLandmarks: "vt-show-bone-landmarks",
  auth: "vt-auth",
  token: "vt-token",
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

export function loadPersistedAuth(): AuthState {
  if (typeof window === "undefined") {
    return { status: "anonymous" };
  }

  const raw = sessionStorage.getItem(STORAGE_KEYS.auth);
  if (!raw) return { status: "anonymous" };

  try {
    const auth = JSON.parse(raw) as AuthState;
    if (auth.status === "authenticated") return auth;
  } catch {
    // ignore
  }
  return { status: "anonymous" };
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

export function persistAuth(auth: AuthState, token?: string): void {
  if (auth.status === "authenticated") {
    sessionStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(auth));
    if (token) sessionStorage.setItem(STORAGE_KEYS.token, token);
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.auth);
    sessionStorage.removeItem(STORAGE_KEYS.token);
  }
}
