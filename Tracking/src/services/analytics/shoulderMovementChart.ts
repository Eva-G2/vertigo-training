/**
 * Stage 3 shoulder-movement chart helpers and live session recorder.
 *
 * Values are frame-normalized offsets from the first confident sample of a
 * recording, scaled to percent-of-frame so left/right vertical and horizontal
 * motion can be plotted without FOV calibration.
 */

export const SHOULDER_MOVEMENT_CHART_Y_RANGE = {
  min: -40,
  max: 40,
} as const;

export const LEFT_SHOULDER_COLOR = "#22c55e";
export const RIGHT_SHOULDER_COLOR = "#2563eb";

export type ShoulderMovementGraphPoint = {
  elapsedSec: number;
  leftVertical: number;
  rightVertical: number;
  leftHorizontal: number;
  rightHorizontal: number;
};

export type ShoulderShrugMetrics = {
  completionCount: number;
  meanPeakLagSec: number;
};

export type WaistTurnMetrics = {
  leftTurnCount: number;
  rightTurnCount: number;
  meanPeakLagSec: number;
};

type ShoulderSample = {
  x: number;
  y: number;
};

type ShoulderBaseline = {
  leftX: number;
  leftY: number;
  rightX: number;
  rightY: number;
};

/** Converts normalized landmark deltas into chart units (% of frame). */
const FRAME_PERCENT_SCALE = 100;
/** Minimum local upward excursion (% of frame) treated as a deliberate shrug. */
export const SHOULDER_SHRUG_MIN_PROMINENCE = 1.5;

export function isStage3TrainingSession(label?: string | null): boolean {
  return typeof label === "string" && /^Stage 3 Step \d+ training/.test(label);
}

export function normalizeShoulderChartValue(value: number): number {
  if (!Number.isFinite(value)) {
    return Number.NaN;
  }

  return Math.min(
    SHOULDER_MOVEMENT_CHART_Y_RANGE.max,
    Math.max(SHOULDER_MOVEMENT_CHART_Y_RANGE.min, value),
  );
}

/**
 * Scores at most one shoulder shrug per lift-cue window. Detection uses peak
 * prominence (rise from the local minimum) rather than an absolute chart value,
 * so baseline drift and differences in camera framing do not hide clear shrugs.
 * Time lag is measured from the lift cue to the detected peak.
 */
export function computeShoulderShrugMetrics(
  points: ShoulderMovementGraphPoint[],
  liftCueTimesSec: readonly number[],
  minimumProminence = SHOULDER_SHRUG_MIN_PROMINENCE,
): ShoulderShrugMetrics {
  if (points.length < 2 || liftCueTimesSec.length === 0) {
    return { completionCount: 0, meanPeakLagSec: 0 };
  }

  const defaultWindowSec =
    liftCueTimesSec.length >= 2
      ? liftCueTimesSec[1]! - liftCueTimesSec[0]!
      : 1.5;
  const peakLagsSec: number[] = [];

  liftCueTimesSec.forEach((cueSec, cueIndex) => {
    const windowEndSec =
      liftCueTimesSec[cueIndex + 1] ?? cueSec + defaultWindowSec;
    let localMinimum = 0;

    for (const point of points) {
      if (point.elapsedSec >= cueSec) {
        break;
      }
      localMinimum = (point.leftVertical + point.rightVertical) / 2;
    }

    let greatestRise = 0;
    let peakTimeSec = cueSec;

    for (const point of points) {
      if (point.elapsedSec < cueSec) {
        continue;
      }
      if (point.elapsedSec >= windowEndSec) {
        break;
      }

      const value = (point.leftVertical + point.rightVertical) / 2;
      if (value < localMinimum) {
        localMinimum = value;
      }

      const rise = value - localMinimum;
      if (rise > greatestRise) {
        greatestRise = rise;
        peakTimeSec = point.elapsedSec;
      }
    }

    if (greatestRise >= minimumProminence) {
      peakLagsSec.push(Math.max(0, peakTimeSec - cueSec));
    }
  });

  const meanPeakLagSec =
    peakLagsSec.length === 0
      ? 0
      : peakLagsSec.reduce((sum, lagSec) => sum + lagSec, 0) /
        peakLagsSec.length;

  return {
    completionCount: peakLagsSec.length,
    meanPeakLagSec: Math.round(meanPeakLagSec * 100) / 100,
  };
}

type WaistTurnCue = {
  direction: "left" | "right";
  elapsedSec: number;
};

/**
 * Scores one waist turn at most per left/right cue window. A turn is detected
 * from the combined horizontal excursion of both shoulders relative to their
 * positions when the cue sounds. Lag is measured from that cue to the largest
 * excursion, matching the cue-to-peak method used by the other shoulder steps.
 */
