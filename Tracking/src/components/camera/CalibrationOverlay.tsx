import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FaceLandmarkPoint } from "@/types/face-mesh-frame";
import {
  CalibrationManager,
  type CalibrationPhase,
  type CalibrationStatus,
  type DistanceFeedback,
} from "@/services/tracking/CalibrationManager";
import {
  DistanceSmoother,
  estimateDistance,
} from "@/services/tracking/distanceEstimation";
import {
  TARGET_ANGLE_DEG,
} from "@/services/tracking/fovCalibration";
import type { FovCalibrationTarget } from "@/services/tracking/types";

export type CalibrationGainFactors = {
  kL: number;
  kR: number;
  kLY: number;
  kRY: number;
};

type CalibrationOverlayProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarks: FaceLandmarkPoint[] | null;
  active: boolean;
  targets: FovCalibrationTarget[];
  capturedLabels: Set<string>;
  isCalibrated: boolean;
  faceDetected: boolean;
  onCapture: (target: FovCalibrationTarget) => void;
  onRunCalibration: () => boolean;
  onClose: () => void;
  embedded?: boolean;
  viewportTargets?: boolean;
  onStatusChange?: (status: CalibrationStatus) => void;
  onCalibrated?: (factors: CalibrationGainFactors) => void;
};

const FEEDBACK_COPY: Record<DistanceFeedback, string> = {
  unknown: "Face the camera to begin",
  too_close: "Move further",
  too_far: "Move closer",
  confirmed: "Position confirmed",
};

function targetPositionPercent(x: number, y: number): { left: string; top: string } {
  const edgeInset = 42;
  return {
    left: `${50 + x * edgeInset}%`,
    top: `${50 + y * edgeInset}%`,
  };
}

function viewportTargetPlacement(x: number, y: number): {
  style: React.CSSProperties;
  className: string;
} {
  const edgeOffset = "clamp(1.25rem, 4vw, 2.5rem)";

  if (x === 0 && y === 0) {
    return {
      style: { left: "50%", top: "50%" },
      className: "-translate-x-1/2 -translate-y-1/2",
    };
  }
  if (y === -1) {
    return {
      style: { left: "50%", top: edgeOffset },
      className: "-translate-x-1/2",
    };
  }
  if (y === 1) {
    return {
      style: { left: "50%", bottom: edgeOffset, top: "auto" },
      className: "-translate-x-1/2",
    };
  }
  if (x === -1) {
    return {
      style: { left: edgeOffset, top: "50%" },
      className: "-translate-y-1/2",
    };
  }
  if (x === 1) {
    return {
      style: { right: edgeOffset, left: "auto", top: "50%" },
      className: "-translate-y-1/2",
    };
  }

  return {
    style: { left: "50%", top: "50%" },
    className: "-translate-x-1/2 -translate-y-1/2",
  };
}

function TargetMarker({
  label,
  x,
  y,
  active,
  captured,
  blinking = false,
  viewport = false,
}: {
  label: string;
  x: number;
  y: number;
  active: boolean;
  captured: boolean;
  blinking?: boolean;
  viewport?: boolean;
}) {
  const viewportPlacement = viewport ? viewportTargetPlacement(x, y) : null;
  const position = viewportPlacement
    ? viewportPlacement.style
    : targetPositionPercent(x, y);

  return (
    <div
      className={`${viewport ? "fixed" : "absolute"} ${
        viewportPlacement?.className ?? "-translate-x-1/2 -translate-y-1/2"
      }`}
      style={position}
    >
      <div
        className={`flex items-center justify-center rounded-full border-[3px] transition-colors ${
          viewport ? "h-12 w-12" : "h-10 w-10"
        } ${
          captured
            ? "border-green-400 bg-green-400/90 shadow-[0_0_12px_rgba(74,222,128,0.45)]"
            : active
              ? viewport
                ? "border-blue bg-yellow shadow-[0_0_12px_rgba(255,246,0,0.6)]"
                : "border-yellow bg-yellow/20 shadow-[0_0_12px_rgba(255,246,0,0.6)]"
              : viewport
                ? "border-blue bg-yellow/90"
                : "border-cyan/70 bg-cyan/10"
        } ${blinking ? "calibration-target-blink" : ""}`}
      >
        {!viewport && (
          <span className="text-[10px] font-bold uppercase text-white">
            {label[0]}
          </span>
        )}
      </div>
    </div>
  );
}

