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

/** True when every step of stages 1–3 has been completed in the current run. */
export function isFullProgramComplete(state: AppState): boolean {
  if (state.stage < 3) return false;
  const steps = getStageSteps(3);
  return steps.every((step) => state.stepResults[step] != null);
}

/**
 * Next stage/step the user should train.
 * If the current step is already completed (e.g. left after S1S2 congrats),
 * advances to the following step (S1S3).
 */
export function getNextTrainingStep(
  state: AppState,
): { stage: number; step: Step } | null {
  if (isFullProgramComplete(state)) return null;

  const stage = Math.min(Math.max(state.stage, 1), 3);
  const currentStep = state.step;
  const currentDone = state.stepResults[currentStep] != null;

  if (!currentDone) {
    return { stage, step: currentStep };
  }

  if (!isLastStageStep(stage, currentStep)) {
    return { stage, step: (currentStep + 1) as Step };
  }

  if (stage < 3) {
    return { stage: stage + 1, step: 1 };
  }

  return null;
}

export function getNextTrainingRoute(state: AppState): string {
  const next = getNextTrainingStep(state);
  if (!next) {
    return `/training/stage/${Math.min(Math.max(state.stage, 1), 3)}/complete`;
  }

  const startingStage =
    next.step === 1 &&
    (next.stage !== state.stage ||
      state.phase === "prepare" ||
      state.stepResults[1] == null);

  if (startingStage) {
    return `/training/stage/${next.stage}/prepare`;
  }

  return `/training/stage/${next.stage}/step/${next.step}/demo`;
}
