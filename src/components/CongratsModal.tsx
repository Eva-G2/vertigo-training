"use client";

import type { Locale, StepMetrics } from "@/lib/types";
import { t } from "@/lib/i18n";
import { Button } from "./Button";

type CongratsModalProps = {
  locale: Locale;
  metrics: StepMetrics;
  onNext: () => void;
};

export function CongratsModal({ locale, metrics, onNext }: CongratsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="congrats-title"
    >
      <div className="w-full max-w-lg rounded-[20px] border-[3px] border-border bg-card p-8 shadow-xl">
        <h2
          id="congrats-title"
          className="mb-6 text-center text-3xl font-bold text-foreground"
        >
          {t(locale, "congratsTitle")}
        </h2>

        <div className="mb-8 space-y-4 rounded-[20px] border-[3px] border-cyan bg-cyan/10 p-6">
          <MetricRow
            label={t(locale, "completion")}
            value={`${metrics.completionPct}%`}
          />
          <MetricRow
            label={t(locale, "accuracy")}
            value={`${metrics.accuracyPct}%`}
          />
          <MetricRow
            label={t(locale, "averageAngle")}
            value={`${metrics.averageAngleDeg}°`}
          />
        </div>

        <div className="flex justify-center">
          <Button id="congrats-next" label={`${t(locale, "next")} →`} onClick={onNext} />
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-lg">
      <span className="font-medium text-foreground/80">{label}</span>
      <span className="font-bold text-foreground">{value}</span>
    </div>
  );
}
