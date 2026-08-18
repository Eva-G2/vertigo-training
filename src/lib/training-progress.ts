import type { Step, StepAnalysisSnapshot, StepMetrics } from "./types";
import { getStageSteps } from "./training-flow";

export type DayMark = "completed" | "started";

export type DayStageRecord = Partial<Record<Step, StepMetrics>>;

export type DayStageAnalysis = Partial<Record<Step, StepAnalysisSnapshot>>;

export type DayTrainingRecord = {
  stages: Partial<Record<1 | 2 | 3, DayStageRecord>>;
  analysis?: Partial<Record<1 | 2 | 3, DayStageAnalysis>>;
};

/** Legacy localStorage key. Kept only so one-time Supabase migration can read old test data. */
function storageKey(userId: string) {
  return `vt-training-days:${userId}`;
}

/** Legacy localStorage key. Kept only so one-time Supabase migration can read old test data. */
function recordsStorageKey(userId: string) {
  return `vt-day-records:${userId}`;
}

function notesStorageKey(userId: string) {
  return `vt-doctor-notes:${userId}`;
}

export function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function normalizeDateKey(key: string): string | null {
  const date = parseDateKey(key);
  return date ? toDateKey(date) : null;
}

export function getStageRecord(
  record: DayTrainingRecord | undefined,
  stage: 1 | 2 | 3,
): DayStageRecord | undefined {
  if (!record?.stages) return undefined;
  const stages = record.stages as Record<string, DayStageRecord | undefined>;
  return stages[stage] ?? stages[String(stage)];
}

export function getStepMetrics(
  stageRecord: DayStageRecord | undefined,
  step: Step,
): StepMetrics | undefined {
  if (!stageRecord) return undefined;
  const rec = stageRecord as Record<string, StepMetrics | undefined>;
  return rec[step] ?? rec[String(step)];
}

export function stageHasMetrics(
  record: DayTrainingRecord | undefined,
  stage: 1 | 2 | 3,
): boolean {
  const stageRecord = getStageRecord(record, stage);
  if (!stageRecord) return false;
  return Object.values(stageRecord).some((metrics) => metrics != null);
}

export function getStepAnalysis(
  record: DayTrainingRecord | undefined,
  stage: 1 | 2 | 3,
  step: Step,
): StepAnalysisSnapshot | undefined {
  if (!record?.analysis) return undefined;
  const analysis = record.analysis as Record<string, DayStageAnalysis | undefined>;
  const stageAnalysis = analysis[stage] ?? analysis[String(stage)];
  if (!stageAnalysis) return undefined;
  const rec = stageAnalysis as Record<string, StepAnalysisSnapshot | undefined>;
  return rec[step] ?? rec[String(step)];
}

function mergeStageMaps(
  current: DayTrainingRecord["stages"],
  incoming: DayTrainingRecord["stages"],
): DayTrainingRecord["stages"] {
  const merged: DayTrainingRecord["stages"] = { ...current };
  for (const stage of [1, 2, 3] as const) {
    const incomingStage = getStageRecord({ stages: incoming }, stage);
    if (!incomingStage) continue;
    merged[stage] = {
      ...(getStageRecord({ stages: merged }, stage) ?? {}),
      ...incomingStage,
    };
  }
  return merged;
}

function mergeAnalysisMaps(
  current: DayTrainingRecord["analysis"],
  incoming: DayTrainingRecord["analysis"],
): DayTrainingRecord["analysis"] {
  if (!current && !incoming) return undefined;
  const merged: NonNullable<DayTrainingRecord["analysis"]> = { ...current };
  for (const stage of [1, 2, 3] as const) {
    const incomingStage =
      incoming?.[stage] ??
      (incoming as Record<string, DayStageAnalysis | undefined> | undefined)?.[
        String(stage)
      ];
    if (!incomingStage) continue;
    merged[stage] = {
      ...(merged[stage] ?? {}),
      ...incomingStage,
    };
  }
  return merged;
}

