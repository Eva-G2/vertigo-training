"use client";

import { useState } from "react";
import { TrackingAnalyticsModal } from "@/components/tracking";
import type { Locale, StepMetrics } from "@/lib/types";
import { getAnalyticsCopy, t } from "@/lib/i18n";
import { Button } from "./Button";

type CongratsModalProps = {
  locale: Locale;
  metrics: StepMetrics;
  onNext: () => void;
  showTrackingAnalytics?: boolean;
};

export function CongratsModal({
  locale,
  metrics,
  onNext,
  showTrackingAnalytics = false,
}: CongratsModalProps) {
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const hasShoulderShrugMetrics =
    metrics.shoulderCompletionCount != null &&
    metrics.shoulderMeanPeakLagSec != null;
  const hasWaistTurnMetrics =
    metrics.waistLeftTurnCount != null &&
    metrics.waistRightTurnCount != null &&
    metrics.waistMeanPeakLagSec != null;

  return (
    <>
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

          <div className="mb-6 space-y-4 rounded-[20px] border-[3px] border-cyan bg-cyan/10 p-6">
            {hasWaistTurnMetrics ? (
              <>
                <MetricRow
                  label={t(locale, "leftTurn")}
                  value={`${metrics.waistLeftTurnCount}/20`}
                />
                <MetricRow
                  label={t(locale, "rightTurn")}
                  value={`${metrics.waistRightTurnCount}/20`}
                />
                <MetricRow
                  label={t(locale, "timeLag")}
                  value={`${metrics.waistMeanPeakLagSec!.toFixed(2)}s`}
                />
              </>
            ) : (
              <>
                <MetricRow
                  label={t(locale, "completion")}
                  value={
                    hasShoulderShrugMetrics
                      ? `${metrics.shoulderCompletionCount}/20`
                      : `${metrics.completionPct}%`
                  }
                />
                <MetricRow
                  label={t(
                    locale,
                    hasShoulderShrugMetrics ? "timeLagged" : "accuracy",
                  )}
                  value={
                    hasShoulderShrugMetrics
                      ? `${metrics.shoulderMeanPeakLagSec!.toFixed(2)}s`
                      : `${metrics.accuracyPct}%`
                  }
                />
                {!hasShoulderShrugMetrics ? (
                  <MetricRow
                    label={t(locale, "averageAngle")}
                    value={`${metrics.averageAngleDeg}°`}
                  />
                ) : null}
              </>
            )}
          </div>

          {showTrackingAnalytics && (
            <div className="mb-6 flex justify-center">
              <button
                type="button"
                onClick={() => setAnalyticsOpen(true)}
                className="text-base font-semibold text-blue underline-offset-4 transition hover:text-dark-blue hover:underline"
              >
                {t(locale, "viewTrackingAnalytics")}
              </button>
            </div>
          )}

          <div className="flex justify-center">
            <Button
              id="congrats-next"
              label={`${t(locale, "next")} →`}
              onClick={onNext}
            />
          </div>
        </div>
      </div>

      {showTrackingAnalytics && (
        <TrackingAnalyticsModal
          open={analyticsOpen}
          title={t(locale, "viewTrackingAnalytics")}
          closeLabel={t(locale, "closeAnalytics")}
          copy={getAnalyticsCopy(locale)}
          onClose={() => setAnalyticsOpen(false)}
        />
      )}
    </>
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
