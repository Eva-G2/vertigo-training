import type { AppState, Step, StepAnalysisSnapshot, StepMetrics } from "./types";
import { STAGE3_STEPS } from "./stage3Steps";

export const STAGE1_STEPS: Step[] = [1, 2, 3];
export const STAGE2_STEPS: Step[] = [1, 2];
export { STAGE3_STEPS };

/** @deprecated Use {@link getStageSteps} instead. */
export const STEPS = STAGE1_STEPS;

export function getStageStepCount(stage: number): number {
  return getStageSteps(stage).length;
}

export function getStageSteps(stage: number): Step[] {
  if (stage === 2) return STAGE2_STEPS;
  if (stage === 3) return STAGE3_STEPS;
  return STAGE1_STEPS;
}

export function isLastStageStep(stage: number, step: Step): boolean {
  return step >= getStageStepCount(stage);
}

export function startStage(stage: number): Pick<AppState, "stage" | "step" | "phase"> {
  return { stage, step: 1, phase: "prepare" };
}

export function onPrepareStart(state: AppState): AppState {
  return {
    ...state,
    step: 1,
    phase: "demo",
    stageStartedAt: {
      ...state.stageStartedAt,
      [state.stage]: Date.now(),
    },
  };
}

export function onDemoContinue(state: AppState): AppState {
  return { ...state, phase: "training" };
}

export function onTrainingComplete(
  state: AppState,
  metrics: StepMetrics,
  analysis?: StepAnalysisSnapshot,
): AppState {
  return {
    ...state,
    phase: "congrats",
    stepResults: { ...state.stepResults, [state.step]: metrics },
    stepAnalysis: analysis
      ? { ...state.stepAnalysis, [state.step]: analysis }
      : state.stepAnalysis,
  };
}

export function onCongratsNext(state: AppState): {
  state: AppState;
  route: string;
} {
  if (!isLastStageStep(state.stage, state.step)) {
    const nextStep = (state.step + 1) as Step;
    return {
      state: { ...state, step: nextStep, phase: "demo" },
      route: `/training/stage/${state.stage}/step/${nextStep}/demo`,
    };
  }
  return {
    state: { ...state, phase: "prepare" },
    route: `/training/stage/${state.stage}/complete`,
  };
}

export function getCongratsNextRoute(state: AppState): string {
  if (!isLastStageStep(state.stage, state.step)) {
    return `/training/stage/${state.stage}/step/${state.step + 1}/demo`;
  }
  return `/training/stage/${state.stage}/complete`;
}

export function startNextStage(state: AppState, nextStage: number): AppState {
  return {
    ...state,
    stage: nextStage,
    step: 1,
    phase: "prepare",
    stepResults: {},
    stepAnalysis: {},
  };
}
