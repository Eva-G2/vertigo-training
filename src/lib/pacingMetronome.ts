/** Higher pitch: look up (Stage 2 nodding) / move finger away (vergence). */
export const BEEP_AWAY_HZ = 880;

/** Lower pitch: look down (Stage 2 nodding) / move finger toward nose (vergence). */
export const BEEP_TOWARD_HZ = 440;

/** Higher pitch: look left (Stage 2 turning). */
export const BEEP_LEFT_HZ = 660;

/** Lower pitch: look right (Stage 2 turning). */
export const BEEP_RIGHT_HZ = 330;

/** Stage 3 Step 1: shrug up / lower down audio cues. */
export const SHOULDER_UP_BEEP_HZ = 880;
export const SHOULDER_DOWN_BEEP_HZ = 440;
export const SHOULDER_UP_TO_DOWN_MS = 500;
export const SHOULDER_DOWN_TO_UP_MS = 1000;
export const SHOULDER_PACING_CYCLE_MS =
  SHOULDER_UP_TO_DOWN_MS + SHOULDER_DOWN_TO_UP_MS;
export const SHOULDER_PACING_CYCLES = 20;
export const SHOULDER_PACING_TOTAL_MS =
  SHOULDER_PACING_CYCLES * SHOULDER_PACING_CYCLE_MS;
export const SHOULDER_UP_CUE_TIMES_SEC = Array.from(
  { length: SHOULDER_PACING_CYCLES },
  (_, index) => (index * SHOULDER_PACING_CYCLE_MS) / 1000,
);

/** Stage 3 Step 2: one shoulder-rotation cue every 1500 ms. */
export const SHOULDER_ROTATION_BEEP_HZ = 880;
export const SHOULDER_ROTATION_BEAT_MS = 1500;
export const SHOULDER_ROTATION_CYCLES = 20;
export const SHOULDER_ROTATION_TOTAL_MS =
  SHOULDER_ROTATION_CYCLES * SHOULDER_ROTATION_BEAT_MS;
export const SHOULDER_ROTATION_CUE_TIMES_SEC = Array.from(
  { length: SHOULDER_ROTATION_CYCLES },
  (_, index) => (index * SHOULDER_ROTATION_BEAT_MS) / 1000,
);

/** Stage 3 Step 3: alternate left/right waist-turn cues every second. */
export const WAIST_TURN_WAIT_MS = 1000;
export const WAIST_TURN_BEEP_DURATION_MS = 120;
export const WAIST_TURN_CYCLES = 20;
export const WAIST_TURN_CYCLE_MS = WAIST_TURN_WAIT_MS * 2;
export const WAIST_TURN_TOTAL_MS = WAIST_TURN_CYCLES * WAIST_TURN_CYCLE_MS;
export const WAIST_LEFT_CUE_TIMES_SEC = Array.from(
  { length: WAIST_TURN_CYCLES },
  (_, index) => (index * WAIST_TURN_CYCLE_MS) / 1000,
);
export const WAIST_RIGHT_CUE_TIMES_SEC = Array.from(
  { length: WAIST_TURN_CYCLES },
  (_, index) => (index * WAIST_TURN_CYCLE_MS + WAIST_TURN_WAIT_MS) / 1000,
);

export const PACING_BEAT_MS = 1000;
export const PACING_REST_MS = 500;
export const PACING_CYCLE_MS = PACING_BEAT_MS + PACING_BEAT_MS + PACING_REST_MS;
export const PACING_CYCLES = 20;
export const PACING_TOTAL_MS = PACING_CYCLES * PACING_CYCLE_MS;

import {
  HEAD_NOD_BEEP_DURATION_MS,
  HEAD_NOD_CYCLES,
  HEAD_NOD_FIRST_BEEP_DELAY_MS,
  HEAD_NOD_TOTAL_MS,
  headNodWaitMsForCycle,
} from "@/services/analytics/headNodPacingChart";
import {
  HEAD_TURN_BEEP_DURATION_MS,
  HEAD_TURN_CYCLES,
  HEAD_TURN_TOTAL_MS,
  headTurnWaitMsForCycle,
} from "@/services/analytics/headTurnPacingChart";

export {
  HEAD_NOD_CYCLES,
  HEAD_NOD_FIRST_BEEP_DELAY_MS,
  HEAD_NOD_TOTAL_MS,
  headNodWaitMsForCycle,
} from "@/services/analytics/headNodPacingChart";

export {
  HEAD_TURN_CYCLES,
  HEAD_TURN_TOTAL_MS,
  headTurnWaitMsForCycle,
} from "@/services/analytics/headTurnPacingChart";

const BEEP_DURATION_MS = HEAD_NOD_BEEP_DURATION_MS;
const BEEP_GAIN = 0.25;

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/** Resume the shared audio context after a user gesture (browser autoplay policy). */
export async function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
}

