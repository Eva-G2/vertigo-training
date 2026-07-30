export type Locale = "en" | "zh-Hant" | "zh-Hans";
export type Theme = "light" | "dark";
export type Sound = "on" | "off";
export type TrainingPhase = "prepare" | "demo" | "training" | "congrats";
export type Step = 1 | 2 | 3 | 4;

export type AuthState =
  | { status: "anonymous" }
  | { status: "authenticated"; userId: string; displayName: string };

export type StepMetrics = {
  completionPct: number;
  accuracyPct: number;
  averageAngleDeg: number;
  /** Unix ms when the step exercise started. */
  startedAtMs?: number;
  /** Wall-clock or recorded session length for the completed step. */
  durationSec?: number;
  /** S3S1/S3S2 shoulder movements detected from local peak prominence, out of 20 cues. */
  shoulderCompletionCount?: number;
  /** S3S1/S3S2 mean delay from the prompt beep to the detected shoulder peak. */
  shoulderMeanPeakLagSec?: number;
  /** S3S3 detected waist turns following the left-turn cues, out of 20. */
  waistLeftTurnCount?: number;
  /** S3S3 detected waist turns following the right-turn cues, out of 20. */
  waistRightTurnCount?: number;
  /** S3S3 mean delay from a left/right cue to the horizontal shoulder peak. */
  waistMeanPeakLagSec?: number;
};

export type StepAnalysisExerciseMode = "vertical" | "horizontal" | "vergence";

export type StepAnalysisEyeSignal = {
  leftEyeDeg: number;
  rightEyeDeg: number;
};

export type StepAnalysisGraphPoint = {
  elapsedSec: number;
  targetDeg: number;
  rawSignal: StepAnalysisEyeSignal;
  correctedSignal: StepAnalysisEyeSignal;
};

export type StepAnalysisGraphDatasets = {
  vertical: StepAnalysisGraphPoint[];
  horizontal: StepAnalysisGraphPoint[];
};

export type StepAnalysisHeadMovementPoint = {
  elapsedSec: number;
  pitchDeg: number;
  yawDeg: number;
  /** Kalman-smoothed Nasal Root (168) head velocity magnitude (°/s). */
  headVelocityDegPerSec?: number;
  /** Kalman-smoothed mean-of-pupils eye velocity magnitude (°/s). */
  eyeVelocityDegPerSec?: number;
};

export type StepAnalysisShoulderMovementPoint = {
  elapsedSec: number;
  leftVertical: number;
  rightVertical: number;
  leftHorizontal: number;
  rightHorizontal: number;
};

export type StepAnalysisSnapshot = {
  exerciseMode: StepAnalysisExerciseMode;
  durationSec: number;
  graphDatasets: StepAnalysisGraphDatasets;
  headMovementPoints?: StepAnalysisHeadMovementPoint[];
  showNoddingTarget?: boolean;
  showTurningTarget?: boolean;
  /** Stage 3 S3S1–S3S3 shoulder motion series (replaces head rotation graphs). */
  shoulderMovementPoints?: StepAnalysisShoulderMovementPoint[];
};

export type CalibrationStatus = "PENDING" | "CALIBRATED";

export type PupilBaseline = {
  x: number;
  y: number;
};

/** Live gaze/head offsets captured when the user re-centers at fixation. */
export type GazeRecenterBaseline = {
  headRotation: {
    yaw: number;
    pitch: number;
    roll: number;
  };
  leftGazeOffsetDeg: {
    horizontal: number;
    vertical: number;
  };
  rightGazeOffsetDeg: {
    horizontal: number;
    vertical: number;
  };
  compensationOffset: {
    horizontal: number;
    vertical: number;
  };
  capturedAt: number;
};

export type CalibrationData = {
  status: CalibrationStatus;
  kL: number | null;
  kR: number | null;
  kLY: number | null;
  kRY: number | null;
  leftBaseline: PupilBaseline | null;
  rightBaseline: PupilBaseline | null;
  /** Forehead Y (0–1 video space) captured at the center calibration fixation. */
  faceTopNormalizedY: number | null;
  chinNormalizedY: number | null;
};

export type AppState = {
  locale: Locale;
  theme: Theme;
  sound: Sound;
  /** When true, white Face Mesh landmark dots are shown on the tracking camera. */
  showBoneLandmarks: boolean;
  auth: AuthState;
  stage: number;
  step: Step;
  phase: TrainingPhase;
  /** Unix timestamps recorded when each stage's training begins. */
  stageStartedAt: Partial<Record<number, number>>;
  stepResults: Partial<Record<Step, StepMetrics>>;
  stepAnalysis: Partial<Record<Step, StepAnalysisSnapshot>>;
};
