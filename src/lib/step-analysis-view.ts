import type { HeadMovementStreamSlice, ShoulderMovementStreamSlice } from "@/components/tracking";
import type {
  StepAnalysisHeadMovementPoint,
  StepAnalysisShoulderMovementPoint,
  StepAnalysisSnapshot,
  StepMetrics,
} from "@/lib/types";

export function formatWayToGoMetrics(metrics?: StepMetrics): string {
  const completion = resolveCompletionPct(metrics);
  const accuracy = resolveAccuracyPct(metrics);
  const angle = resolveAverageAngle(metrics);
  return `${completion}% · ${accuracy}% · ${angle}°`;
}

function resolveCompletionPct(metrics?: StepMetrics): number {
  if (!metrics) return 0;
  if (Number.isFinite(metrics.completionPct)) {
    return Math.round(metrics.completionPct);
  }
  if (metrics.shoulderCompletionCount != null) {
    return Math.round((metrics.shoulderCompletionCount / 20) * 100);
  }
  if (
    metrics.waistLeftTurnCount != null &&
    metrics.waistRightTurnCount != null
  ) {
    return Math.round(
      ((metrics.waistLeftTurnCount + metrics.waistRightTurnCount) / 40) * 100,
    );
  }
  return 0;
}

function resolveAccuracyPct(metrics?: StepMetrics): number {
  if (!metrics) return 0;
  if (Number.isFinite(metrics.accuracyPct)) {
    return Math.round(metrics.accuracyPct);
  }
  return 0;
}

function resolveAverageAngle(metrics?: StepMetrics): number {
  if (!metrics) return 0;
  if (Number.isFinite(metrics.averageAngleDeg)) {
    return Math.round(metrics.averageAngleDeg);
  }
  return 0;
}

export function buildHeadMovementSlice(
  points: StepAnalysisHeadMovementPoint[] | undefined,
  showNoddingTarget: boolean | undefined,
  showTurningTarget: boolean | undefined,
): HeadMovementStreamSlice | undefined {
  if (!points || points.length === 0) return undefined;

  return {
    points,
    status: points.length >= 2 ? "ready" : "waiting",
    showNoddingTarget: showNoddingTarget ?? false,
    showTurningTarget: showTurningTarget ?? false,
  };
}

export function buildShoulderMovementSlice(
  points: StepAnalysisShoulderMovementPoint[] | undefined,
  cueTimesSec?: number[],
): ShoulderMovementStreamSlice | undefined {
  if (!points || points.length === 0) return undefined;

  return {
    points,
    status: points.length >= 2 ? "ready" : "waiting",
    liftCueTimesSec: cueTimesSec,
  };
}

export function hasAnalysisGraph(analysis?: StepAnalysisSnapshot): boolean {
  if (!analysis) return false;
  const vertical = analysis.graphDatasets?.vertical?.length ?? 0;
  const horizontal = analysis.graphDatasets?.horizontal?.length ?? 0;
  const head = analysis.headMovementPoints?.length ?? 0;
  const shoulder = analysis.shoulderMovementPoints?.length ?? 0;
  return vertical > 0 || horizontal > 0 || head > 0 || shoulder > 0;
}