export function computeWaistTurnMetrics(
  points: ShoulderMovementGraphPoint[],
  leftCueTimesSec: readonly number[],
  rightCueTimesSec: readonly number[],
  minimumProminence = SHOULDER_SHRUG_MIN_PROMINENCE,
): WaistTurnMetrics {
  if (
    points.length < 2 ||
    (leftCueTimesSec.length === 0 && rightCueTimesSec.length === 0)
  ) {
    return { leftTurnCount: 0, rightTurnCount: 0, meanPeakLagSec: 0 };
  }

  const cues: WaistTurnCue[] = [
    ...leftCueTimesSec.map((elapsedSec) => ({
      direction: "left" as const,
      elapsedSec,
    })),
    ...rightCueTimesSec.map((elapsedSec) => ({
      direction: "right" as const,
      elapsedSec,
    })),
  ].sort((a, b) => a.elapsedSec - b.elapsedSec);
  const defaultWindowSec =
    cues.length >= 2 ? cues[1]!.elapsedSec - cues[0]!.elapsedSec : 1;
  const peakLagsSec: number[] = [];
  let leftTurnCount = 0;
  let rightTurnCount = 0;

  cues.forEach((cue, cueIndex) => {
    const windowEndSec =
      cues[cueIndex + 1]?.elapsedSec ?? cue.elapsedSec + defaultWindowSec;
    let baseline = points[0]!;

    for (const point of points) {
      if (point.elapsedSec > cue.elapsedSec) {
        break;
      }
      baseline = point;
    }

    let greatestExcursion = 0;
    let peakTimeSec = cue.elapsedSec;

    for (const point of points) {
      if (point.elapsedSec < cue.elapsedSec) {
        continue;
      }
      if (point.elapsedSec >= windowEndSec) {
        break;
      }

      const leftDelta = point.leftHorizontal - baseline.leftHorizontal;
      const rightDelta = point.rightHorizontal - baseline.rightHorizontal;
      const excursion =
        Math.hypot(leftDelta, rightDelta) / Math.SQRT2;

      if (excursion > greatestExcursion) {
        greatestExcursion = excursion;
        peakTimeSec = point.elapsedSec;
      }
    }

    if (greatestExcursion < minimumProminence) {
      return;
    }

    if (cue.direction === "left") {
      leftTurnCount += 1;
    } else {
      rightTurnCount += 1;
    }
    peakLagsSec.push(Math.max(0, peakTimeSec - cue.elapsedSec));
  });

  const meanPeakLagSec =
    peakLagsSec.length === 0
      ? 0
      : peakLagsSec.reduce((sum, lagSec) => sum + lagSec, 0) /
        peakLagsSec.length;

  return {
    leftTurnCount,
    rightTurnCount,
    meanPeakLagSec: Math.round(meanPeakLagSec * 100) / 100,
  };
}

class ShoulderMovementRecorderImpl {
  private points: ShoulderMovementGraphPoint[] = [];
  private startedAtMs: number | null = null;
  private baseline: ShoulderBaseline | null = null;
  private recording = false;
  private version = 0;

  start(): void {
    this.points = [];
    this.startedAtMs = performance.now();
    this.baseline = null;
    this.recording = true;
    this.version += 1;
  }

  stop(): void {
    this.recording = false;
  }

  reset(): void {
    this.points = [];
    this.startedAtMs = null;
    this.baseline = null;
    this.recording = false;
    this.version += 1;
  }

  isRecording(): boolean {
    return this.recording;
  }

  getVersion(): number {
    return this.version;
  }

  getPoints(): ShoulderMovementGraphPoint[] {
    return this.points;
  }

  /**
   * Records one Pose frame. Left/right must both be confident; the first
   * complete pair establishes the zero baseline for the session.
   */
  pushSample(
    left: ShoulderSample | null,
    right: ShoulderSample | null,
  ): void {
    if (!this.recording || this.startedAtMs == null) {
      return;
    }

    if (!left || !right) {
      return;
    }

    if (!this.baseline) {
      this.baseline = {
        leftX: left.x,
        leftY: left.y,
        rightX: right.x,
        rightY: right.y,
      };
    }

    const elapsedSec = (performance.now() - this.startedAtMs) / 1000;

    this.points.push({
      elapsedSec,
      // MediaPipe y grows downward; invert so shrugs (up) plot positive.
      leftVertical: normalizeShoulderChartValue(
        -(left.y - this.baseline.leftY) * FRAME_PERCENT_SCALE,
      ),
      rightVertical: normalizeShoulderChartValue(
        -(right.y - this.baseline.rightY) * FRAME_PERCENT_SCALE,
      ),
      leftHorizontal: normalizeShoulderChartValue(
        (left.x - this.baseline.leftX) * FRAME_PERCENT_SCALE,
      ),
      rightHorizontal: normalizeShoulderChartValue(
        (right.x - this.baseline.rightX) * FRAME_PERCENT_SCALE,
      ),
    });

    this.version += 1;
  }
}

/** Shared recorder used by the Stage 3 Pose overlay and analytics graphs. */
export const ShoulderMovementRecorder = new ShoulderMovementRecorderImpl();
