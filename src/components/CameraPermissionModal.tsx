"use client";

import type { Locale } from "@/lib/types";
import { t } from "@/lib/i18n";
import { Button } from "./Button";
import { CloseIcon } from "./icons/ChromeIcons";
import { useApp } from "./providers/AppProvider";

type CameraPermissionModalProps = {
  locale: Locale;
  onAllow: () => void;
  onDeny: () => void;
};

export function CameraPermissionModal({
  locale,
  onAllow,
  onDeny,
}: CameraPermissionModalProps) {
  const { state } = useApp();
  const isDark = state.theme === "dark";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-permission-title"
    >
      <div className="relative w-full max-w-md rounded-[20px] border-[3px] border-border bg-card p-8 shadow-xl">
        <button
          type="button"
          onClick={onDeny}
          className={`absolute -right-3 -top-3 flex h-12 w-12 items-center justify-center rounded-full border-[3px] ${
            isDark
              ? "border-yellow bg-yellow"
              : "border-blue bg-blue"
          }`}
          aria-label="Close"
        >
          <CloseIcon theme={state.theme} />
        </button>

        <h2
          id="camera-permission-title"
          className="mb-4 text-center text-2xl font-bold text-foreground"
        >
          {t(locale, "cameraPermissionTitle")}
        </h2>
        <p className="mb-8 text-center text-base leading-relaxed text-foreground/80">
          {t(locale, "cameraPermissionMessage")}
        </p>

        <div className="flex flex-col gap-4">
          <Button
            variant="selected"
            label={t(locale, "allowCamera")}
            fullWidth
            pill
            onClick={onAllow}
          />
          <Button
            label={t(locale, "denyCamera")}
            fullWidth
            pill
            onClick={onDeny}
          />
        </div>
      </div>
    </div>
  );
}
