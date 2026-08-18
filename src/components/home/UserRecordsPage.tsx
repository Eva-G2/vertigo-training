"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/Card";
import { StepAnalysisGraphs } from "@/components/StepAnalysisGraphs";
import { useApp } from "@/components/providers/AppProvider";
import { createClient } from "@/lib/supabase/client";
import { formatStageStep, getAnalyticsCopy, t } from "@/lib/i18n";
import {
  SHOULDER_ROTATION_CUE_TIMES_SEC,
  SHOULDER_UP_CUE_TIMES_SEC,
} from "@/lib/pacingMetronome";
import {
  buildHeadMovementSlice,
  buildShoulderMovementSlice,
  formatWayToGoMetrics,
  hasAnalysisGraph,
} from "@/lib/step-analysis-view";
import {
  fetchTrainingRecords,
  groupTrainingRecords,
  marksFromTrainingRecords,
} from "@/lib/supabase/training-records";
import { getStageSteps } from "@/lib/training-flow";
import {
  getStageRecord,
  getStepAnalysis,
  getStepMetrics,
  isStageCompleteOnDay,
  loadDoctorNotes,
  parseDateKey,
  saveDoctorNotes,
  stageHasMetrics,
  startOfLocalDay,
  toDateKey,
  type DayMark,
  type DayTrainingRecord,
} from "@/lib/training-progress";
import type { Locale, Step, StepAnalysisSnapshot, StepMetrics } from "@/lib/types";

