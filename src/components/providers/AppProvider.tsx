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
  loadPersistedPreferences,
  persistPreferences,
} from "@/lib/state";
import { authFromUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";
import { migrateLocalTrainingRecordsOnce } from "@/lib/supabase/training-records";

type AppContextValue = {
  state: AppState;
  authReady: boolean;
  setLocale: (locale: Locale) => void;
  toggleTheme: () => void;
  toggleSound: () => void;
  toggleBoneLandmarks: () => void;
  setAuth: (auth: AuthState) => void;
  logout: () => Promise<void>;
  updateTraining: (partial: Partial<AppState>) => void;
  resetTraining: () => void;
  showLanguageModal: boolean;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function resetTrainingFields(): Pick<
  AppState,
  | "stepResults"
  | "stepAnalysis"
  | "stage"
  | "step"
  | "phase"
  | "stageStartedAt"
> {
  return {
    stepResults: {},
    stepAnalysis: {},
    stage: 1,
    step: 1,
    phase: "prepare",
    stageStartedAt: {},
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [authReady, setAuthReady] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    const prefs = loadPersistedPreferences();
    // Hydrate client preferences after mount to avoid SSR/localStorage mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
    setState((prev) => ({ ...prev, ...prefs }));

    const supabase = createClient();

    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      const auth = authFromUser(session?.user);
      if (auth.status === "authenticated") {
        await migrateLocalTrainingRecordsOnce(auth.userId);
      }
      setState((prev) => ({
        ...prev,
        auth,
      }));
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const auth = authFromUser(session?.user);
      setState((prev) => ({
        ...prev,
        auth,
      }));
      if (auth.status === "authenticated") {
        void migrateLocalTrainingRecordsOnce(auth.userId);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme);
    document.documentElement.lang =
      state.locale === "zh-Hant"
        ? "zh-Hant"
        : state.locale === "zh-Hans"
          ? "zh-Hans"
          : "en";
    persistPreferences(
      state.locale,
      state.theme,
      state.sound,
      state.showBoneLandmarks,
    );
  }, [state.locale, state.theme, state.sound, state.showBoneLandmarks]);

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

  const toggleBoneLandmarks = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showBoneLandmarks: !prev.showBoneLandmarks,
    }));
  }, []);

  const setAuth = useCallback((auth: AuthState) => {
    setState((prev) => ({ ...prev, auth }));
  }, []);

  const logout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setState((prev) => ({
      ...prev,
      auth: { status: "anonymous" },
      ...resetTrainingFields(),
    }));
  }, []);

  const updateTraining = useCallback((partial: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetTraining = useCallback(() => {
    setState((prev) => ({
      ...prev,
      ...resetTrainingFields(),
    }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      authReady,
      setLocale,
      toggleTheme,
      toggleSound,
      toggleBoneLandmarks,
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
      authReady,
      setLocale,
      toggleTheme,
      toggleSound,
      toggleBoneLandmarks,
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
