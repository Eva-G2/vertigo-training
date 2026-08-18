"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  normalizeViewportX,
  normalizeViewportY,
  type PursuitAxis,
} from "@/services/analytics";
import { useEyeTracking } from "@/state";
import { useApp } from "./providers/AppProvider";
import { Button } from "./Button";
import { t } from "@/lib/i18n";
import {
  buildSmoothPursuitChirp,
  buildSmoothPursuitChirpHorizontal,
  computeSmoothPursuitX,
  computeSmoothPursuitY,
  DEFAULT_SMOOTH_PURSUIT_CHIRP,
  getCompletedCycles,
  type SmoothPursuitChirpParams,
} from "@/lib/smoothPursuitPath";
import {
  HEAD_NOD_CYCLES,
  HEAD_NOD_TOTAL_MS,
  HEAD_TURN_CYCLES,
  HEAD_TURN_TOTAL_MS,
  PACING_CYCLES,
  PACING_TOTAL_MS,
  resumeAudioContext,
  SHOULDER_PACING_CYCLES,
  SHOULDER_ROTATION_CYCLES,
  startHeadNoddingPacingLoop,
  startHeadTurningPacingLoop,
  startPacingLoop,
  startShoulderPacingLoop,
  startShoulderRotationPacingLoop,
  startWaistTurningPacingLoop,
  WAIST_TURN_CYCLES,
  WAIST_TURN_TOTAL_MS,
  type PacingLoopHandle,
} from "@/lib/pacingMetronome";
import { STAGE2_SESSION_DURATION_MS } from "@/lib/stage2Steps";
import { STAGE3_STEP1_FOLLOW_LEAD_MS } from "@/lib/stage3Steps";
import { HeadNodGuideTriangle } from "./HeadNodGuideTriangle";
import { HeadTurnGuideTriangle } from "./HeadTurnGuideTriangle";
import {
  headNodGuideNormalizedYAtElapsedMs,
  type HeadNodGuideBounds,
} from "@/services/analytics/headNodGuideGeometry";
import { headTurnGuideNormalizedXAtElapsedMs } from "@/services/analytics/headTurnGuideGeometry";
import { waistTurnGuideNormalizedXAtElapsedMs } from "@/services/analytics/waistTurnGuideGeometry";

type ExerciseMode = "smooth-pursuit" | "vergence";

type GamePhase =
  | "idle"
  | "countdown"
  | "anchor"
  | "running"
  | "centering"
  | "complete";

type SmoothPursuitGameOverlayProps = {
  trackingAxis?: PursuitAxis;
  exerciseMode?: ExerciseMode;
  /** When set, plays this video as the exercise stimulus instead of the A marker. */
  stimulusVideoSrc?: string;
  /** When true, the pursuit target runs but the visible A marker is hidden. */
  hideMarker?: boolean;
  /** When true, the A marker stays centered and does not move during the session. */
  staticMarker?: boolean;
  /** Stage 2 Step 1: audio metronome cues head nodding (look up / look down). */
  headNoddingMetronome?: boolean;
  /** Stage 2 Step 2: audio metronome cues head turning (look left / look right). */
  headTurningMetronome?: boolean;
  /** Stage 3 Step 1: audio cues shoulder lift / lower movements. */
  shoulderMetronome?: boolean;
  /** Stage 3 Step 2: audio cues shoulder rotations. */
  shoulderRotationMetronome?: boolean;
  /** Stage 3 Step 3: audio and visual cues alternate waist turns. */
  waistTurningMetronome?: boolean;
  /** Vertical guide range for the head-nodding triangle indicator. */
  headNodGuideBounds?: HeadNodGuideBounds | null;
  /** Passed to tracking analytics so Stage 2 head graphs can be gated. */
  sessionLabel?: string;
  /** Session length for {@link staticMarker} mode. */
  staticSessionDurationMs?: number;
  onRecordingStart: () => void;
  onSessionEnd: () => void;
  onProgress: (pct: number) => void;
  onVisibleChange?: (visible: boolean) => void;
  onRegisterHide?: (hide: () => void) => void;
  onVideoDuration?: (durationSec: number) => void;
  /** S3S1 follow-along clip; starts 26 frames before the first beep. */
  followVideoRef?: React.RefObject<HTMLVideoElement | null>;
};