function playBeep(frequencyHz: number, durationMs = BEEP_DURATION_MS): void {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime;
  const end = start + durationMs / 1000;

  oscillator.type = "sine";
  oscillator.frequency.value = frequencyHz;
  gain.gain.setValueAtTime(BEEP_GAIN, start);
  gain.gain.exponentialRampToValueAtTime(0.001, end);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(end);
}

/** Short ascending chime for calibration success feedback. */
export function playSuccessSound(): void {
  playBeep(523, 90);
  window.setTimeout(() => playBeep(659, 120), 90);
}

/** Play a single preview tone (e.g. demo cue buttons). Resumes audio after user gesture. */
export async function playToneBeep(frequencyHz: number): Promise<void> {
  await resumeAudioContext();
  playBeep(frequencyHz);
}

export type PacingLoopHandle = {
  stop: () => void;
  promise: Promise<void>;
};

/**
 * Vergence pacing: Beep 1 (away) → 1000 ms → Beep 2 (toward) → 1000 ms → 500 ms rest → repeat.
 */
export function startPacingLoop(
  cycles: number = PACING_CYCLES,
): PacingLoopHandle {
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const clearTimers = () => {
    timers.forEach((timer) => clearTimeout(timer));
    timers.length = 0;
  };

  const schedule = (fn: () => void, delayMs: number) => {
    timers.push(setTimeout(fn, delayMs));
  };

  const promise = new Promise<void>((resolve) => {
    let cycleIndex = 0;

    const finish = () => {
      clearTimers();
      resolve();
    };

    const runCycle = () => {
      if (cancelled) {
        finish();
        return;
      }

      if (cycleIndex >= cycles) {
        finish();
        return;
      }

      playBeep(BEEP_AWAY_HZ);
      schedule(() => {
        if (cancelled) {
          finish();
          return;
        }

        playBeep(BEEP_TOWARD_HZ);
        schedule(() => {
          if (cancelled) {
            finish();
            return;
          }

          cycleIndex += 1;
          if (cycleIndex >= cycles) {
            finish();
            return;
          }

          schedule(runCycle, PACING_REST_MS);
        }, PACING_BEAT_MS);
      }, PACING_BEAT_MS);
    };

    runCycle();
  });

  return {
    stop: () => {
      cancelled = true;
      clearTimers();
    },
    promise,
  };
}

/**
 * Stage 3 Step 1 shoulder pacing:
 * high beep (lift) → 500 ms → low beep (lower) → 1000 ms → repeat.
 */
export function startShoulderPacingLoop(
  cycles: number = SHOULDER_PACING_CYCLES,
): PacingLoopHandle {
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const clearTimers = () => {
    timers.forEach((timer) => clearTimeout(timer));
    timers.length = 0;
  };

  const schedule = (fn: () => void, delayMs: number) => {
    timers.push(setTimeout(fn, delayMs));
  };

  const promise = new Promise<void>((resolve) => {
    let cycleIndex = 0;

    const finish = () => {
      clearTimers();
      resolve();
    };

    const runCycle = () => {
      if (cancelled || cycleIndex >= cycles) {
        finish();
        return;
      }

      playBeep(SHOULDER_UP_BEEP_HZ);
      schedule(() => {
        if (cancelled) {
          finish();
          return;
        }

        playBeep(SHOULDER_DOWN_BEEP_HZ);
        schedule(() => {
          if (cancelled) {
            finish();
            return;
          }

          cycleIndex += 1;
          if (cycleIndex >= cycles) {
            finish();
            return;
          }

          runCycle();
        }, SHOULDER_DOWN_TO_UP_MS);
      }, SHOULDER_UP_TO_DOWN_MS);
    };

    runCycle();
  });

  return {
    stop: () => {
      cancelled = true;
      clearTimers();
    },
    promise,
  };
}

/** Stage 3 Step 2 shoulder rotations: 880 Hz beep → 1500 ms → repeat. */
export function startShoulderRotationPacingLoop(
  cycles: number = SHOULDER_ROTATION_CYCLES,
): PacingLoopHandle {
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const clearTimers = () => {
    timers.forEach((timer) => clearTimeout(timer));
    timers.length = 0;
  };

  const promise = new Promise<void>((resolve) => {
    let cycleIndex = 0;

    const finish = () => {
      clearTimers();
      resolve();
    };

    const runCycle = () => {
      if (cancelled || cycleIndex >= cycles) {
        finish();
        return;
      }

      playBeep(SHOULDER_ROTATION_BEEP_HZ);
      cycleIndex += 1;
      timers.push(setTimeout(runCycle, SHOULDER_ROTATION_BEAT_MS));
    };

    runCycle();
  });

  return {
    stop: () => {
      cancelled = true;
      clearTimers();
    },
    promise,
  };
}

