import type { DualStreamTrackingGraphRecord } from "@/components/tracking/trackingGraphData";
import type { PursuitAxis } from "./VerticalPursuitAnalytics";
import type { HeadMovementGraphPoint } from "./headPoseChart";
import {
  isChartTrackingValue,
  TRACKING_CHART_GAP,
} from "./trackingGapPolicy";

/** Fixed y-axis range for head vs. eye velocity charts (deg/s). */
export const HEAD_EYE_VELOCITY_CHART_Y_RANGE = {
  min: -30,
  max: 30,
} as const;

/** Stage 2 uses the same VOR velocity chart range (deg/s). */
export const STAGE2_HEAD_EYE_VELOCITY_CHART_Y_RANGE =
  HEAD_EYE_VELOCITY_CHART_Y_RANGE;

export function resolveHeadEyeVelocityChartYRange(_params: {
  showNoddingTarget: boolean;
  showTurningTarget: boolean;
}): { min: number; max: number } {
  return HEAD_EYE_VELOCITY_CHART_Y_RANGE;
}

export type HeadEyeVelocityAxis = "pitch" | "yaw";

export type HeadEyeVelocityPoint = {
  elapsedSec: number;
  headVelocityDegPerSec: number;
  eyeVelocityDegPerSec: number;
};

function normalizeAngleDelta(deltaDeg: number): number {
  let normalized = deltaDeg;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}

function binocularAverage(left: number, right: number): number {
  const leftOk = isChartTrackingValue(left);
  const rightOk = isChartTrackingValue(right);
  if (!leftOk && !rightOk) {
    return TRACKING_CHART_GAP;
  }
  if (!leftOk) {
    return right!;
  }
  if (!rightOk) {
    return left;
  }
  return (left + right) / 2;
}

function computeVelocitySeries(
  timeSeconds: number[],
  values: number[],
): number[] {
  const velocities: number[] = [];

  for (let index = 0; index < values.length; index += 1) {
    if (index === 0) {
      velocities.push(TRACKING_CHART_GAP);
      continue;
    }

    const previousValue = values[index - 1]!;
    const currentValue = values[index]!;
    const deltaSec = timeSeconds[index]! - timeSeconds[index - 1]!;

    if (
      !isChartTrackingValue(previousValue) ||
      !isChartTrackingValue(currentValue) ||
      deltaSec <= 0
    ) {
      velocities.push(TRACKING_CHART_GAP);
      continue;
    }

    const deltaDeg = normalizeAngleDelta(currentValue - previousValue);
    velocities.push(deltaDeg / deltaSec);
  }

  return velocities;
}

export function resolveHeadEyeVelocityAxis(params: {
  showNoddingTarget: boolean;
  showTurningTarget: boolean;
  pursuitAxis?: PursuitAxis;
}): HeadEyeVelocityAxis {
  if (params.showNoddingTarget) {
    return "pitch";
  }

  if (params.showTurningTarget) {
    return "yaw";
  }

  if (params.pursuitAxis === "horizontal") {
    return "yaw";
  }

  return "pitch";
}

export function buildHeadEyeVelocityPoints(
  headPoints: HeadMovementGraphPoint[],
  verticalEyePoints: DualStreamTrackingGraphRecord[],
  horizontalEyePoints: DualStreamTrackingGraphRecord[],
  axis: HeadEyeVelocityAxis,
): HeadEyeVelocityPoint[] {
  const eyePoints = axis === "pitch" ? verticalEyePoints : horizontalEyePoints;
  const count = Math.min(headPoints.length, eyePoints.length);
  if (count < 2) {
    return [];
  }

  const alignedHeadPoints = headPoints.slice(0, count);
  const alignedEyePoints = eyePoints.slice(0, count);
  const timeSeconds = alignedHeadPoints.map((point) => point.elapsedSec);
  const headValues = alignedHeadPoints.map((point) =>
    axis === "pitch" ? point.pitchDeg : point.yawDeg,
  );

  const hasNasalRootVelocity = alignedHeadPoints.every(
    (point) => point.headVelocityDegPerSec != null,
  );
  const hasPupilCenterVelocity = alignedHeadPoints.every(
    (point) => point.eyeVelocityDegPerSec != null,
  );

  const headVelocities = hasNasalRootVelocity
    ? alignedHeadPoints.map(
        (point) => point.headVelocityDegPerSec ?? TRACKING_CHART_GAP,
      )
    : computeVelocitySeries(timeSeconds, headValues);

  // Prefer single pupil-center landmark velocity for VOR eye series.
  // Fallback keeps older sessions that only stored binocular corrected gaze.
  const eyeVelocities = hasPupilCenterVelocity
    ? alignedHeadPoints.map(
        (point) => point.eyeVelocityDegPerSec ?? TRACKING_CHART_GAP,
      )
    : computeVelocitySeries(
        timeSeconds,
        alignedEyePoints.map((point) =>
          binocularAverage(
            point.correctedSignal.leftEyeDeg,
            point.correctedSignal.rightEyeDeg,
          ),
        ),
      );

  return timeSeconds.map((elapsedSec, index) => ({
    elapsedSec,
    headVelocityDegPerSec: headVelocities[index]!,
    eyeVelocityDegPerSec: eyeVelocities[index]!,
  }));
}
