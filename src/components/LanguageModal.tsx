"use client";

import type { Locale } from "@/lib/types";
import { t } from "@/lib/i18n";
import { Button } from "./Button";
import { CloseIcon } from "./icons/ChromeIcons";
import { useApp } from "./providers/AppProvider";

type LanguageModalProps = {
  locale: Locale;
  onSelect: (locale: Locale) => void;
  onClose: () => void;
};

export function LanguageModal({ locale, onSelect, onClose }: LanguageModalProps) {
  const { state } = useApp();
  const isDark = state.theme === "dark";

  const options: { value: Locale; label: string }[] = [
    { value: "en", label: t(locale, "english") },
    { value: "zh-Hant", label: t(locale, "traditionalChinese") },
    { value: "zh-Hans", label: t(locale, "simplifiedChinese") },
  ];

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-[20px] border-[3px] border-border bg-card px-6 py-10 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          id="language-btn-close"
          onClick={onClose}
          className={`absolute -right-3 -top-3 flex h-12 w-12 items-center justify-center rounded-full border-[3px] ${
            isDark ? "border-yellow bg-yellow" : "border-blue bg-blue"
          }`}
          aria-label="Close"
        >
          <CloseIcon theme={state.theme} />
        </button>

        <div className="flex flex-col gap-4 pt-2">
          {options.map((opt) => (
            <Button
              key={opt.value}
              id={`language-option-${opt.value}`}
              variant={locale === opt.value ? "selected" : "secondary"}
              label={opt.label}
              fullWidth
              pill
              onClick={() => {
                onSelect(opt.value);
                onClose();
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
