export type Locale = "en" | "zh-Hant" | "zh-Hans";
export type Theme = "light" | "dark";
export type Sound = "on" | "off";
export type TrainingPhase = "prepare" | "demo" | "training" | "congrats";
export type Step = 1 | 2 | 3;

export type AuthState =
  | { status: "anonymous" }
  | { status: "authenticated"; userId: string; displayName: string };

export type StepMetrics = {
  completionPct: number;
  accuracyPct: number;
  averageAngleDeg: number;
};

export type CalibrationStatus = "PENDING" | "CALIBRATED";

export type PupilBaseline = {
  x: number;
  y: number;
};

export type CalibrationData = {
  status: CalibrationStatus;
  kL: number | null;
  kR: number | null;
  kLY: number | null;
  kRY: number | null;
  leftBaseline: PupilBaseline | null;
  rightBaseline: PupilBaseline | null;
};

export type AppState = {
  locale: Locale;
  theme: Theme;
  sound: Sound;
  auth: AuthState;
  stage: number;
  step: Step;
  phase: TrainingPhase;
  stepResults: Partial<Record<Step, StepMetrics>>;
};