const COUNTDOWN_INTERVAL_MS = 500;
const COUNTDOWN_STEPS = ["ready", "3", "2", "1", "go"] as const;
const MARKER_SHADOW = "2px 5px 6px rgba(0, 0, 0, 0.5)";
const CENTERING_DURATION_MS = 300;

export function SmoothPursuitGameOverlay({
  trackingAxis = "vertical",
  exerciseMode = "smooth-pursuit",
  stimulusVideoSrc,
  hideMarker = false,
  staticMarker = false,
  headNoddingMetronome = false,
  headTurningMetronome = false,
  shoulderMetronome = false,
  shoulderRotationMetronome = false,
  waistTurningMetronome = false,
  headNodGuideBounds = null,
  staticSessionDurationMs = STAGE2_SESSION_DURATION_MS,
  sessionLabel,
  onRecordingStart,
  onSessionEnd,
  onProgress,
  onVisibleChange,
  onRegisterHide,
  onVideoDuration,
  followVideoRef,
}: SmoothPursuitGameOverlayProps) {
  const { state, showLanguageModal } = useApp();
  const { locale, theme } = state;
  const isDark = theme === "dark";
  const isHorizontal = trackingAxis === "horizontal";
  const isVergenceMode = exerciseMode === "vergence";
  const analyticsAxis: PursuitAxis = isVergenceMode ? "vergence" : trackingAxis;
  const isVideoStimulus = Boolean(stimulusVideoSrc);
  const { startTrackingAnalytics, stopTrackingAnalytics } = useEyeTracking();
  const containerRef = useRef<HTMLDivElement>(null);
  const animationStartRef = useRef<number | null>(null);
  const markerPrimaryRef = useRef<number | null>(null);
  const wasAnimatingRef = useRef(false);
  const chirpParamsRef = useRef<SmoothPursuitChirpParams | null>(null);
  const completedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const centeringFromRef = useRef(0);
  const centeringStartRef = useRef(0);
  const stimulusVideoRef = useRef<HTMLVideoElement>(null);
  const pacingLoopRef = useRef<PacingLoopHandle | null>(null);
  const headNodGuideRef = useRef<HTMLDivElement>(null);
  const headTurnGuideRef = useRef<HTMLDivElement>(null);
  const instructionBannerRef = useRef<HTMLDivElement>(null);
  const headNodGuideBoundsRef = useRef(headNodGuideBounds);
  const headTurnGuideTopPxRef = useRef(10);
  const startTrackingAnalyticsRef = useRef(startTrackingAnalytics);
  const stopTrackingAnalyticsRef = useRef(stopTrackingAnalytics);
  const getTargetPositionRef = useRef<() => number | null>(() => null);
  const onRecordingStartRef = useRef(onRecordingStart);
  const onVisibleChangeRef = useRef(onVisibleChange);
  const onRegisterHideRef = useRef(onRegisterHide);

  startTrackingAnalyticsRef.current = startTrackingAnalytics;
  stopTrackingAnalyticsRef.current = stopTrackingAnalytics;
  onRecordingStartRef.current = onRecordingStart;
  onVisibleChangeRef.current = onVisibleChange;
  onRegisterHideRef.current = onRegisterHide;
  headNodGuideBoundsRef.current = headNodGuideBounds;

  const updateHeadNodGuidePosition = useCallback((elapsedMs: number) => {
    const bounds = headNodGuideBoundsRef.current;
    const guide = headNodGuideRef.current;
    if (!bounds || !guide) {
      return;
    }

    const normalizedY = headNodGuideNormalizedYAtElapsedMs(elapsedMs, bounds);
    guide.style.top = `${normalizedY * 100}%`;
  }, []);

  const syncHeadTurnGuideTop = useCallback(() => {
    const banner = instructionBannerRef.current;
    if (!banner) {
      return;
    }

    headTurnGuideTopPxRef.current = banner.offsetHeight + 10;
    const guide = headTurnGuideRef.current;
    if (guide) {
      guide.style.top = `${headTurnGuideTopPxRef.current}px`;
    }
  }, []);

  const updateHeadTurnGuidePosition = useCallback((elapsedMs: number) => {
    const guide = headTurnGuideRef.current;
    if (!guide) {
      return;
    }

    const normalizedX = headTurnGuideNormalizedXAtElapsedMs(elapsedMs);
    guide.style.left = `${normalizedX * 100}%`;
    guide.style.top = `${headTurnGuideTopPxRef.current}px`;
  }, []);

  const updateWaistTurnGuidePosition = useCallback((elapsedMs: number) => {
    const guide = headTurnGuideRef.current;
    if (!guide) {
      return;
    }

    const normalizedX = waistTurnGuideNormalizedXAtElapsedMs(elapsedMs);
    guide.style.left = `${normalizedX * 100}%`;
    guide.style.top = `${headTurnGuideTopPxRef.current}px`;
  }, []);

  const [phase, setPhase] = useState<GamePhase>("idle");
  const [countdownIndex, setCountdownIndex] = useState(0);
  const [markerPrimary, setMarkerPrimary] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const stopPacingLoop = useCallback(() => {
    pacingLoopRef.current?.stop();
    pacingLoopRef.current = null;
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
    stopPacingLoop();
  }, [stopPacingLoop]);

  const resetFollowVideo = useCallback(() => {
    const follow = followVideoRef?.current;
    if (!follow) {
      return;
    }

    follow.pause();
    follow.currentTime = 0;
  }, [followVideoRef]);

  const stopFollowVideo = useCallback(() => {
    followVideoRef?.current?.pause();
  }, [followVideoRef]);

  const hideTracking = useCallback(() => {
    clearTimers();
    stopFollowVideo();
    setIsAnimating(false);
    setIsVisible(false);
    onVisibleChange?.(false);
  }, [clearTimers, onVisibleChange, stopFollowVideo]);

  const getViewportPrimary = useCallback(() => {
    return isHorizontal ? window.innerWidth : window.innerHeight;
  }, [isHorizontal]);

  const buildChirp = useCallback(
    (viewportPrimary: number) => {
      return isHorizontal
        ? buildSmoothPursuitChirpHorizontal(viewportPrimary)
        : buildSmoothPursuitChirp(viewportPrimary);
    },
    [isHorizontal],
  );

  const computeMarkerPosition = useCallback(
    (elapsedSeconds: number, params: SmoothPursuitChirpParams) => {
      return isHorizontal
        ? computeSmoothPursuitX(elapsedSeconds, params)
        : computeSmoothPursuitY(elapsedSeconds, params);
    },
    [isHorizontal],
  );

  const updateMarkerPrimary = useCallback((position: number) => {
    markerPrimaryRef.current = position;
    setMarkerPrimary(position);
  }, []);

  const centerMarker = useCallback(() => {
    updateMarkerPrimary(getViewportPrimary() / 2);
  }, [getViewportPrimary, updateMarkerPrimary]);

  const getTargetPosition = useCallback(() => {
    if (staticMarker || isVideoStimulus || isVergenceMode) {
      return 0;
    }

    const position = markerPrimaryRef.current;
    if (position == null) {
      return null;
    }

    if (isHorizontal) {
      return normalizeViewportX(position, window.innerWidth);
    }

    return normalizeViewportY(position, window.innerHeight);
  }, [isHorizontal, isVideoStimulus, isVergenceMode, staticMarker]);

  getTargetPositionRef.current = getTargetPosition;

  const getCountdownLabel = useCallback(
    (step: (typeof COUNTDOWN_STEPS)[number]) => {
      if (step === "ready") return t(locale, "countdownReady");
      if (step === "go") return t(locale, "countdownGo");
      return step;
    },
    [locale],
  );

  const schedule = useCallback((fn: () => void, delayMs: number) => {
    const timer = setTimeout(fn, delayMs);
    timersRef.current.push(timer);
  }, []);

  const completeVergenceSession = useCallback(() => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    stopPacingLoop();
    onProgress(100);
    setIsAnimating(false);
    setPhase("complete");
    onSessionEnd();
  }, [onProgress, onSessionEnd, stopPacingLoop]);

  const completeHeadNoddingSession = useCallback(() => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    stopPacingLoop();
    onProgress(100);
    setIsAnimating(false);
    setPhase("complete");
    onSessionEnd();
  }, [onProgress, onSessionEnd, stopPacingLoop]);

  const completeHeadTurningSession = useCallback(() => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    stopPacingLoop();
    onProgress(100);
    setIsAnimating(false);
    setPhase("complete");
    onSessionEnd();
  }, [onProgress, onSessionEnd, stopPacingLoop]);

  const startHeadNoddingExercise = useCallback(() => {
    animationStartRef.current = performance.now();
    chirpParamsRef.current = buildChirp(getViewportPrimary());
    setIsAnimating(true);
    setPhase("running");
    updateHeadNodGuidePosition(0);

    stopPacingLoop();
    const pacingLoop = startHeadNoddingPacingLoop(HEAD_NOD_CYCLES);
    pacingLoopRef.current = pacingLoop;
    void pacingLoop.promise.then(() => {
      completeHeadNoddingSession();
    });
  }, [
    buildChirp,
    completeHeadNoddingSession,
    getViewportPrimary,
    stopPacingLoop,
    updateHeadNodGuidePosition,
  ]);

  const startHeadTurningExercise = useCallback(() => {
    animationStartRef.current = performance.now();
    chirpParamsRef.current = buildChirp(getViewportPrimary());
    setIsAnimating(true);
    setPhase("running");
    syncHeadTurnGuideTop();
    updateHeadTurnGuidePosition(0);

    stopPacingLoop();
    const pacingLoop = startHeadTurningPacingLoop(HEAD_TURN_CYCLES);
    pacingLoopRef.current = pacingLoop;
    void pacingLoop.promise.then(() => {
      completeHeadTurningSession();
    });
  }, [
    buildChirp,
    completeHeadTurningSession,
    getViewportPrimary,
    stopPacingLoop,
    syncHeadTurnGuideTop,
    updateHeadTurnGuidePosition,
  ]);

  const startExercise = useCallback(() => {
    animationStartRef.current = performance.now();
    chirpParamsRef.current = buildChirp(getViewportPrimary());
    setIsAnimating(true);
    setPhase("running");

    if (isVergenceMode) {
      stopPacingLoop();
      const pacingLoop = startPacingLoop(PACING_CYCLES);
      pacingLoopRef.current = pacingLoop;
      void pacingLoop.promise.then(() => {
        completeVergenceSession();
      });
    }

    if (shoulderMetronome) {
      stopPacingLoop();
      pacingLoopRef.current = startShoulderPacingLoop(SHOULDER_PACING_CYCLES);
    }

    if (shoulderRotationMetronome) {
      stopPacingLoop();
      pacingLoopRef.current = startShoulderRotationPacingLoop(
        SHOULDER_ROTATION_CYCLES,
      );
    }

    if (waistTurningMetronome) {
      syncHeadTurnGuideTop();
      updateWaistTurnGuidePosition(0);
      stopPacingLoop();
      pacingLoopRef.current = startWaistTurningPacingLoop(WAIST_TURN_CYCLES);
    }

    if (isVideoStimulus) {
      const video = stimulusVideoRef.current;
      if (video) {
        video.currentTime = 0;
        void video.play();
      }
    }
  }, [
    buildChirp,
    completeVergenceSession,
    getViewportPrimary,
    isVergenceMode,
    isVideoStimulus,
    shoulderMetronome,
    shoulderRotationMetronome,
    stopPacingLoop,
    syncHeadTurnGuideTop,
    updateWaistTurnGuidePosition,
    waistTurningMetronome,
  ]);

  const handleStart = useCallback(() => {
    void resumeAudioContext();
    clearTimers();
    completedRef.current = false;
    animationStartRef.current = null;
    chirpParamsRef.current = buildChirp(getViewportPrimary());
    centerMarker();
    setCountdownIndex(0);
    setIsAnimating(false);
    setPhase("countdown");
    resetFollowVideo();

    COUNTDOWN_STEPS.forEach((_, index) => {
      if (index === 0) return;
      schedule(() => setCountdownIndex(index), index * COUNTDOWN_INTERVAL_MS);
    });

    const goIndex = COUNTDOWN_STEPS.indexOf("go");
    const goEndMs = (goIndex + 1) * COUNTDOWN_INTERVAL_MS;
    const firstBeepMs = goEndMs + DEFAULT_SMOOTH_PURSUIT_CHIRP.postGoDelayMs;

    schedule(() => {
      setCountdownIndex(0);
      centerMarker();

      if (headNoddingMetronome) {
        startHeadNoddingExercise();
        return;
      }

      if (headTurningMetronome) {
        startHeadTurningExercise();
        return;
      }

      setPhase("anchor");
    }, goEndMs);

    if (followVideoRef?.current) {
      schedule(() => {
        const follow = followVideoRef.current;
        if (!follow || completedRef.current) {
          return;
        }

        void follow.play();
      }, Math.max(0, firstBeepMs - STAGE3_STEP1_FOLLOW_LEAD_MS));
    }

    if (!headNoddingMetronome && !headTurningMetronome) {
      schedule(startExercise, firstBeepMs);
    }
  }, [
    buildChirp,
    centerMarker,
    clearTimers,
    followVideoRef,
    getViewportPrimary,
    headNoddingMetronome,
    headTurningMetronome,
    resetFollowVideo,
    schedule,
    startExercise,
    startHeadNoddingExercise,
    startHeadTurningExercise,
  ]);

  useEffect(() => {
    if (phase !== "complete") {
      return;
    }

    stopFollowVideo();
  }, [phase, stopFollowVideo]);

  useEffect(() => {
    centerMarker();
  }, [centerMarker, trackingAxis]);

  useEffect(() => {
    const handleResize = () => {
      if (phase === "idle" || phase === "anchor") {
        centerMarker();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [centerMarker, phase]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    onVisibleChangeRef.current?.(isVisible);
  }, [isVisible]);

  useEffect(() => {
    onRegisterHideRef.current?.(hideTracking);
  }, [hideTracking]);

  useEffect(() => {
    if (isAnimating) {
      if (!wasAnimatingRef.current) {
        startTrackingAnalyticsRef.current(
          getTargetPositionRef.current,
          analyticsAxis,
          sessionLabel,
        );
        onRecordingStartRef.current();
        wasAnimatingRef.current = true;
      }
      return;
    }

    if (wasAnimatingRef.current) {
      stopTrackingAnalyticsRef.current();
      wasAnimatingRef.current = false;
    }
  }, [isAnimating, analyticsAxis]);

  useEffect(() => {
    if (!isVideoStimulus || phase !== "running") return;

    const video = stimulusVideoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }

      onProgress(Math.min(100, (video.currentTime / video.duration) * 100));
    };

    const handleEnded = () => {
      if (completedRef.current) {
        return;
      }

      completedRef.current = true;
      onProgress(100);
      setIsAnimating(false);
      setPhase("complete");
      onSessionEnd();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [isVideoStimulus, onProgress, onSessionEnd, phase]);

  useEffect(() => {
    if (phase !== "running" || isVideoStimulus) return;

    let frameId = 0;
    const { totalCycles } = DEFAULT_SMOOTH_PURSUIT_CHIRP;

    const tick = (now: number) => {
      const animationStart = animationStartRef.current ?? now;

      if (staticMarker) {
        const elapsedMs = now - animationStart;
        const sessionDurationMs = headNoddingMetronome
          ? HEAD_NOD_TOTAL_MS
          : headTurningMetronome
            ? HEAD_TURN_TOTAL_MS
            : waistTurningMetronome
              ? WAIST_TURN_TOTAL_MS
            : staticSessionDurationMs;
        onProgress(Math.min(100, (elapsedMs / sessionDurationMs) * 100));

        if (headNoddingMetronome) {
          updateHeadNodGuidePosition(elapsedMs);

          if (elapsedMs >= HEAD_NOD_TOTAL_MS) {
            completeHeadNoddingSession();
            return;
          }

          frameId = requestAnimationFrame(tick);
          return;
        }

        if (headTurningMetronome) {
          updateHeadTurnGuidePosition(elapsedMs);

          if (elapsedMs >= HEAD_TURN_TOTAL_MS) {
            completeHeadTurningSession();
            return;
          }

          frameId = requestAnimationFrame(tick);
          return;
        }

        if (waistTurningMetronome) {
          updateWaistTurnGuidePosition(elapsedMs);
        }

        if (elapsedMs >= staticSessionDurationMs) {
          if (!completedRef.current) {
            completedRef.current = true;
            onProgress(100);
            setIsAnimating(false);
            setPhase("complete");
            onSessionEnd();
          }
          return;
        }

        frameId = requestAnimationFrame(tick);
        return;
      }

      if (isVergenceMode) {
        const elapsedMs = now - animationStart;
        onProgress(Math.min(100, (elapsedMs / PACING_TOTAL_MS) * 100));

        if (elapsedMs >= PACING_TOTAL_MS) {
          completeVergenceSession();
          return;
        }

        frameId = requestAnimationFrame(tick);
        return;
      }

      const params =
        chirpParamsRef.current ?? buildChirp(getViewportPrimary());
      const elapsedSeconds = (now - animationStart) / 1000;
      const completedCycles = getCompletedCycles(
        elapsedSeconds,
        params.f0,
        params.k,
      );

      const pct = Math.min(100, (completedCycles / totalCycles) * 100);
      onProgress(pct);

      if (completedCycles >= totalCycles && !completedRef.current) {
        completedRef.current = true;
        centeringFromRef.current = computeMarkerPosition(
          elapsedSeconds,
          params,
        );
        centeringStartRef.current = now;
        onProgress(100);
        setIsAnimating(false);
        setPhase("centering");
        return;
      }

      updateMarkerPrimary(computeMarkerPosition(elapsedSeconds, params));
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [
    buildChirp,
    completeHeadNoddingSession,
    completeHeadTurningSession,
    completeVergenceSession,
    computeMarkerPosition,
    getViewportPrimary,
    headNoddingMetronome,
    headTurningMetronome,
    isVideoStimulus,
    isVergenceMode,
    onProgress,
    onSessionEnd,
    phase,
    staticMarker,
    staticSessionDurationMs,
    updateHeadNodGuidePosition,
    updateHeadTurnGuidePosition,
    updateWaistTurnGuidePosition,
    updateMarkerPrimary,
    waistTurningMetronome,
  ]);

  useEffect(() => {
    if (phase !== "centering" || isVergenceMode) return;

    let frameId = 0;
    const targetPosition = getViewportPrimary() / 2;
    const fromPosition = centeringFromRef.current;

    const tick = (now: number) => {
      const elapsed = now - centeringStartRef.current;
      const progress = Math.min(1, elapsed / CENTERING_DURATION_MS);
      const eased = progress * (2 - progress);

      updateMarkerPrimary(fromPosition + (targetPosition - fromPosition) * eased);

      if (progress >= 1) {
        updateMarkerPrimary(targetPosition);
        setPhase("complete");
        onSessionEnd();
        return;
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [getViewportPrimary, onSessionEnd, phase, updateMarkerPrimary]);

  useEffect(() => {
    if ((!headTurningMetronome && !waistTurningMetronome) || !staticMarker) {
      return;
    }

    if (phase !== "idle" && phase !== "running" && phase !== "complete") {
      return;
    }

    syncHeadTurnGuideTop();
    const banner = instructionBannerRef.current;
    if (!banner) {
      return;
    }

    const observer = new ResizeObserver(() => {
      syncHeadTurnGuideTop();
    });
    observer.observe(banner);
    return () => observer.disconnect();
  }, [
    headTurningMetronome,
    phase,
    staticMarker,
    syncHeadTurnGuideTop,
    waistTurningMetronome,
  ]);

  const showCountdown = isVisible && phase === "countdown";
  const showMarker =
    !hideMarker &&
    !isVideoStimulus &&
    isVisible &&
    !showLanguageModal &&
    (phase === "idle" ||
      phase === "anchor" ||
      phase === "running" ||
      phase === "centering" ||
      phase === "complete");
  const idleInstructionKey = isVergenceMode
    ? "vergenceInstruction"
    : "trackAInstruction";
  const instructionBannerKey = shoulderRotationMetronome
    ? "shoulderRotationInstruction"
    : staticMarker
      ? "lookAtLetterAInstruction"
      : idleInstructionKey;
  const showInstructionBanner =
    staticMarker &&
    (phase === "idle" || phase === "running" || phase === "complete");
  const showStimulusVideo =
    isVideoStimulus &&
    isVisible &&
    (phase === "idle" ||
      phase === "anchor" ||
      phase === "running" ||
      phase === "complete");

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[15]"
      aria-busy={isAnimating}
    >
      {(showInstructionBanner || phase === "idle") && (
        <div className="absolute inset-x-0 top-0 z-20 flex w-full flex-col items-center">
          <div
            ref={instructionBannerRef}
            className={`w-full px-8 py-5 text-center text-2xl font-bold ${
              isDark ? "bg-background/80 text-yellow" : "bg-blue/80 text-white"
            }`}
          >
            {t(locale, showInstructionBanner ? instructionBannerKey : idleInstructionKey)}
          </div>
          {phase === "idle" && (
            <div className="mt-6">
              <Button label={t(locale, "start")} onClick={handleStart} />
            </div>
          )}
        </div>
      )}

      {showCountdown && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/25">
          <p className="text-6xl font-extrabold tracking-tight text-yellow [text-shadow:none]">
            {getCountdownLabel(COUNTDOWN_STEPS[countdownIndex])}
          </p>
        </div>
      )}

      {headNoddingMetronome &&
        headNodGuideBounds &&
        (phase === "running" || phase === "complete") && (
          <HeadNodGuideTriangle
            ref={headNodGuideRef}
            visible={isVisible}
          />
        )}

      {(headTurningMetronome || waistTurningMetronome) &&
        (phase === "running" || phase === "complete") && (
          <HeadTurnGuideTriangle
            ref={headTurnGuideRef}
            visible={isVisible}
          />
        )}

      {showStimulusVideo && stimulusVideoSrc && (
        <video
          ref={stimulusVideoRef}
          src={stimulusVideoSrc}
          muted
          playsInline
          preload="auto"
          className={`absolute inset-0 z-[5] h-full w-full object-cover ${
            phase === "running" ? "block" : "block opacity-80"
          }`}
          onLoadedMetadata={(event) => {
            const duration = event.currentTarget.duration;
            if (Number.isFinite(duration) && duration > 0) {
              onVideoDuration?.(duration);
            }
          }}
        />
      )}

      {showMarker && isVergenceMode && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span
            className="block text-6xl font-extrabold text-blue"
            style={{
              opacity: 0,
              transform: "scale(1)",
              textShadow: "none",
            }}
            aria-hidden="true"
          >
            A
          </span>
        </div>
      )}

      {showMarker &&
        !isVergenceMode &&
        markerPrimary !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-none fixed z-10"
            style={
              isHorizontal
                ? {
                    left: markerPrimary,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "transparent",
                    boxShadow: "none",
                    filter: "none",
                  }
                : {
                    top: markerPrimary,
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "transparent",
                    boxShadow: "none",
                    filter: "none",
                  }
            }
          >
            <span
              className="block text-6xl font-extrabold text-blue"
              style={{
                background: "transparent",
                boxShadow: "none",
                filter: "none",
                textShadow: MARKER_SHADOW,
              }}
            >
              A
            </span>
          </div>,
          document.body,
        )}
    </div>
  );
}
