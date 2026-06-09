"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useApp } from "@/components/providers/AppProvider";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const START_BUTTONS: { label: string; locale: Locale }[] = [
  { label: "Start", locale: "en" },
  { label: "開始", locale: "zh-Hant" },
  { label: "开始", locale: "zh-Hans" },
];

export default function StartPage() {
  const router = useRouter();
  const { state, setLocale } = useApp();
  const { locale } = state;

  const handleStart = (newLocale: Locale) => {
    setLocale(newLocale);
    router.push("/login");
  };

  return (
    <AppShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-10 py-12">
        <Card className="w-full max-w-3xl px-10 py-12 text-center">
          <h1 className="text-2xl font-bold leading-snug text-foreground sm:text-3xl">
            {t(locale, "appTitle")}
          </h1>
          <hr className="my-6 border-t-[3px] border-border" />
          <p className="text-xl font-medium text-foreground sm:text-2xl">
            {t(locale, "appSubtitle")}
          </p>
        </Card>

        <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
          {START_BUTTONS.map((btn) => (
            <Button
              key={btn.locale}
              label={btn.label}
              onClick={() => handleStart(btn.locale)}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
