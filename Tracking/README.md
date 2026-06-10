# Tracking

Vestibular eye-tracking module built with React, TypeScript, and Tailwind CSS. Integrates **MediaPipe Face Mesh** for real-time facial landmark detection and **OpenCV.js** for frame preprocessing.

## Project structure

```
Tracking/
├── src/
│   ├── services/            # Core service modules
│   │   ├── camera/          # CameraService — initializes webcam feed
│   │   ├── tracking/        # Head pose, iris isolation, FOV calibration
│   │   └── processing/      # Iris recording, velocity, sine-wave comparison
│   ├── vision/              # Computer vision pipeline
│   │   ├── pipeline/        # Orchestrates MediaPipe + OpenCV per frame
│   │   ├── mediapipe/       # Face Mesh processor & landmark math
│   │   ├── opencv/          # OpenCV.js loader & image enhancement
│   │   └── hooks/           # React hook for pipeline lifecycle
│   ├── components/
│   │   ├── charts/          # Diagnostic chart UI
│   │   └── camera/          # Camera feed + session controls
│   ├── state/               # Eye-tracking state (reducer + context)
│   ├── types/               # Shared TypeScript types
│   └── pages/               # Top-level page composition
```

## Data flow

1. `CameraService` initializes the webcam and binds it to a video element.
2. `VisionPipeline` optionally enhances frames with OpenCV.js, then runs MediaPipe Face Mesh.
3. `TrackingService` processes each frame:
   - `estimateHeadPose3D()` — 3D head pose from face geometry or landmark basis
   - `isolateIrisLandmarks()` — iris center + boundary isolated from eye region
   - `computeHeadRelativeIris()` — iris coords in head-oriented local frame
   - `FovCalibrator.mapToFovPlane()` — maps to calibrated 2D field-of-view plane
4. `EyeTrackingProvider` stores samples in application state.
5. `DiagnosticDashboard` charts render gaze, stability, head-tilt, and FOV metrics.

## Movement data processor

`EyeMovementDataProcessor` records binocular iris center X/Y over time, computes velocity and rotation, and compares actual gaze against a sine-wave target stimulus. Export via **Export Chart.js JSON** produces:

```json
{
  "type": "line",
  "data": {
    "datasets": [
      { "label": "Target X", "data": [{ "x": 1718000000000, "y": 0 }] },
      { "label": "Actual X", "data": [{ "x": 1718000000000, "y": 0.02 }] }
    ]
  },
  "records": [
    {
      "timestamp": 1718000000000,
      "elapsedMs": 120,
      "target": { "x": 0, "y": 0.31 },
      "actual": { "x": 0.01, "y": 0.28 },
      "error": { "x": 0.01, "y": -0.03, "magnitude": 0.031 },
      "velocity": { "x": 0.05, "y": -0.12, "speed": 0.13 },
      "rotation": { "directionDeg": -67.4, "angularVelocityDegPerSec": 12.1 }
    }
  ],
  "meta": { "sampleCount": 240, "stimulus": { "frequencyHz": 0.5, "amplitude": 0.4 } }
}
```

## FOV calibration

1. Fixate the center target and capture.
2. Capture left/right and up/down anchor points.
3. Click **Calibrate FOV** — iris offsets are linearly mapped to a \[-1, 1\] gaze plane.

## Scripts

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
```

## Integration with main app

This module is self-contained. To embed it in the parent Next.js app, either:

- Run it standalone during development (`cd Tracking && npm run dev`), or
- Import components/hooks from `Tracking/src` into the main app and mount them in a client route.

## Dependencies

- **MediaPipe Face Mesh** — loaded at runtime from jsDelivr CDN (468-point mesh with iris refinement). The `@mediapipe/face_mesh` npm package provides TypeScript types only.
- **OpenCV.js** — loaded via CDN in `index.html` for histogram equalization preprocessing
- `@mediapipe/camera_utils` / `@mediapipe/drawing_utils` — installed for future drawing overlays
