import { createClient } from "@/lib/supabase/client";
import {
  getStageRecord,
  getStepAnalysis,
  getStepMetrics,
  loadDayRecords,
  parseDateKey,
  toDateKey,
  type DayMark,
  type DayTrainingRecord,
} from "@/lib/training-progress";
import type { Step, StepAnalysisSnapshot, StepMetrics } from "@/lib/types";

export type TrainingRecordRow = {
  user_id: string;
  date_key: string;
  stage_id: number;
  step_id: number;
  completion_pct: number;
  accuracy_pct: number;
  avg_angle_deg: number;
  graph_data: unknown;
};

const MAX_GRAPH_POINTS = 100;

function downsamplePoints<T>(points: T[] | undefined, max = MAX_GRAPH_POINTS): T[] {
  if (!points || points.length === 0) return [];
  if (points.length <= max) return points;
  const lastIndex = points.length - 1;
  const out: T[] = [];
  for (let i = 0; i < max; i += 1) {
    const index = Math.round((i * lastIndex) / (max - 1));
    out.push(points[index]!);
  }
  return out;
}

export function downsampleGraphData(
  analysis?: StepAnalysisSnapshot | null,
): StepAnalysisSnapshot | null {
  if (!analysis) return null;
  return {
    exerciseMode: analysis.exerciseMode,
    durationSec: analysis.durationSec,
    graphDatasets: {
      vertical: downsamplePoints(analysis.graphDatasets?.vertical),
      horizontal: downsamplePoints(analysis.graphDatasets?.horizontal),
    },
    headMovementPoints: downsamplePoints(analysis.headMovementPoints),
    showNoddingTarget: analysis.showNoddingTarget,
    showTurningTarget: analysis.showTurningTarget,
    shoulderMovementPoints: downsamplePoints(analysis.shoulderMovementPoints),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

export function parseGraphData(raw: unknown): StepAnalysisSnapshot | undefined {
  if (!raw) return undefined;

  if (Array.isArray(raw) && raw.length > 0) {
    return {
      exerciseMode: "vertical",
      durationSec: 0,
      graphDatasets: {
        vertical: raw as StepAnalysisSnapshot["graphDatasets"]["vertical"],
        horizontal: [],
      },
    };
  }

  if (!isRecord(raw)) return undefined;

  const graphDatasets = isRecord(raw.graphDatasets)
    ? {
        vertical: Array.isArray(raw.graphDatasets.vertical)
          ? raw.graphDatasets.vertical
          : [],
        horizontal: Array.isArray(raw.graphDatasets.horizontal)
          ? raw.graphDatasets.horizontal
          : [],
      }
    : Array.isArray(raw.chartData)
      ? {
          vertical: raw.chartData as StepAnalysisSnapshot["graphDatasets"]["vertical"],
          horizontal: [],
        }
      : { vertical: [], horizontal: [] };

  const headMovementPoints = Array.isArray(raw.headMovementPoints)
    ? raw.headMovementPoints
    : undefined;
  const shoulderMovementPoints = Array.isArray(raw.shoulderMovementPoints)
    ? raw.shoulderMovementPoints
    : undefined;

  const hasPoints =
    graphDatasets.vertical.length > 0 ||
    graphDatasets.horizontal.length > 0 ||
    (headMovementPoints?.length ?? 0) > 0 ||
    (shoulderMovementPoints?.length ?? 0) > 0;
  if (!hasPoints) return undefined;

  return {
    exerciseMode:
      raw.exerciseMode === "horizontal" ||
      raw.exerciseMode === "vertical" ||
      raw.exerciseMode === "vergence"
        ? raw.exerciseMode
        : "vertical",
    durationSec: typeof raw.durationSec === "number" ? raw.durationSec : 0,
    graphDatasets,
    headMovementPoints,
    showNoddingTarget: Boolean(raw.showNoddingTarget),
    showTurningTarget: Boolean(raw.showTurningTarget),
    shoulderMovementPoints,
  };
}

export function groupTrainingRecords(
  rows: TrainingRecordRow[],
): Record<string, DayTrainingRecord> {
  const out: Record<string, DayTrainingRecord> = {};

  for (const row of rows) {
    const dateKey = row.date_key;
    const stage = Math.min(Math.max(Number(row.stage_id), 1), 3) as 1 | 2 | 3;
    const step = Math.min(Math.max(Number(row.step_id), 1), 4) as Step;
    const day = out[dateKey] ?? { stages: {}, analysis: {} };
    const stageRecord = day.stages[stage] ?? {};
    stageRecord[step] = {
      completionPct: Number(row.completion_pct) || 0,
      accuracyPct: Number(row.accuracy_pct) || 0,
      averageAngleDeg: Number(row.avg_angle_deg) || 0,
    };
    day.stages[stage] = stageRecord;

    const analysis = parseGraphData(row.graph_data);
    if (analysis) {
      day.analysis = {
        ...day.analysis,
        [stage]: {
          ...(day.analysis?.[stage] ?? {}),
          [step]: analysis,
        },
      };
    }

    out[dateKey] = day;
  }

  return out;
}

export function marksFromTrainingRecords(
  rows: TrainingRecordRow[],
): Record<string, DayMark> {
  const marks: Record<string, DayMark> = {};
  for (const row of rows) {
    marks[row.date_key] = "completed";
  }
  return marks;
}

export async function fetchTrainingRecords(
  userId?: string,
): Promise<TrainingRecordRow[]> {
  const supabase = createClient();
  const resolvedUserId = userId ?? (await supabase.auth.getUser()).data.user?.id;
  if (!resolvedUserId) return [];

  const { data, error } = await supabase
    .from("training_records")
    .select("*")
    .eq("user_id", resolvedUserId);

  if (error) {
    console.error("Failed to fetch training_records", error);
    return [];
  }

  return (data ?? []) as TrainingRecordRow[];
}

export async function upsertTrainingRecord(input: {
  stage: number;
  step: Step;
  metrics: StepMetrics;
  analysis?: StepAnalysisSnapshot | null;
  date?: Date;
}): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return;

  const graphData = downsampleGraphData(input.analysis);

  const { error } = await supabase.from("training_records").upsert(
    {
      user_id: user.id,
      date_key: toDateKey(input.date ?? new Date()),
      stage_id: input.stage,
      step_id: input.step,
      completion_pct: input.metrics.completionPct,
      accuracy_pct: input.metrics.accuracyPct,
      avg_angle_deg: input.metrics.averageAngleDeg,
      graph_data: graphData,
    },
    { onConflict: "user_id,date_key,stage_id,step_id" },
  );

  if (error) {
    console.error("Failed to upsert training_records", error);
  }
}

function migrationFlagKey(userId: string) {
  return `vt-training-records-migrated:${userId}`;
}

/** One-time upload of leftover localStorage training data. Does not overwrite existing Supabase rows. */
export async function migrateLocalTrainingRecordsOnce(
  userId: string,
): Promise<void> {
  if (typeof window === "undefined" || !userId) return;
  if (localStorage.getItem(migrationFlagKey(userId))) return;

  try {
    const local = loadDayRecords(userId);
    const existing = await fetchTrainingRecords(userId);
    const existingKeys = new Set(
      existing.map((row) => `${row.date_key}:${row.stage_id}:${row.step_id}`),
    );

    for (const [dateKey, day] of Object.entries(local)) {
      const date = parseDateKey(dateKey) ?? undefined;
      for (const stage of [1, 2, 3] as const) {
        const stageRecord = getStageRecord(day, stage);
        if (!stageRecord) continue;
        for (const step of [1, 2, 3, 4] as Step[]) {
          const metrics = getStepMetrics(stageRecord, step);
          if (!metrics) continue;
          if (existingKeys.has(`${dateKey}:${stage}:${step}`)) continue;
          await upsertTrainingRecord({
            stage,
            step,
            metrics,
            analysis: getStepAnalysis(day, stage, step),
            date,
          });
        }
      }
    }
  } catch (error) {
    console.error("Failed to migrate local training records", error);
    return;
  }

  localStorage.setItem(migrationFlagKey(userId), "1");
}
