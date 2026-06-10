import type { MovementComparisonRecord } from "@/services/processing/types";
import type { SineWaveStimulusConfig } from "@/services/processing/types";
import { detectSaccades, DEFAULT_SACCADE_CONFIG } from "./saccadeDetection";
import {
  computeSmoothPursuitScore,
  runDtwAnalysis,
} from "./smoothPursuitScore";
import type {
  MovementAnalyticsResult,
  SaccadeDetectionConfig,
} from "./types";

export type MovementAnalyticsConfig = {
  saccade: SaccadeDetectionConfig;
};

/**
 * Analytical module: DTW alignment, Smooth Pursuit Score, and saccade detection.
 */
export class MovementAnalytics {
  private config: MovementAnalyticsConfig;

  constructor(config: Partial<MovementAnalyticsConfig> = {}) {
    this.config = {
      saccade: { ...DEFAULT_SACCADE_CONFIG, ...config.saccade },
    };
  }

  analyze(
    records: MovementComparisonRecord[],
    stimulus: SineWaveStimulusConfig,
  ): MovementAnalyticsResult {
    if (records.length === 0) {
      return {
        smoothPursuitScore: 0,
        dtwDistance: Number.POSITIVE_INFINITY,
        dtwPath: [],
        averagePointErrorDeg: 0,
        saccades: [],
        saccadeCount: 0,
      };
    }

    const dtwResult = runDtwAnalysis(records, stimulus);
    const { score, averagePointErrorDeg } = computeSmoothPursuitScore(
      records,
      stimulus,
      dtwResult,
    );
    const saccades = detectSaccades(
      records,
      stimulus.amplitude,
      this.config.saccade,
    );

    return {
      smoothPursuitScore: score,
      dtwDistance: dtwResult.distance,
      dtwPath: dtwResult.path,
      averagePointErrorDeg,
      saccades,
      saccadeCount: saccades.length,
    };
  }
}

export function analyzeMovementRecords(
  records: MovementComparisonRecord[],
  stimulus: SineWaveStimulusConfig,
  config?: Partial<MovementAnalyticsConfig>,
): MovementAnalyticsResult {
  return new MovementAnalytics(config).analyze(records, stimulus);
}