/**
 * Stage 3 Step 3 waist turns:
 * 660 Hz (turn left) → 1000 ms → 330 Hz (turn right) → 1000 ms → repeat.
 */
export function startWaistTurningPacingLoop(
  cycles: number = WAIST_TURN_CYCLES,
): PacingLoopHandle {
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const clearTimers = () => {
    timers.forEach((timer) => clearTimeout(timer));
    timers.length = 0;
  };

  const schedule = (fn: () => void, delayMs: number) => {
    timers.push(setTimeout(fn, delayMs));
  };

  const promise = new Promise<void>((resolve) => {
    let cycleIndex = 0;

    const finish = () => {
      clearTimers();
      resolve();
    };

    const runCycle = () => {
      if (cancelled || cycleIndex >= cycles) {
        finish();
        return;
      }

      playBeep(BEEP_LEFT_HZ, WAIST_TURN_BEEP_DURATION_MS);
      schedule(() => {
        if (cancelled) {
          finish();
          return;
        }

        playBeep(BEEP_RIGHT_HZ, WAIST_TURN_BEEP_DURATION_MS);
        schedule(() => {
          if (cancelled) {
            finish();
            return;
          }

          cycleIndex += 1;
          runCycle();
        }, WAIST_TURN_WAIT_MS);
      }, WAIST_TURN_WAIT_MS);
    };

    runCycle();
  });

  return {
    stop: () => {
      cancelled = true;
      clearTimers();
    },
    promise,
  };
}

/**
 * Stage 2 nodding: wait → Beep 1 (look up) → wait → Beep 2 (look down) → wait → repeat.
 * Wait duration linearly accelerates from 1500 ms to 500 ms over {@link cycles}.
 * The first beep is delayed {@link firstBeepDelayMs} after the loop starts (recording begin).
 */
export function startHeadNoddingPacingLoop(
  cycles: number = HEAD_NOD_CYCLES,
  firstBeepDelayMs: number = HEAD_NOD_FIRST_BEEP_DELAY_MS,
): PacingLoopHandle {
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const clearTimers = () => {
    timers.forEach((timer) => clearTimeout(timer));
    timers.length = 0;
  };

  const schedule = (fn: () => void, delayMs: number) => {
    timers.push(setTimeout(fn, delayMs));
  };

  const promise = new Promise<void>((resolve) => {
    let cycleIndex = 0;

    const finish = () => {
      clearTimers();
      resolve();
    };

    const runCycle = () => {
      if (cancelled) {
        finish();
        return;
      }

      if (cycleIndex >= cycles) {
        finish();
        return;
      }

      const waitMs = headNodWaitMsForCycle(cycleIndex);

      playBeep(BEEP_AWAY_HZ);
      schedule(() => {
        if (cancelled) {
          finish();
          return;
        }

        playBeep(BEEP_TOWARD_HZ);
        schedule(() => {
          if (cancelled) {
            finish();
            return;
          }

          cycleIndex += 1;
          if (cycleIndex >= cycles) {
            finish();
            return;
          }

          runCycle();
        }, waitMs);
      }, waitMs);
    };

    schedule(runCycle, firstBeepDelayMs);
  });

  return {
    stop: () => {
      cancelled = true;
      clearTimers();
    },
    promise,
  };
}

/**
 * Stage 2 turning: Beep 1 (look left) → wait → Beep 2 (look right) → wait → repeat.
 * Wait duration linearly accelerates from 1500 ms to 500 ms over {@link cycles}.
 */
export function startHeadTurningPacingLoop(
  cycles: number = HEAD_TURN_CYCLES,
): PacingLoopHandle {
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const clearTimers = () => {
    timers.forEach((timer) => clearTimeout(timer));
    timers.length = 0;
  };

  const schedule = (fn: () => void, delayMs: number) => {
    timers.push(setTimeout(fn, delayMs));
  };

  const promise = new Promise<void>((resolve) => {
    let cycleIndex = 0;

    const finish = () => {
      clearTimers();
      resolve();
    };

    const runCycle = () => {
      if (cancelled) {
        finish();
        return;
      }

      if (cycleIndex >= cycles) {
        finish();
        return;
      }

      const waitMs = headTurnWaitMsForCycle(cycleIndex);

      playBeep(BEEP_LEFT_HZ, HEAD_TURN_BEEP_DURATION_MS);
      schedule(() => {
        if (cancelled) {
          finish();
          return;
        }

        playBeep(BEEP_RIGHT_HZ, HEAD_TURN_BEEP_DURATION_MS);
        schedule(() => {
          if (cancelled) {
            finish();
            return;
          }

          cycleIndex += 1;
          if (cycleIndex >= cycles) {
            finish();
            return;
          }

          runCycle();
        }, waitMs);
      }, waitMs);
    };

    runCycle();
  });

  return {
    stop: () => {
      cancelled = true;
      clearTimers();
    },
    promise,
  };
}
