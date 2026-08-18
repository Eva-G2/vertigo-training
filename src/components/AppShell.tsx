"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useApp } from "./providers/AppProvider";
import { LanguageModal } from "./LanguageModal";
import {
  AppLogo,
  DarkModeIcon,
  EyeClosedIcon,
  EyeOpenIcon,
  LanguageIcon,
  LightModeIcon,
  SoundOffIcon,
  SoundOnIcon,
} from "./icons/ChromeIcons";

type AppShellProps = {
  children: ReactNode;
  disableLogoLink?: boolean;
  showSound?: boolean;
  /** When false, hides the bone-landmark visibility toggle. Defaults to true. */
  showBoneLandmarkToggle?: boolean;
  /** When true, locks the shell to the viewport height (no page scroll). */
  lockViewport?: boolean;
};

export function AppShell({
  children,
  disableLogoLink = false,
  showSound = true,
  showBoneLandmarkToggle = true,
  lockViewport = false,
}: AppShellProps) {
  const {
    state,
    toggleTheme,
    toggleSound,
    toggleBoneLandmarks,
    setLocale,
    showLanguageModal,
    openLanguageModal,
    closeLanguageModal,
  } = useApp();

  const { theme, sound, showBoneLandmarks, auth } = state;
  const isDark = theme === "dark";
  const logoHref = auth.status === "authenticated" ? "/home" : "/";

  const logo = <AppLogo theme={theme} />;

  return (
    <div
      className={`flex flex-col bg-background ${
        lockViewport ? "h-dvh overflow-hidden" : "min-h-screen"
      }`}
    >
      <header className="flex shrink-0 items-center justify-between px-8 py-6">
        <div id="logo">
          {disableLogoLink ? (
            <div className="cursor-default">{logo}</div>
          ) : (
            <Link href={logoHref} className="transition-opacity hover:opacity-80">
              {logo}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showBoneLandmarkToggle && (
            <ChromeButton
              id="bone-landmarks-btn"
              onClick={toggleBoneLandmarks}
              bg="var(--chrome-landmarks-bg)"
              title={
                showBoneLandmarks
                  ? "Hide face landmark dots"
                  : "Show face landmark dots"
              }
            >
              {showBoneLandmarks ? <EyeOpenIcon /> : <EyeClosedIcon />}
            </ChromeButton>
          )}

          <ChromeButton
            id="language-btn"
            onClick={openLanguageModal}
            bg="var(--chrome-lang-bg)"
            title="Language"
          >
            <LanguageIcon theme={theme} />
          </ChromeButton>

          {showSound && (
            <ChromeButton
              id="sound-btn"
              onClick={toggleSound}
              bg="var(--chrome-sound-bg)"
              title={sound === "on" ? "Sound on" : "Sound off"}
            >
              {sound === "on" ? <SoundOnIcon /> : <SoundOffIcon />}
            </ChromeButton>
          )}

          <ChromeButton
            id="theme-btn"
            onClick={toggleTheme}
            bg={isDark ? "var(--chrome-theme-bg)" : "#111D4D"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <LightModeIcon /> : <DarkModeIcon />}
          </ChromeButton>
        </div>
      </header>

      <main
        className={`mx-auto flex w-full max-w-[1280px] min-h-0 flex-1 flex-col px-8 ${
          lockViewport ? "overflow-hidden pb-4" : "pb-8"
        }`}
      >
        {children}
      </main>

      {showLanguageModal && (
        <LanguageModal
          locale={state.locale}
          onSelect={setLocale}
          onClose={closeLanguageModal}
        />
      )}
    </div>
  );
}

function ChromeButton({
  id,
  onClick,
  bg,
  title,
  children,
}: {
  id: string;
  onClick: () => void;
  bg: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      title={title}
      style={{ backgroundColor: bg }}
      className="flex h-12 w-12 items-center justify-center rounded-full transition-all hover:opacity-90 active:scale-95"
    >
      {children}
    </button>
  );
}
