import type { Results } from "@mediapipe/face_mesh";
import type {
  EyeTrackingSample,
  GazeDegrees,
  HeadMovementAngles,
  Point2D,
} from "@/types/eye-tracking";
import { GazeStabilityService, VerticalPursuitAnalytics } from "@/services/analytics";
import { normalizeVorFrame } from "./vorFrameNormalization";
import { EyeMovementDataProcessor } from "@/services/processing";
import {
  computeGazeStability,
  extractEyeMetrics,
} from "@/vision/mediapipe/landmarks";
import { estimateHeadPose3D } from "./headPoseEstimation";
import { computeHeadMovementAngles } from "./headPoseChartAngles";
import { TRACKING_CHART_GAP } from "@/services/analytics/trackingGapPolicy";
import { FovCalibrator, TARGET_ANGLE_DEG } from "./fovCalibration";
import { computeHeadRelativeIris } from "./headRelativeIris";
import { isolateIrisLandmarks } from "./irisLandmarks";
import {
  averageGazeVectors,
  clearCompensationOffset,
  getCompensationOffset,
  getCorrectedGaze,
  headPoseToRotationVector,
  recenterTracking as applyCompensationRecenter,
  setCompensationOffset,
  subtractHeadRotation,
  type GazeRecenterBaseline,
  type HeadRotationVector,
} from "./gazeCompensation";
import { TrackingStateManager } from "./TrackingStateManager";
import { NasalRootHeadVelocityTracker } from "./nasalRootHeadVelocity";
import { PupilCenterEyeVelocityTracker } from "./pupilCenterEyeVelocity";
import type {
  CalibratedGazeDegrees,
  EyeSide,
  FovCalibrationTarget,
  TrackingFrameResult,
} from "./types";

function toCalibratedOffset(
  rawX: number,
  rawY: number,
  eyeSide: EyeSide,
  calibrator: FovCalibrator,
) {
  const gaze = calibrator.getCalibratedGaze(rawX, rawY, eyeSide);
  if (!gaze) return null;

  return {
    horizontalDeg: gaze.xDeg,
    horizontalNorm: gaze.xDeg / TARGET_ANGLE_DEG,
  };
}

function toRawGazeDegrees(
  rawX: number,
  rawY: number,
  eyeSide: EyeSide,
  calibrator: FovCalibrator,
): GazeDegrees | null {
  const gaze = calibrator.getCalibratedGaze(rawX, rawY, eyeSide);
  if (!gaze) return null;

  return {
    horizontal: gaze.xDeg,
    vertical: gaze.yDeg,
  };
}

function cloneGazeDegrees(gaze: GazeDegrees): GazeDegrees {
  return JSON.parse(JSON.stringify(gaze)) as GazeDegrees;
}

let lastVerticalShiftLogMs = 0;
const VERTICAL_SHIFT_LOG_INTERVAL_MS = 500;
let lastHeadPoseDebugLogMs = 0;
const HEAD_POSE_DEBUG_LOG_INTERVAL_MS = 500;
const BASELINE_CAPTURE_DELAY_MS = 500;

function logVerticalShift(
  rawLeftGazeDeg: GazeDegrees,
  leftEyeCorrected: GazeDegrees,
  headRotationDelta: HeadRotationVector,
): void {
  if (typeof console === "undefined") {
    return;
  }

  const now = performance.now();
  if (now - lastVerticalShiftLogMs < VERTICAL_SHIFT_LOG_INTERVAL_MS) {
    return;
  }

  lastVerticalShiftLogMs = now;
  console.log("[verticalShift]", {
    verticalShift: rawLeftGazeDeg.vertical - leftEyeCorrected.vertical,
    horizontalShift: rawLeftGazeDeg.horizontal - leftEyeCorrected.horizontal,
    headRotationDelta,
  });
}

/** Debug: compare landmark pitch vs chart-relative and 3D euler head rotation. */
function logHeadPoseDebug({
  rawPitchValue,
  processedPitchDeg,
  legacyEulerPitch,
  legacyRotationDeltaPitch,
}: {
  rawPitchValue: number;
  processedPitchDeg: number;
  legacyEulerPitch: number;
  legacyRotationDeltaPitch: number | null;
}): void {
  if (typeof console === "undefined") {
    return;
  }

  const now = performance.now();
  if (now - lastHeadPoseDebugLogMs < HEAD_POSE_DEBUG_LOG_INTERVAL_MS) {
    return;
  }

  lastHeadPoseDebugLogMs = now;
  console.log("[HeadPose]", {
    rawPitchValue,
    processedPitchDeg,
    legacyEulerPitch,
    legacyRotationDeltaPitch,
  });
}

