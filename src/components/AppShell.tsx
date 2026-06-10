"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useApp } from "./providers/AppProvider";
import { LanguageModal } from "./LanguageModal";
import {
  AppLogo,
  DarkModeIcon,
  LanguageIcon,
  LightModeIcon,
  SoundOffIcon,
  SoundOnIcon,
} from "./icons/ChromeIcons";

type AppShellProps = {
  children: ReactNode;
  disableLogoLink?: boolean;
  showSound?: boolean;
};

export function AppShell({
  children,
  disableLogoLink = false,
  showSound = true,
}: AppShellProps) {
  const {
    state,
    toggleTheme,
    toggleSound,
    setLocale,
    showLanguageModal,
    openLanguageModal,
    closeLanguageModal,
  } = useApp();

  const { theme, sound } = state;
  const isDark = theme === "dark";

  const logo = <AppLogo theme={theme} />;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-8 py-6">
        <div id="logo">
          {disableLogoLink ? (
            <div className="cursor-default">{logo}</div>
          ) : (
            <Link href="/" className="transition-opacity hover:opacity-80">
              {logo}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
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

      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-8 pb-8">
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
