"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppState, AuthState, Locale } from "@/lib/types";
import {
  initialState,
  loadPersistedAuth,
  loadPersistedPreferences,
  persistAuth,
  persistPreferences,
} from "@/lib/state";

type AppContextValue = {
  state: AppState;
  setLocale: (locale: Locale) => void;
  toggleTheme: () => void;
  toggleSound: () => void;
  setAuth: (auth: AuthState, token?: string) => void;
  logout: () => void;
  updateTraining: (partial: Partial<AppState>) => void;
  resetTraining: () => void;
  showLanguageModal: boolean;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    const prefs = loadPersistedPreferences();
    const auth = loadPersistedAuth();
    // Hydrate client preferences after mount to avoid SSR/localStorage mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
    setState((prev) => ({ ...prev, ...prefs, auth }));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme);
    document.documentElement.lang =
      state.locale === "zh-Hant"
        ? "zh-Hant"
        : state.locale === "zh-Hans"
          ? "zh-Hans"
          : "en";
    persistPreferences(state.locale, state.theme, state.sound);
  }, [state.locale, state.theme, state.sound]);

  const setLocale = useCallback((locale: Locale) => {
    setState((prev) => ({ ...prev, locale }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState((prev) => ({
      ...prev,
      theme: prev.theme === "light" ? "dark" : "light",
    }));
  }, []);

  const toggleSound = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sound: prev.sound === "on" ? "off" : "on",
    }));
  }, []);

  const setAuth = useCallback((auth: AuthState, token?: string) => {
    setState((prev) => ({ ...prev, auth }));
    persistAuth(auth, token);
  }, []);

  const logout = useCallback(() => {
    setState((prev) => ({
      ...prev,
      auth: { status: "anonymous" },
      stepResults: {},
      stage: 1,
      step: 1,
      phase: "prepare",
    }));
    persistAuth({ status: "anonymous" });
  }, []);

  const updateTraining = useCallback((partial: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetTraining = useCallback(() => {
    setState((prev) => ({
      ...prev,
      stage: 1,
      step: 1,
      phase: "prepare",
      stepResults: {},
    }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      setLocale,
      toggleTheme,
      toggleSound,
      setAuth,
      logout,
      updateTraining,
      resetTraining,
      showLanguageModal,
      openLanguageModal: () => setShowLanguageModal(true),
      closeLanguageModal: () => setShowLanguageModal(false),
    }),
    [
      state,
      setLocale,
      toggleTheme,
      toggleSound,
      setAuth,
      logout,
      updateTraining,
      resetTraining,
      showLanguageModal,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