export class TrackingService {
  private fovCalibrator = new FovCalibrator();
  private movementProcessor = new EyeMovementDataProcessor();
  private verticalPursuitAnalytics = new VerticalPursuitAnalytics();
  private gazeStabilityService = new GazeStabilityService();
  private nasalRootHeadVelocityTracker = new NasalRootHeadVelocityTracker();
  private pupilCenterEyeVelocityTracker = new PupilCenterEyeVelocityTracker();
  private baselineHeadRotation: HeadRotationVector | null = null;
  private headChartBaseline: HeadMovementAngles | null = null;
  private latestSample: EyeTrackingSample | null = null;
  private baselineCaptureTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private vorGain: number | null = null;

  getFovCalibrator(): FovCalibrator {
    return this.fovCalibrator;
  }

  getMovementProcessor(): EyeMovementDataProcessor {
    return this.movementProcessor;
  }

  getVerticalPursuitAnalytics(): VerticalPursuitAnalytics {
    return this.verticalPursuitAnalytics;
  }

  getGazeStabilityService(): GazeStabilityService {
    return this.gazeStabilityService;
  }

  /** Latest smoothed VOR gain; null while tracking is lost or analysis is inactive. */
  getVorGain(): number | null {
    return this.vorGain;
  }

  /** Enables the global tracking gate. */
  startTracking(): void {
    TrackingStateManager.setActive(true);
  }

  /** Disables the global tracking gate and clears transient session state. */
  stopTracking(): void {
    TrackingStateManager.setActive(false);
    this.cleanup();
  }

  isTracking(): boolean {
    return TrackingStateManager.isActive;
  }

  /**
   * Resets transient tracking state so values do not carry over between sessions.
   * Calibration and recorded session buffers are intentionally preserved.
   */
  cleanup(): void {
    this.cancelBaselineCapture();
    this.baselineHeadRotation = null;
    this.headChartBaseline = null;
    this.latestSample = null;
    this.vorGain = null;
    this.gazeStabilityService.reset();
    this.nasalRootHeadVelocityTracker.reset();
    this.pupilCenterEyeVelocityTracker.reset();
    lastVerticalShiftLogMs = 0;
    lastHeadPoseDebugLogMs = 0;
  }

  startRecording(): void {
    this.startTracking();
    this.movementProcessor.start();
    this.scheduleBaselineCapture();
  }

  resumeRecording(): void {
    this.startTracking();
    this.movementProcessor.start();
  }

  pauseRecording(): void {
    this.movementProcessor.stop();
    this.cancelBaselineCapture();
    this.stopTracking();
  }

  endRecordingSession(): void {
    this.pauseRecording();
    this.clearRecenterBaseline();
    this.gazeStabilityService.stop();
  }

  /**
   * Schedules automatic baseline capture 500ms after recording starts so the
   * user can settle on the target before compensation is anchored to 0°.
   */
  scheduleBaselineCapture(): void {
    if (!TrackingStateManager.isActive) {
      return;
    }

    this.cancelBaselineCapture();
    clearCompensationOffset();
    this.resetHeadPoseBaseline();

    this.baselineCaptureTimeoutId = setTimeout(() => {
      this.baselineCaptureTimeoutId = null;
      if (!TrackingStateManager.isActive) {
        return;
      }

      this.captureBaselineFromLatestSample();
    }, BASELINE_CAPTURE_DELAY_MS);
  }

  private cancelBaselineCapture(): void {
    if (this.baselineCaptureTimeoutId == null) {
      return;
    }

    clearTimeout(this.baselineCaptureTimeoutId);
    this.baselineCaptureTimeoutId = null;
  }

  private captureBaselineFromLatestSample(): void {
    if (!TrackingStateManager.isActive || !this.latestSample) {
      return;
    }

    this.recenterTracking(this.latestSample);
  }

  getCalibratedGaze(
    rawX: number,
    rawY: number,
    eyeSide: EyeSide,
  ): CalibratedGazeDegrees | null {
    return this.fovCalibrator.getCalibratedGaze(rawX, rawY, eyeSide);
  }

