import type { VerticalPursuitDataset } from "@/services/analytics";
import type {
  EyeTrackingSample,
  FovCalibrationState,
  TrackingSession,
} from "@/types/eye-tracking";
import type { FaceLandmarkPoint } from "@/types/face-mesh-frame";
import type { VisionPipelineStatus } from "@/vision/pipeline/types";

export type RecordingStatus = "idle" | "recording" | "paused";

export type EyeTrackingState = {
  session: TrackingSession | null;
  recordingStatus: RecordingStatus;
  samples: EyeTrackingSample[];
  latestSample: EyeTrackingSample | null;
  latestFaceLandmarks: FaceLandmarkPoint[] | null;
  pipelineStatus: VisionPipelineStatus;
  calibration: FovCalibrationState;
  movementRecordCount: number;
  verticalPursuitRecordCount: number;
  verticalPursuitDataset: VerticalPursuitDataset | null;
  maxSamples: number;
};

export type EyeTrackingAction =
  | { type: "SESSION_START"; payload: TrackingSession }
  | { type: "SESSION_END" }
  | { type: "RECORDING_START" }
  | { type: "RECORDING_PAUSE" }
  | { type: "RECORDING_RESUME" }
  | { type: "SAMPLE_ADD"; payload: EyeTrackingSample }
  | { type: "FACE_LANDMARKS_UPDATE"; payload: FaceLandmarkPoint[] | null }
  | { type: "SAMPLES_CLEAR" }
  | { type: "PIPELINE_STATUS"; payload: VisionPipelineStatus }
  | { type: "CALIBRATION_UPDATE"; payload: FovCalibrationState }
  | { type: "CALIBRATION_RESET" }
  | { type: "MOVEMENT_RECORD"; payload: number }
  | { type: "MOVEMENT_RESET" }
  | { type: "VERTICAL_PURSUIT_RECORD"; payload: number }
  | { type: "VERTICAL_PURSUIT_RESET" }
  | { type: "VERTICAL_PURSUIT_FINALIZE"; payload: VerticalPursuitDataset };
