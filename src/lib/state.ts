import type { AppState, AuthState, Locale, Sound, Theme } from "./types";

export const STORAGE_KEYS = {
  locale: "vt-locale",
  theme: "vt-theme",
  sound: "vt-sound",
  auth: "vt-auth",
  token: "vt-token",
} as const;

export const initialState: AppState = {
  locale: "en",
  theme: "light",
  sound: "on",
  auth: { status: "anonymous" },
  stage: 1,
  step: 1,
  phase: "prepare",
  stepResults: {},
};

export function loadPersistedPreferences(): Pick<AppState, "locale" | "theme" | "sound"> {
  if (typeof window === "undefined") {
    return { locale: "en", theme: "light", sound: "on" };
  }

  const locale = (localStorage.getItem(STORAGE_KEYS.locale) as Locale) || "en";
  const theme = (localStorage.getItem(STORAGE_KEYS.theme) as Theme) || "light";
  const sound = (localStorage.getItem(STORAGE_KEYS.sound) as Sound) || "on";

  return { locale, theme, sound };
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
): void {
  localStorage.setItem(STORAGE_KEYS.locale, locale);
  localStorage.setItem(STORAGE_KEYS.theme, theme);
  localStorage.setItem(STORAGE_KEYS.sound, sound);
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