  /**
   * Full per-frame tracking pipeline:
   * head pose → iris isolation → head-relative iris → optional FOV projection.
   */
  processFrame(results: Results): TrackingFrameResult | null {
    if (!TrackingStateManager.isActive) {
      return null;
    }

    const landmarks = results.multiFaceLandmarks?.[0];
    if (!landmarks) {
      return {
        headPose3D: null,
        irisLandmarks: null,
        headRelativeIris: null,
        fovGaze: null,
      };
    }

    const { pose: headPose3D } = estimateHeadPose3D(results, landmarks);
    const irisLandmarks = isolateIrisLandmarks(landmarks);
    const headRelativeIris = computeHeadRelativeIris(irisLandmarks, headPose3D);
    const leftRaw: Point2D = {
      x: irisLandmarks.left.center.x,
      y: irisLandmarks.left.center.y,
    };
    const rightRaw: Point2D = {
      x: irisLandmarks.right.center.x,
      y: irisLandmarks.right.center.y,
    };
    const fovGaze = this.fovCalibrator.mapToFovPlane(leftRaw, rightRaw);

    return {
      headPose3D,
      irisLandmarks,
      headRelativeIris,
      fovGaze,
    };
  }

  /**
   * Records a calibration fixation sample from raw pupil pixel positions.
   */
  recordCalibrationSample(
    target: FovCalibrationTarget,
    pupilPositions: { left: Point2D; right: Point2D },
    faceTopNormalizedY?: number,
    chinNormalizedY?: number,
  ): void {
    this.fovCalibrator.addSample(
      target,
      pupilPositions.left,
      pupilPositions.right,
      faceTopNormalizedY,
      chinNormalizedY,
    );
  }

  runCalibration(): boolean {
    return this.fovCalibrator.calibrate();
  }

  resetCalibration(): void {
    this.cancelBaselineCapture();
    this.fovCalibrator.reset();
    this.resetHeadPoseBaseline();
    this.clearRecenterBaseline();
  }

  injectPrepCalibration(params: {
    kL: number;
    kR: number;
    kLY: number;
    kRY: number;
    leftBaseline?: { x: number; y: number };
    rightBaseline?: { x: number; y: number };
    faceTopNormalizedY?: number | null;
    chinNormalizedY?: number | null;
  }): void {
    this.fovCalibrator.injectGainFactors(params);
    this.resetHeadPoseBaseline();
  }

  resetHeadPoseBaseline(): void {
    this.baselineHeadRotation = null;
  }

  /** Clears the chart baseline so the next sample anchors 0° for head graphs. */
  resetHeadChartBaseline(): void {
    this.headChartBaseline = null;
  }

  private resolveChartHeadDelta(angles: HeadMovementAngles): {
    pitchDeg: number;
    yawDeg: number;
  } {
    if (!this.headChartBaseline) {
      this.headChartBaseline = { ...angles };
      return { pitchDeg: 0, yawDeg: 0 };
    }

    return {
      pitchDeg: angles.pitchDeg - this.headChartBaseline.pitchDeg,
      yawDeg: angles.yawDeg - this.headChartBaseline.yawDeg,
    };
  }

  clearRecenterBaseline(): void {
    clearCompensationOffset();
  }

  setRecenterBaseline(baseline: GazeRecenterBaseline): void {
    this.baselineHeadRotation = { ...baseline.headRotation };
    setCompensationOffset(baseline.compensationOffset);
  }

  hasRecenterBaseline(): boolean {
    return getCompensationOffset() != null;
  }

  /**
   * Captures average raw gaze and head rotation delta, then anchors corrected
   * gaze to 0° at the current fixation pose for the rest of the session.
   */
  recenterTracking(sample: EyeTrackingSample): GazeRecenterBaseline | null {
    if (!TrackingStateManager.isActive) {
      return null;
    }

    if (
      !sample.faceDetected ||
      !sample.headRotationDelta ||
      !sample.rawLeftGazeDeg ||
      !sample.rawRightGazeDeg
    ) {
      return null;
    }

    const averageRawGaze = averageGazeVectors(
      sample.rawLeftGazeDeg,
      sample.rawRightGazeDeg,
    );
    const compensationOffset = applyCompensationRecenter(
      averageRawGaze,
      sample.headRotationDelta,
    );

    if (sample.headPose3D) {
      this.baselineHeadRotation = headPoseToRotationVector(sample.headPose3D);
    }

    if (sample.headMovementAngles) {
      this.headChartBaseline = { ...sample.headMovementAngles };
    }

    return {
      headRotation: sample.headPose3D
        ? headPoseToRotationVector(sample.headPose3D)
        : { ...sample.headRotationDelta },
      leftGazeOffsetDeg: cloneGazeDegrees(sample.rawLeftGazeDeg),
      rightGazeOffsetDeg: cloneGazeDegrees(sample.rawRightGazeDeg),
      compensationOffset,
      capturedAt: sample.timestamp,
    };
  }

