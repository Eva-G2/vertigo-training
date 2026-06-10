import type { EyeTrackingAction, EyeTrackingState } from "./types";

export const MAX_SAMPLES = 600;

export const initialEyeTrackingState: EyeTrackingState = {
  session: null,
  recordingStatus: "idle",
  samples: [],
  latestSample: null,
  latestFaceLandmarks: null,
  pipelineStatus: "idle",
  calibration: { isCalibrated: false, sampleCount: 0 },
  movementRecordCount: 0,
  verticalPursuitRecordCount: 0,
  verticalPursuitDataset: null,
  maxSamples: MAX_SAMPLES,
};

export function eyeTrackingReducer(
  state: EyeTrackingState,
  action: EyeTrackingAction,
): EyeTrackingState {
  switch (action.type) {
    case "SESSION_START":
      return {
        ...state,
        session: action.payload,
        recordingStatus: "idle",
        samples: [],
        latestSample: null,
        movementRecordCount: 0,
        verticalPursuitRecordCount: 0,
        verticalPursuitDataset: null,
      };

    case "SESSION_END":
      return {
        ...state,
        recordingStatus: "idle",
        session: state.session
          ? { ...state.session, endedAt: Date.now() }
          : null,
      };

    case "RECORDING_START":
      return { ...state, recordingStatus: "recording" };

    case "RECORDING_PAUSE":
      return { ...state, recordingStatus: "paused" };

    case "RECORDING_RESUME":
      return { ...state, recordingStatus: "recording" };

    case "SAMPLE_ADD": {
      const samples =
        state.recordingStatus === "recording"
          ? [...state.samples, action.payload].slice(-state.maxSamples)
          : state.samples;

      return {
        ...state,
        samples,
        latestSample: action.payload,
      };
    }

    case "FACE_LANDMARKS_UPDATE":
      return { ...state, latestFaceLandmarks: action.payload };

    case "SAMPLES_CLEAR":
      return {
        ...state,
        samples: [],
        latestSample: null,
        latestFaceLandmarks: null,
        movementRecordCount: 0,
        verticalPursuitRecordCount: 0,
        verticalPursuitDataset: null,
      };

    case "PIPELINE_STATUS":
      return { ...state, pipelineStatus: action.payload };

    case "CALIBRATION_UPDATE":
      return { ...state, calibration: action.payload };

    case "CALIBRATION_RESET":
      return {
        ...state,
        calibration: { isCalibrated: false, sampleCount: 0 },
      };

    case "MOVEMENT_RECORD":
      return { ...state, movementRecordCount: action.payload };

    case "MOVEMENT_RESET":
      return { ...state, movementRecordCount: 0 };

    case "VERTICAL_PURSUIT_RECORD":
      return { ...state, verticalPursuitRecordCount: action.payload };

    case "VERTICAL_PURSUIT_RESET":
      return {
        ...state,
        verticalPursuitRecordCount: 0,
        verticalPursuitDataset: null,
      };

    case "VERTICAL_PURSUIT_FINALIZE":
      return {
        ...state,
        verticalPursuitRecordCount: action.payload.records.length,
        verticalPursuitDataset: action.payload,
        recordingStatus: "paused",
      };

    default:
      return state;
  }
}