function formatRecordDate(locale: Locale, date: Date): string {
  return new Intl.DateTimeFormat(
    locale === "zh-Hant" ? "zh-HK" : locale === "zh-Hans" ? "zh-CN" : "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  ).format(date);
}

function formatWeekday(locale: Locale, date: Date): string {
  return new Intl.DateTimeFormat(
    locale === "zh-Hant" ? "zh-HK" : locale === "zh-Hans" ? "zh-CN" : "en-US",
    { weekday: "long" },
  ).format(date);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function UserRecordsPage() {
  const searchParams = useSearchParams();
  const { state } = useApp();
  const { locale, auth } = state;
  const userId = auth.status === "authenticated" ? auth.userId : null;

  const focusDateKey = searchParams.get("date");

  const [expandedKey, setExpandedKey] = useState<string | null>(() => focusDateKey);

  const [query, setQuery] = useState("");
  const [selectedDateKey, setSelectedDateKey] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [records, setRecords] = useState<Record<string, DayTrainingRecord>>({});
  const [fallbackMarks, setFallbackMarks] = useState<Record<string, DayMark>>({});
  const [startDate, setStartDate] = useState<Date | null>(null);

  const [notes, setNotes] = useState("");
  useEffect(() => {
    if (!userId) return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setNotes(loadDoctorNotes(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setStartDate(null);
      return;
    }
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user?.created_at) return;
      setStartDate(startOfLocalDay(new Date(user.created_at)));
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setRecords({});
      setFallbackMarks({});
      return;
    }

    let cancelled = false;
    void fetchTrainingRecords(userId).then((rows) => {
      if (cancelled) return;
      setRecords(groupTrainingRecords(rows));
      setFallbackMarks(marksFromTrainingRecords(rows));
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const hydratedRecords = useMemo(() => {
    const todayKey = toDateKey(new Date());
    const stage = Math.min(Math.max(state.stage, 1), 3) as 1 | 2 | 3;
    const liveSteps = state.stepResults;
    const liveAnalysis = state.stepAnalysis;
    const hasLive =
      Object.values(liveSteps).some((metrics) => metrics != null) ||
      Object.values(liveAnalysis).some((snapshot) => snapshot != null);
    if (!hasLive) return records;

    const existing = records[todayKey] ?? { stages: {} };
    const mergedStage = { ...(getStageRecord(existing, stage) ?? {}) };
    const mergedAnalysis = { ...(existing.analysis?.[stage] ?? {}) };
    ([1, 2, 3, 4] as Step[]).forEach((step) => {
      const metrics = liveSteps[step];
      if (metrics) mergedStage[step] = metrics;
      const snapshot = liveAnalysis[step];
      if (snapshot) mergedAnalysis[step] = snapshot;
    });

    return {
      ...records,
      [todayKey]: {
        stages: {
          ...existing.stages,
          [stage]: mergedStage,
        },
        analysis: {
          ...existing.analysis,
          [stage]: mergedAnalysis,
        },
      },
    };
  }, [records, state.stage, state.stepAnalysis, state.stepResults]);

  const storedDayKeys = useMemo(() => {
    const recordKeys = Object.keys(hydratedRecords);
    const keys = recordKeys.length > 0 ? recordKeys : Object.keys(fallbackMarks);
    return keys
      .filter((key) => parseDateKey(key) != null)
      .sort((a, b) => {
        const da = parseDateKey(a)?.getTime() ?? 0;
        const db = parseDateKey(b)?.getTime() ?? 0;
        return db - da;
      });
  }, [fallbackMarks, hydratedRecords]);

  const timelineDayKeys = useMemo(() => {
    const today = startOfLocalDay(new Date());

    let rangeStart = startDate;
    if (!rangeStart && storedDayKeys.length > 0) {
      const oldestStored = storedDayKeys[storedDayKeys.length - 1];
      rangeStart = parseDateKey(oldestStored);
    }
    if (!rangeStart) return storedDayKeys;

    const keys: string[] = [];
    let cursor = startOfLocalDay(rangeStart);
    while (cursor.getTime() <= today.getTime()) {
      keys.push(toDateKey(cursor));
      cursor = addDays(cursor, 1);
    }
    return keys.reverse();
  }, [startDate, storedDayKeys]);

  const filteredDayKeys = useMemo(() => {
    const q = query.trim().toLowerCase();
    return timelineDayKeys.filter((key) => {
      if (selectedDateKey && key !== selectedDateKey) return false;
      if (!q) return true;
      const date = parseDateKey(key);
      if (!date) return false;
      const haystack = `${formatRecordDate(locale, date)} ${formatWeekday(locale, date)}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [locale, query, selectedDateKey, timelineDayKeys]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (userId) saveDoctorNotes(userId, value);
  };

  const handleToggleExpanded = (dateKey: string) => {
    setExpandedKey((prev) => (prev === dateKey ? null : dateKey));
  };

  const openDatePicker = () => setShowDatePicker(true);

  const dateFilterLabel = selectedDateKey
    ? selectedDateKey.replaceAll("-", "|")
    : "year|month|date";

  return (
    <div className="grid h-full min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_327px]">
      <div className="flex min-h-0 flex-col gap-4 overflow-hidden">
        <label className="relative z-50 flex h-20 shrink-0 items-center gap-3 rounded-full border-[3px] border-cyan bg-cyan/20 px-5">
          <Image
            src="/icons/Search.svg"
            alt=""
            width={50}
            height={50}
            className="h-[50px] w-[50px] shrink-0 object-contain"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(locale, "searchForRecord")}
            className="min-w-0 flex-1 bg-transparent text-2xl font-bold text-dark-blue placeholder:text-dark-blue/70 focus:outline-none"
          />
          <span className="h-12 w-px shrink-0 bg-cyan" />
          <button
            type="button"
            onClick={openDatePicker}
            className={`shrink-0 text-2xl font-bold ${
              selectedDateKey ? "text-dark-blue" : "text-dark-blue/70"
            }`}
            aria-label="Filter records by date"
          >
            {dateFilterLabel}
          </button>
          {showDatePicker ? (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 rounded-2xl border-[3px] border-cyan bg-card p-3 shadow-lg">
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDateKey}
                onChange={(e) => {
                  setSelectedDateKey(e.target.value);
                  setShowDatePicker(false);
                }}
                className="rounded-xl border-2 border-blue bg-card px-3 py-2 text-lg font-bold text-dark-blue focus:outline-none"
                aria-label="Pick a date"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedDateKey("");
                  setShowDatePicker(false);
                }}
                className="ml-2 rounded-xl border-2 border-blue px-3 py-2 text-base font-bold text-blue"
              >
                Clear
              </button>
            </div>
          ) : null}
        </label>

        <div className="flex flex-col gap-4 w-full overflow-y-auto max-h-[70vh] pb-10 pr-2">
          {filteredDayKeys.map((key) => {
            const date = parseDateKey(key);
            if (!date) return null;
            const normalizedKey = toDateKey(date);
            return (
              <DayRecordCard
                key={normalizedKey}
                locale={locale}
                dateKey={normalizedKey}
                date={date}
                record={hydratedRecords[normalizedKey]}
                expanded={expandedKey === normalizedKey}
                onToggle={() => handleToggleExpanded(normalizedKey)}
              />
            );
          })}

          {filteredDayKeys.length === 0 ? (
            <p className="py-10 text-center text-2xl font-bold text-cyan">
              {t(locale, "noMoreRecords")}
            </p>
          ) : null}
        </div>
      </div>

      <Card
        className="flex min-h-0 flex-col gap-4 !p-6 h-[708px] max-h-[calc(100dvh-140px)] overflow-hidden"
        data-role="doctor-notes"
      >
        <h2 className="text-[32px] font-bold text-blue">{t(locale, "doctorsNotes")}</h2>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          className="min-h-[120px] flex-1 resize-none rounded-[12px] border-0 bg-transparent text-lg text-dark-blue focus:outline-none"
        />
      </Card>
    </div>
  );
}

function DayRecordCard({
  locale,
  dateKey,
  date,
  record,
  expanded,
  onToggle,
}: {
  locale: Locale;
  dateKey: string;
  date: Date;
  record: DayTrainingRecord | undefined;
  expanded: boolean;
  onToggle: () => void;
}) {
  const dateLabel = formatRecordDate(locale, date);
  const weekday = formatWeekday(locale, date);

  const recordSafe: DayTrainingRecord = record ?? { stages: {} };
  const stageComplete = (stage: 1 | 2 | 3) =>
    isStageCompleteOnDay(recordSafe, stage);

  return (
    <Card className="w-full flex flex-col h-auto bg-white rounded-xl border-2 border-blue-600 p-4 transition-all duration-300">
      <div
        className="flex flex-col"
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
      >
      <div className="flex items-start gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-[40px] font-bold leading-none text-blue sm:text-[48px]">
            {dateLabel}
          </p>
          <p className="pt-2 text-[32px] font-bold text-dark-blue">{weekday}</p>
        </div>

        {!expanded ? (
          <div className="flex items-center gap-8">
            {([1, 2, 3] as const).map((stage) => (
              <div
                key={stage}
                className="flex flex-col items-center gap-2"
              >
                <StageStatusDot
                  complete={stageComplete(stage)}
                />
                <span className="text-[32px] font-bold text-dark-blue">
                  S{stage}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="flex shrink-0 flex-col items-center justify-center pt-1"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {!expanded && (
            <span className="text-[24px] font-bold text-black">
              Details
            </span>
          )}
          <Image
            src={expanded ? "/icons/stat.svg" : "/icons/stat_minus.svg"}
            alt=""
            width={70}
            height={70}
            className="h-[56px] w-[56px] object-contain sm:h-[70px] sm:w-[70px]"
            style={{
              filter:
                "brightness(0) saturate(100%) invert(27%) sepia(78%) saturate(1800%) hue-rotate(215deg)",
            }}
          />
        </button>
      </div>

      {expanded ? (
        <div className="pt-6">
          {(() => {
            const stages = [1, 2, 3] as const;
            const hasAnyRecordedTraining = stages.some((stage) =>
              stageHasMetrics(recordSafe, stage),
            );

            if (!hasAnyRecordedTraining) {
              return (
                <p className="py-4 text-center font-medium text-green-600">
                  No record
                </p>
              );
            }

            return stages.map((stage) => {
              const stageKey = stage as 1 | 2 | 3;
              const stageRecord = getStageRecord(recordSafe, stageKey);
              const stageDone = isStageCompleteOnDay(recordSafe, stageKey);
              const steps = getStageSteps(stageKey);

              return (
                <div key={stageKey} className="mt-6 first:mt-0">
                  <StageHeader stage={stageKey} />
                  {stageDone ? (
                    <div className="mt-5 space-y-4">
                      {steps.map((step) => {
                        const metrics = getStepMetrics(stageRecord, step);
                        const analysis = getStepAnalysis(
                          recordSafe,
                          stageKey,
                          step,
                        );
                        if (!metrics) return null;
                        return (
                          <WayToGoStepPill
                            key={step}
                            locale={locale}
                            stage={stageKey}
                            step={step}
                            metrics={metrics}
                            analysis={analysis}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <p className="py-2 text-center font-medium text-green-600">
                      No record
                    </p>
                  )}
                </div>
              );
            });
          })()}
        </div>
      ) : null}
      </div>
    </Card>
  );
}

function WayToGoStepPill({
  locale,
  stage,
  step,
  metrics,
  analysis,
}: {
  locale: Locale;
  stage: 1 | 2 | 3;
  step: Step;
  metrics?: StepMetrics;
  analysis?: StepAnalysisSnapshot;
}) {
  const [graphOpen, setGraphOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setGraphOpen(true);
        }}
        className="flex w-full cursor-pointer flex-col items-start gap-1 rounded-[20px] border-[3px] border-blue/30 px-4 py-3 text-left transition-colors hover:bg-blue-50 sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="font-medium">
          {formatStageStep(locale, stage, step)}
        </span>
        <span className="shrink-0 text-sm text-foreground/70">
          {`${Math.round(metrics?.completionPct ?? 0)}% · ${Math.round(metrics?.accuracyPct ?? 0)}% · ${Math.round(metrics?.averageAngleDeg ?? 0)}°`}
        </span>
      </button>
      {graphOpen ? (
        <StepGraphModal
          locale={locale}
          stage={stage}
          step={step}
          metrics={metrics}
          analysis={analysis}
          onClose={() => setGraphOpen(false)}
        />
      ) : null}
    </>
  );
}

function StepGraphModal({
  locale,
  stage,
  step,
  metrics,
  analysis,
  onClose,
}: {
  locale: Locale;
  stage: 1 | 2 | 3;
  step: Step;
  metrics?: StepMetrics;
  analysis?: StepAnalysisSnapshot;
  onClose: () => void;
}) {
  const analyticsCopy = getAnalyticsCopy(locale);
  const showGraph = hasAnalysisGraph(analysis);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[20px] border-[3px] border-border bg-card p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold text-blue">
            {formatStageStep(locale, stage, step)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-lg font-bold text-blue"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 rounded-[20px] border-[3px] border-cyan bg-cyan/10 p-6">
          <div className="flex items-center justify-between text-lg">
            <span className="font-medium text-foreground/80">
              {t(locale, "completion")}
            </span>
            <span className="font-bold text-foreground">
              {formatWayToGoMetrics(metrics).split(" · ")[0]}
            </span>
          </div>
          <div className="flex items-center justify-between text-lg">
            <span className="font-medium text-foreground/80">
              {t(locale, "accuracy")}
            </span>
            <span className="font-bold text-foreground">
              {formatWayToGoMetrics(metrics).split(" · ")[1]}
            </span>
          </div>
          <div className="flex items-center justify-between text-lg">
            <span className="font-medium text-foreground/80">
              {t(locale, "averageAngle")}
            </span>
            <span className="font-bold text-foreground">
              {formatWayToGoMetrics(metrics).split(" · ")[2]}
            </span>
          </div>
        </div>

        {showGraph && analysis ? (
          <div className="mt-8">
            <StepAnalysisGraphs
              graphDatasets={analysis.graphDatasets}
              copy={analyticsCopy}
              showEyeMovement={stage !== 2}
              headMovement={buildHeadMovementSlice(
                analysis.headMovementPoints,
                analysis.showNoddingTarget,
                analysis.showTurningTarget,
              )}
              shoulderMovement={buildShoulderMovementSlice(
                analysis.shoulderMovementPoints,
                stage === 3 && step === 1
                  ? SHOULDER_UP_CUE_TIMES_SEC
                  : stage === 3 && step === 2
                    ? SHOULDER_ROTATION_CUE_TIMES_SEC
                    : undefined,
              )}
              exerciseMode={analysis.exerciseMode}
            />
          </div>
        ) : (
          <p className="mt-8 text-center font-medium text-dark-blue/70">
            Graph data is not available for this step.
          </p>
        )}
      </div>
    </div>
  );
}

function StageHeader({ stage }: { stage: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-6">
      <div className="h-[4px] flex-1 rounded-full bg-blue" />
      <h3 className="text-[32px] font-bold text-blue">Stage {stage}</h3>
      <div className="h-[4px] flex-1 rounded-full bg-blue" />
    </div>
  );
}

function StageStatusDot({ complete }: { complete: boolean }) {
  if (complete) {
    return (
      <div className="flex size-[65px] items-center justify-center rounded-full bg-blue">
        <Image
          src="/icons/Check.svg"
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </div>
    );
  }

  return (
    <div className="size-[65px] rounded-full border-[3px] border-blue bg-transparent" />
  );
}