  /** @deprecated Use recenterTracking instead. */
  recenterBaseline(sample: EyeTrackingSample): GazeRecenterBaseline | null {
    return this.recenterTracking(sample);
  }

  private getHeadRotationDelta(headPose: HeadRotationVector): HeadRotationVector {
    if (!this.baselineHeadRotation) {
      this.baselineHeadRotation = { ...headPose };
    }

    return subtractHeadRotation(headPose, this.baselineHeadRotation);
  }

  private computeCompensatedGaze(
    leftRaw: Point2D,
    rightRaw: Point2D,
    headPose: NonNullable<TrackingFrameResult["headPose3D"]>,
  ): {
    rawLeftGazeDeg: GazeDegrees | null;
    rawRightGazeDeg: GazeDegrees | null;
    leftEyeCorrected: GazeDegrees | undefined;
    rightEyeCorrected: GazeDegrees | undefined;
    headRotationDelta: HeadRotationVector;
  } | null {
    if (!TrackingStateManager.isActive) {
      return null;
    }

    const rawLeftSource = toRawGazeDegrees(
      leftRaw.x,
      leftRaw.y,
      "left",
      this.fovCalibrator,
    );
    const rawRightSource = toRawGazeDegrees(
      rightRaw.x,
      rightRaw.y,
      "right",
      this.fovCalibrator,
    );
    const headRotationDelta = this.getHeadRotationDelta(
      headPoseToRotationVector(headPose),
    );

    if (!rawLeftSource || !rawRightSource) {
      return {
        rawLeftGazeDeg: rawLeftSource ? cloneGazeDegrees(rawLeftSource) : null,
        rawRightGazeDeg: rawRightSource ? cloneGazeDegrees(rawRightSource) : null,
        leftEyeCorrected: undefined,
        rightEyeCorrected: undefined,
        headRotationDelta,
      };
    }

    const rawLeftGazeDeg = cloneGazeDegrees(rawLeftSource);
    const rawRightGazeDeg = cloneGazeDegrees(rawRightSource);
    const leftEyeCorrected = cloneGazeDegrees(
      getCorrectedGaze(rawLeftGazeDeg, headRotationDelta),
    );
    const rightEyeCorrected = cloneGazeDegrees(
      getCorrectedGaze(rawRightGazeDeg, headRotationDelta),
    );

    logVerticalShift(rawLeftGazeDeg, leftEyeCorrected, headRotationDelta);

    return {
      rawLeftGazeDeg,
      rawRightGazeDeg,
      leftEyeCorrected,
      rightEyeCorrected,
      headRotationDelta,
    };
  }

