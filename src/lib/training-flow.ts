import type { AppState, Step, StepMetrics } from "./types";

export const STEPS: Step[] = [1, 2, 3];

export function startStage(stage: number): Pick<AppState, "stage" | "step" | "phase"> {
  return { stage, step: 1, phase: "prepare" };
}

export function onPrepareStart(state: AppState): AppState {
  return { ...state, step: 1, phase: "demo" };
}

export function onDemoContinue(state: AppState): AppState {
  return { ...state, phase: "training" };
}

export function onTrainingComplete(
  state: AppState,
  metrics: StepMetrics,
): AppState {
  return {
    ...state,
    phase: "congrats",
    stepResults: { ...state.stepResults, [state.step]: metrics },
  };
}

export function onCongratsNext(state: AppState): {
  state: AppState;
  route: string;
} {
  if (state.step < 3) {
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
  if (state.step < 3) {
    return `/training/stage/${state.stage}/step/${state.step + 1}/demo`;
  }
  return `/training/stage/${state.stage}/complete`;
}