export function CalibrationOverlay({
  videoRef,
  landmarks,
  active,
  targets,
  capturedLabels,
  isCalibrated,
  faceDetected,
  onCapture,
  onRunCalibration,
  onClose,
  embedded = false,
  viewportTargets = false,
  onStatusChange,
  onCalibrated,
}: CalibrationOverlayProps) {
  const managerRef = useRef(new CalibrationManager());
  const smootherRef = useRef(new DistanceSmoother());
  const landmarksRef = useRef(landmarks);
  const lastLogTimeRef = useRef(0);
  const [phase, setPhase] = useState<CalibrationPhase>("idle");
  const [feedback, setFeedback] = useState<DistanceFeedback>("unknown");
  const [distanceCm, setDistanceCm] = useState<number | null>(null);
  const [distanceRange, setDistanceRange] = useState(
    managerRef.current.getDistanceRange(),
  );
  const [activeTargetIndex, setActiveTargetIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const autoCalibrateAttemptedRef = useRef(false);

  landmarksRef.current = landmarks;

  const syncManagerStatus = useCallback(() => {
    onStatusChange?.(managerRef.current.getStatus());
  }, [onStatusChange]);

  const resetFlow = useCallback(() => {
    managerRef.current.start();
    smootherRef.current.reset();
    setDistanceRange(managerRef.current.getDistanceRange());
    setPhase("distance_check");
    setFeedback("unknown");
    setDistanceCm(null);
    setActiveTargetIndex(0);
    setDismissed(false);
    autoCalibrateAttemptedRef.current = false;
    syncManagerStatus();
  }, [syncManagerStatus]);

  useEffect(() => {
    if (!active) {
      managerRef.current.reset();
      smootherRef.current.reset();
      setPhase("idle");
      setDismissed(false);
      syncManagerStatus();
      return;
    }

    resetFlow();
  }, [active, resetFlow, syncManagerStatus]);

  useEffect(() => {
    if (!active || (phase !== "distance_check" && phase !== "collecting")) {
      return;
    }

    let frameId = 0;

    const tick = () => {
      const video = videoRef.current;
      const currentLandmarks = landmarksRef.current;

      if (!video || !currentLandmarks?.length) {
        setFeedback("unknown");
        frameId = requestAnimationFrame(tick);
        return;
      }

      const frameWidth = video.videoWidth || video.clientWidth;
      const frameHeight = video.videoHeight || video.clientHeight;
      const rawDistance = estimateDistance(
        currentLandmarks,
        frameWidth,
        frameHeight,
      );
      const smoothed = smootherRef.current.push(rawDistance);

      if (smoothed !== null) {
        const now = performance.now();
        if (now - lastLogTimeRef.current >= 1000) {
          lastLogTimeRef.current = now;
          const range = managerRef.current.getDistanceRange();
          console.log(
            `[Distance Estimation] ${smoothed.toFixed(1)} cm (target ${range.optimalCm.toFixed(1)} cm, range ${range.minCm.toFixed(1)}–${range.maxCm.toFixed(1)} cm)`,
          );
        }
      }

      setDistanceCm(smoothed);
      const nextFeedback = managerRef.current.updateDistance(smoothed);
      setFeedback(nextFeedback);
      setPhase(managerRef.current.getPhase());
      syncManagerStatus();
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active, phase, syncManagerStatus, videoRef]);

  const currentTarget = targets[activeTargetIndex] ?? null;
  const distanceOk = feedback === "confirmed";
  const canCapture =
    phase === "collecting" &&
    distanceOk &&
    managerRef.current.canCollect() &&
    faceDetected &&
    currentTarget !== null;

  const handleCapture = () => {
    if (!canCapture || !currentTarget) {
      return;
    }

    onCapture(currentTarget);
    setActiveTargetIndex((index) => Math.min(index + 1, targets.length - 1));
  };

  const allCaptured = useMemo(
    () => targets.every((target) => capturedLabels.has(target.label)),
    [capturedLabels, targets],
  );

  useEffect(() => {
    if (allCaptured && phase === "collecting") {
      managerRef.current.markComplete();
      setPhase("complete");
      syncManagerStatus();
    }
  }, [allCaptured, phase, syncManagerStatus]);

  useEffect(() => {
    if (phase !== "complete" || isCalibrated || autoCalibrateAttemptedRef.current) {
      return;
    }

    autoCalibrateAttemptedRef.current = true;
    const success = onRunCalibration();
    if (!success) {
      return;
    }

    managerRef.current.markCalibrated();
    syncManagerStatus();

    if (embedded) {
      setDismissed(true);
    }
  }, [embedded, isCalibrated, onRunCalibration, phase, syncManagerStatus]);

  if (!active || (embedded && dismissed)) {
    return null;
  }

  const activeTargetIsCenter =
    currentTarget?.x === 0 && currentTarget?.y === 0;
  const showDistanceTarget =
    phase === "distance_check" ||
    (phase === "collecting" && !activeTargetIsCenter);
  const showCalibrationTargets = phase === "collecting" || phase === "complete";
  const distanceTargetConfirmed = distanceOk;
  const useViewportLayout = embedded && viewportTargets;

  const targetLayer = (
    <>
      {showDistanceTarget && (
        <div
          className={`${
            useViewportLayout ? "fixed" : "absolute"
          } left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2`}
        >
          <div
            className={`h-16 w-16 rounded-full border-4 transition-colors ${
              distanceTargetConfirmed
                ? "border-green-400 bg-green-400/25 shadow-[0_0_20px_rgba(74,222,128,0.55)]"
                : "border-white bg-white/25 shadow-[0_0_12px_rgba(255,255,255,0.35)]"
            }`}
          />
        </div>
      )}

      {showCalibrationTargets &&
        targets.map((target, index) => {
          const captured = capturedLabels.has(target.label);
          const isActive =
            phase === "collecting" && index === activeTargetIndex;

          if (!captured && !isActive) {
            return null;
          }

          return (
            <TargetMarker
              key={target.label}
              label={target.label}
              x={target.x}
              y={target.y}
              active={isActive}
              captured={captured}
              blinking={isActive && !captured}
              viewport={useViewportLayout}
            />
          );
        })}
    </>
  );

  const controlPanel = (
      <div
        className={`space-y-3 px-4 py-4 text-white ${
          useViewportLayout
            ? "fixed inset-x-0 bottom-0 z-30 bg-dark-blue/90"
            : "bg-dark-blue/90"
        }`}
      >
        {(phase === "distance_check" || phase === "collecting") && (
          <>
            <p className="text-center text-sm font-semibold">
              {phase === "distance_check"
                ? "Pre-Calibration Distance Check"
                : "FOV Calibration — fixate the highlighted target"}
            </p>
            <p
              className={`text-center text-lg font-bold ${
                distanceTargetConfirmed ? "text-green-400" : "text-white"
              }`}
            >
              {distanceTargetConfirmed && phase === "collecting" && currentTarget
                ? `Look at the ${currentTarget.label} target`
                : FEEDBACK_COPY[feedback]}
            </p>
            {distanceCm !== null && (
              <p className="text-center text-xs text-white/70">
                Estimated distance: {distanceCm.toFixed(1)} cm · Target:{" "}
                {distanceRange.optimalCm.toFixed(0)} cm ({TARGET_ANGLE_DEG}°
                visual angle)
              </p>
            )}
          </>
        )}

        {phase === "collecting" && currentTarget && (
          <>
            {!distanceOk && (
              <p className="text-center text-xs text-white/80">
                Adjust your distance before capturing the next point.
              </p>
            )}
            <p className="text-center text-xs text-white/70">
              Capture each point at ±{TARGET_ANGLE_DEG}° ({currentTarget.label})
            </p>
            <button
              type="button"
              onClick={handleCapture}
              disabled={!canCapture}
              className="mx-auto block rounded-xl bg-cyan px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Capture {currentTarget.label}
            </button>
          </>
        )}

        {phase === "complete" && !embedded && (
          <>
            <p className="text-center text-sm font-semibold text-green-400">
              All calibration points captured
            </p>
            <button
              type="button"
              onClick={() => {
                if (onRunCalibration()) {
                  managerRef.current.markCalibrated();
                  syncManagerStatus();
                }
              }}
              disabled={isCalibrated}
              className="mx-auto block rounded-xl bg-cyan px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Calibrate FOV
            </button>
          </>
        )}

        {phase === "complete" && embedded && (
          <p className="text-center text-sm font-semibold text-green-400">
            Calibrating field of view…
          </p>
        )}

        {!embedded && (
          <button
            type="button"
            onClick={onClose}
            className="mx-auto block text-xs text-white/60 underline-offset-2 hover:text-white hover:underline"
          >
            Cancel calibration
          </button>
        )}
      </div>
  );

  if (useViewportLayout) {
    return (
      <>
        <div className="pointer-events-none fixed inset-0 z-20">{targetLayer}</div>
        {controlPanel}
      </>
    );
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-dark-blue/40">
      <div className="relative flex-1">{targetLayer}</div>
      {controlPanel}
    </div>
  );
}