export function hydrateDayRecords(
  raw: Record<string, DayTrainingRecord>,
): Record<string, DayTrainingRecord> {
  const out: Record<string, DayTrainingRecord> = {};

  const mergeInto = (key: string, incoming: DayTrainingRecord) => {
    const existing = out[key] ?? { stages: {} };
    out[key] = {
      stages: mergeStageMaps(existing.stages, incoming.stages ?? {}),
      analysis: mergeAnalysisMaps(existing.analysis, incoming.analysis),
    };
  };

  for (const [rawKey, record] of Object.entries(raw)) {
    const normalized = normalizeDateKey(rawKey);
    if (normalized) mergeInto(normalized, record);

    for (const stage of [1, 2, 3] as const) {
      const stageRecord = getStageRecord(record, stage);
      if (!stageRecord) continue;
      for (const metrics of Object.values(stageRecord)) {
        if (metrics?.startedAtMs) {
          mergeInto(toDateKey(new Date(metrics.startedAtMs)), {
            stages: { [stage]: stageRecord },
            analysis: record.analysis
              ? { [stage]: record.analysis[stage] }
              : undefined,
          });
        }
      }
    }
  }

  return out;
}

export function hydrateDayMarks(
  raw: Record<string, DayMark>,
): Record<string, DayMark> {
  const out: Record<string, DayMark> = {};
  for (const [rawKey, mark] of Object.entries(raw)) {
    const normalized = normalizeDateKey(rawKey);
    if (!normalized) continue;
    if (out[normalized] !== "completed") {
      out[normalized] = mark;
    }
  }
  return out;
}

export function daysSince(from: Date, to = new Date()): number {
  const start = startOfLocalDay(from).getTime();
  const end = startOfLocalDay(to).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

export function getWeekDates(today = new Date()): Date[] {
  const start = startOfLocalDay(today);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function getMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array<null>(first.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
  ];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

export function loadTrainingDays(userId: string): Record<string, DayMark> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, DayMark>;
  } catch {
    return {};
  }
}

export function markTrainingDay(
  userId: string,
  mark: DayMark,
  date = new Date(),
): Record<string, DayMark> {
  const days = loadTrainingDays(userId);
  const key = toDateKey(date);
  if (days[key] !== "completed") {
    days[key] = mark;
    localStorage.setItem(storageKey(userId), JSON.stringify(days));
  }
  return days;
}

export function compareDateKeys(a: Date, b: Date): number {
  return startOfLocalDay(a).getTime() - startOfLocalDay(b).getTime();
}

export function loadDayRecords(
  userId: string,
): Record<string, DayTrainingRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(recordsStorageKey(userId));
    if (!raw) return {};
    return hydrateDayRecords(JSON.parse(raw) as Record<string, DayTrainingRecord>);
  } catch {
    return {};
  }
}

export function saveDayStepRecord(
  userId: string,
  stage: number,
  step: Step,
  metrics: StepMetrics,
  date = new Date(),
  analysis?: StepAnalysisSnapshot,
): Record<string, DayTrainingRecord> {
  const records = loadDayRecords(userId);
  const key = toDateKey(date);
  const stageKey = Math.min(Math.max(stage, 1), 3) as 1 | 2 | 3;
  const day = records[key] ?? { stages: {} };
  const stageRecord = getStageRecord(day, stageKey) ?? {};
  day.stages[stageKey] = { ...stageRecord, [step]: metrics };
  if (analysis) {
    const existingAnalysis = day.analysis?.[stageKey] ?? {};
    day.analysis = {
      ...day.analysis,
      [stageKey]: { ...existingAnalysis, [step]: analysis },
    };
  }
  records[key] = day;
  localStorage.setItem(recordsStorageKey(userId), JSON.stringify(records));
  return records;
}

export function isStageCompleteOnDay(
  record: DayTrainingRecord | undefined,
  stage: number,
): boolean {
  if (!record) return false;
  const stageKey = Math.min(Math.max(stage, 1), 3) as 1 | 2 | 3;
  const steps = getStageSteps(stageKey);
  const stageRecord = getStageRecord(record, stageKey);
  if (!stageRecord) return false;
  return steps.every((step) => getStepMetrics(stageRecord, step) != null);
}

export function loadDoctorNotes(userId: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(notesStorageKey(userId)) ?? "";
}

export function saveDoctorNotes(userId: string, notes: string): void {
  localStorage.setItem(notesStorageKey(userId), notes);
}