  resultsToSample(results: Results, timestamp: number): EyeTrackingSample | null {
    if (!TrackingStateManager.isActive) {
      return null;
    }

    const faceDetected = Boolean(results.multiFaceLandmarks?.length);
    const landmarks = results.multiFaceLandmarks?.[0];

    if (!landmarks) {
      return this.emptySample(timestamp);
    }

    const tracking = this.processFrame(results);
    if (!tracking) {
      return null;
    }

    const eyeMetrics = extractEyeMetrics(landmarks);
    if (!eyeMetrics) {
      return this.emptySample(timestamp);
    }

    const { leftEye, rightEye, headPose } = eyeMetrics;
    // Pitch/yaw graphs: full Face Mesh orientation (eyes + forehead + chin).
    // Independent of Nasal Root (168) VOR head-velocity tracking below.
    const headMovementAngles = computeHeadMovementAngles(landmarks);
    const chartHeadDelta = faceDetected
      ? this.resolveChartHeadDelta(headMovementAngles)
      : { pitchDeg: TRACKING_CHART_GAP, yawDeg: TRACKING_CHART_GAP };
    const leftRaw = leftEye.center;
    const rightRaw = rightEye.center;
    const resolvedHeadPose = tracking.headPose3D ?? headPose;
    const compensated =
      tracking.headPose3D != null
        ? this.computeCompensatedGaze(leftRaw, rightRaw, tracking.headPose3D)
        : {
            rawLeftGazeDeg: null,
            rawRightGazeDeg: null,
            leftEyeCorrected: undefined,
            rightEyeCorrected: undefined,
            headRotationDelta: this.getHeadRotationDelta(
              headPoseToRotationVector(headPose),
            ),
          };

    if (!compensated) {
      return null;
    }

    logHeadPoseDebug({
      rawPitchValue: headMovementAngles.pitchDeg,
      processedPitchDeg: chartHeadDelta.pitchDeg,
      legacyEulerPitch: resolvedHeadPose.pitch,
      legacyRotationDeltaPitch: compensated.headRotationDelta?.pitch ?? null,
    });

    const nasalRootVelocity = this.nasalRootHeadVelocityTracker.update(
      landmarks,
      timestamp,
    );
    const pupilCenterVelocity = this.pupilCenterEyeVelocityTracker.update(
      landmarks,
      timestamp,
    );

    const sample: EyeTrackingSample = {
      id: crypto.randomUUID(),
      timestamp,
      leftEye,
      rightEye,
      leftCalibratedOffset: toCalibratedOffset(
        leftRaw.x,
        leftRaw.y,
        "left",
        this.fovCalibrator,
      ),
      rightCalibratedOffset: toCalibratedOffset(
        rightRaw.x,
        rightRaw.y,
        "right",
        this.fovCalibrator,
      ),
      rawLeftGazeDeg: compensated.rawLeftGazeDeg
        ? cloneGazeDegrees(compensated.rawLeftGazeDeg)
        : null,
      rawRightGazeDeg: compensated.rawRightGazeDeg
        ? cloneGazeDegrees(compensated.rawRightGazeDeg)
        : null,
      leftEyeCorrected: compensated.leftEyeCorrected
        ? cloneGazeDegrees(compensated.leftEyeCorrected)
        : undefined,
      rightEyeCorrected: compensated.rightEyeCorrected
        ? cloneGazeDegrees(compensated.rightEyeCorrected)
        : undefined,
      headRotationDelta: compensated.headRotationDelta,
      gazeStability: computeGazeStability(leftEye, rightEye),
      headPose: resolvedHeadPose,
      headPose3D: tracking.headPose3D,
      headMovementAngles,
      headChartPitchDeg: chartHeadDelta.pitchDeg,
      headChartYawDeg: chartHeadDelta.yawDeg,
      nasalRootHeadVelocityDegPerSec:
        nasalRootVelocity ?? TRACKING_CHART_GAP,
      pupilCenterEyeVelocityDegPerSec:
        pupilCenterVelocity ?? TRACKING_CHART_GAP,
      leftIris: tracking.headRelativeIris?.left ?? null,
      rightIris: tracking.headRelativeIris?.right ?? null,
      fovGaze: tracking.fovGaze,
      faceDetected,
      eyeInHeadDeg: null,
      vorGain: null,
    };

    const vorFrame = normalizeVorFrame(sample);
    sample.eyeInHeadDeg = vorFrame
      ? cloneGazeDegrees(vorFrame.correctedGazeDeg)
      : null;
    sample.vorGain = this.gazeStabilityService.update(sample);
    this.vorGain = sample.vorGain;

    this.latestSample = sample;
    return sample;
  }

  private emptySample(timestamp: number): EyeTrackingSample {
    this.nasalRootHeadVelocityTracker.reset();
    this.pupilCenterEyeVelocityTracker.reset();

    const sample: EyeTrackingSample = {
      id: crypto.randomUUID(),
      timestamp,
      leftEye: { center: { x: 0, y: 0 }, horizontal: 0, vertical: 0 },
      rightEye: { center: { x: 0, y: 0 }, horizontal: 0, vertical: 0 },
      leftCalibratedOffset: null,
      rightCalibratedOffset: null,
      rawLeftGazeDeg: null,
      rawRightGazeDeg: null,
      leftEyeCorrected: undefined,
      rightEyeCorrected: undefined,
      headRotationDelta: null,
      gazeStability: TRACKING_CHART_GAP,
      headPose: { roll: TRACKING_CHART_GAP, pitch: TRACKING_CHART_GAP, yaw: TRACKING_CHART_GAP },
      headPose3D: null,
      headMovementAngles: null,
      headChartPitchDeg: TRACKING_CHART_GAP,
      headChartYawDeg: TRACKING_CHART_GAP,
      nasalRootHeadVelocityDegPerSec: TRACKING_CHART_GAP,
      pupilCenterEyeVelocityDegPerSec: TRACKING_CHART_GAP,
      leftIris: null,
      rightIris: null,
      fovGaze: null,
      faceDetected: false,
      eyeInHeadDeg: null,
      vorGain: null,
    };

    if (TrackingStateManager.isActive && this.gazeStabilityService.isActive()) {
      sample.vorGain = this.gazeStabilityService.update(sample);
      this.vorGain = sample.vorGain;
    }

    this.latestSample = sample;
    return sample;
  }
}
