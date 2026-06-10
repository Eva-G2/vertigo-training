import type { Results } from "@mediapipe/face_mesh";
import type { EyeTrackingSample, Point2D } from "@/types/eye-tracking";
import { VerticalPursuitAnalytics } from "@/services/analytics";
import { EyeMovementDataProcessor } from "@/services/processing";
import {
  computeGazeStability,
  extractEyeMetrics,
} from "@/vision/mediapipe/landmarks";
import { estimateHeadPose3D } from "./headPoseEstimation";
import { FovCalibrator, TARGET_ANGLE_DEG } from "./fovCalibration";
import { computeHeadRelativeIris } from "./headRelativeIris";
import { isolateIrisLandmarks } from "./irisLandmarks";
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

export class TrackingService {
  private fovCalibrator = new FovCalibrator();
  private movementProcessor = new EyeMovementDataProcessor();
  private verticalPursuitAnalytics = new VerticalPursuitAnalytics();

  getFovCalibrator(): FovCalibrator {
    return this.fovCalibrator;
  }

  getMovementProcessor(): EyeMovementDataProcessor {
    return this.movementProcessor;
  }

  getVerticalPursuitAnalytics(): VerticalPursuitAnalytics {
    return this.verticalPursuitAnalytics;
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
  processFrame(results: Results): TrackingFrameResult {
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
  ): void {
    this.fovCalibrator.addSample(
      target,
      pupilPositions.left,
      pupilPositions.right,
    );
  }

  runCalibration(): boolean {
    return this.fovCalibrator.calibrate();
  }

  resetCalibration(): void {
    this.fovCalibrator.reset();
  }

  injectPrepCalibration(params: {
    kL: number;
    kR: number;
    kLY: number;
    kRY: number;
    leftBaseline?: { x: number; y: number };
    rightBaseline?: { x: number; y: number };
  }): void {
    this.fovCalibrator.injectGainFactors(params);
  }

  resultsToSample(results: Results, timestamp: number): EyeTrackingSample {
    const faceDetected = Boolean(results.multiFaceLandmarks?.length);
    const landmarks = results.multiFaceLandmarks?.[0];

    if (!landmarks) {
      return this.emptySample(timestamp);
    }

    const tracking = this.processFrame(results);
    const eyeMetrics = extractEyeMetrics(landmarks);
    if (!eyeMetrics) {
      return this.emptySample(timestamp);
    }

    const { leftEye, rightEye, headPose } = eyeMetrics;
    const leftRaw = leftEye.center;
    const rightRaw = rightEye.center;

    return {
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
      gazeStability: computeGazeStability(leftEye, rightEye),
      headPose: tracking.headPose3D ?? headPose,
      headPose3D: tracking.headPose3D,
      leftIris: tracking.headRelativeIris?.left ?? null,
      rightIris: tracking.headRelativeIris?.right ?? null,
      fovGaze: tracking.fovGaze,
      faceDetected,
    };
  }

  private emptySample(timestamp: number): EyeTrackingSample {
    return {
      id: crypto.randomUUID(),
      timestamp,
      leftEye: { center: { x: 0, y: 0 }, horizontal: 0, vertical: 0 },
      rightEye: { center: { x: 0, y: 0 }, horizontal: 0, vertical: 0 },
      leftCalibratedOffset: null,
      rightCalibratedOffset: null,
      gazeStability: 0,
      headPose: { roll: 0, pitch: 0, yaw: 0 },
      headPose3D: null,
      leftIris: null,
      rightIris: null,
      fovGaze: null,
      faceDetected: false,
    };
  }
}
