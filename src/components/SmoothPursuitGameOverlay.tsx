"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { normalizeViewportY } from "@/services/analytics";
import { useEyeTracking } from "@/state";
import { useApp } from "./providers/AppProvider";
import { Button } from "./Button";
import { t } from "@/lib/i18n";
import {
  buildSmoothPursuitChirp,
  computeSmoothPursuitY,
  DEFAULT_SMOOTH_PURSUIT_CHIRP,
  getCompletedCycles,
} from "@/lib/smoothPursuitPath";

type GamePhase =
  | "idle"
  | "countdown"
  | "anchor"
  | "running"
  | "centering"
  | "complete";

type SmoothPursuitGameOverlayProps = {
  onRecordingStart: () => void;
  onSessionEnd: () => void;
  onProgress: (pct: number) => void;
  onVisibleChange?: (visible: boolean) => void;
  onRegisterHide?: (hide: () => void) => void;
};

const COUNTDOWN_INTERVAL_MS = 500;
const COUNTDOWN_STEPS = ["ready", "3", "2", "1", "go"] as const;
const MARKER_SHADOW = "2px 5px 6px rgba(0, 0, 0, 0.5)";
const CENTERING_DURATION_MS = 300;

export function SmoothPursuitGameOverlay({
  onRecordingStart,
  onSessionEnd,
  onProgress,
  onVisibleChange,
  onRegisterHide,
}: SmoothPursuitGameOverlayProps) {
  const { state } = useApp();
  const { locale, theme } = state;
  const isDark = theme === "dark";
  const { startTrackingAnalytics, stopTrackingAnalytics } = useEyeTracking();
  const containerRef = useRef<HTMLDivElement>(null);
  const animationStartRef = useRef<number | null>(null);
  const markerTopRef = useRef<number | null>(null);
  const wasAnimatingRef = useRef(false);
  const chirpParamsRef = useRef<ReturnType<typeof buildSmoothPursuitChirp> | null>(
    null,
  );
  const completedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const centeringFromRef = useRef(0);
  const centeringStartRef = useRef(0);

  const [phase, setPhase] = useState<GamePhase>("idle");
  const [countdownIndex, setCountdownIndex] = useState(0);
  const [markerTop, setMarkerTop] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const hideTracking = useCallback(() => {
    clearTimers();
    setIsAnimating(false);
    setIsVisible(false);
    onVisibleChange?.(false);
  }, [clearTimers, onVisibleChange]);

  const getViewportHeight = useCallback(() => {
    return window.innerHeight;
  }, []);

  const updateMarkerTop = useCallback((top: number) => {
    markerTopRef.current = top;
    setMarkerTop(top);
  }, []);

  const centerMarker = useCallback(() => {
    updateMarkerTop(getViewportHeight() / 2);
  }, [getViewportHeight, updateMarkerTop]);

  const getTargetYPosition = useCallback(() => {
    const top = markerTopRef.current;
    if (top == null) {
      return null;
    }

    return normalizeViewportY(top, window.innerHeight);
  }, []);

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

  const handleStart = useCallback(() => {
    clearTimers();
    completedRef.current = false;
    animationStartRef.current = null;
    chirpParamsRef.current = buildSmoothPursuitChirp(getViewportHeight());
    centerMarker();
    setCountdownIndex(0);
    setIsAnimating(false);
    setPhase("countdown");

    COUNTDOWN_STEPS.forEach((_, index) => {
      if (index === 0) return;
      schedule(() => setCountdownIndex(index), index * COUNTDOWN_INTERVAL_MS);
    });

    const goIndex = COUNTDOWN_STEPS.indexOf("go");

    schedule(() => {
      setPhase("anchor");
      setCountdownIndex(0);
      centerMarker();
    }, (goIndex + 1) * COUNTDOWN_INTERVAL_MS);

    schedule(() => {
      animationStartRef.current = performance.now();
      chirpParamsRef.current = buildSmoothPursuitChirp(getViewportHeight());
      setIsAnimating(true);
      setPhase("running");
    }, (goIndex + 1) * COUNTDOWN_INTERVAL_MS + DEFAULT_SMOOTH_PURSUIT_CHIRP.postGoDelayMs);
  }, [centerMarker, clearTimers, getViewportHeight, schedule]);

  useEffect(() => {
    centerMarker();
  }, [centerMarker]);

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
    onVisibleChange?.(isVisible);
  }, [isVisible, onVisibleChange]);

  useEffect(() => {
    onRegisterHide?.(hideTracking);
  }, [hideTracking, onRegisterHide]);

  useEffect(() => {
    if (isAnimating) {
      startTrackingAnalytics(getTargetYPosition);
      onRecordingStart();
      wasAnimatingRef.current = true;
      return;
    }

    if (wasAnimatingRef.current) {
      stopTrackingAnalytics();
      wasAnimatingRef.current = false;
    }
  }, [
    getTargetYPosition,
    isAnimating,
    onRecordingStart,
    startTrackingAnalytics,
    stopTrackingAnalytics,
  ]);

  useEffect(() => {
    if (phase !== "running") return;

    let frameId = 0;
    const { totalCycles } = DEFAULT_SMOOTH_PURSUIT_CHIRP;

    const tick = (now: number) => {
      const params =
        chirpParamsRef.current ?? buildSmoothPursuitChirp(getViewportHeight());
      const animationStart = animationStartRef.current ?? now;
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
        centeringFromRef.current = computeSmoothPursuitY(elapsedSeconds, params);
        centeringStartRef.current = now;
        onProgress(100);
        setIsAnimating(false);
        setPhase("centering");
        return;
      }

      updateMarkerTop(computeSmoothPursuitY(elapsedSeconds, params));
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [getViewportHeight, onProgress, phase, updateMarkerTop]);

  useEffect(() => {
    if (phase !== "centering") return;

    let frameId = 0;
    const targetY = getViewportHeight() / 2;
    const fromY = centeringFromRef.current;

    const tick = (now: number) => {
      const elapsed = now - centeringStartRef.current;
      const progress = Math.min(1, elapsed / CENTERING_DURATION_MS);
      const eased = progress * (2 - progress);

      updateMarkerTop(fromY + (targetY - fromY) * eased);

      if (progress >= 1) {
        updateMarkerTop(targetY);
        setPhase("complete");
        onSessionEnd();
        return;
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [getViewportHeight, onSessionEnd, phase, updateMarkerTop]);

  const showCountdown = isVisible && phase === "countdown";
  const showMarker =
    isVisible &&
    (phase === "idle" ||
      phase === "anchor" ||
      phase === "running" ||
      phase === "centering" ||
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
      {phase === "idle" && (
        <div className="absolute inset-x-0 top-0 z-20 flex w-full flex-col items-center">
          <div
            className={`w-full px-8 py-5 text-center text-2xl font-bold ${
              isDark ? "bg-background/80 text-yellow" : "bg-blue/80 text-white"
            }`}
          >
            {t(locale, "trackAInstruction")}
          </div>
          <div className="mt-6">
            <Button label={t(locale, "start")} onClick={handleStart} />
          </div>
        </div>
      )}

      {showCountdown && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/25">
          <p className="text-6xl font-extrabold tracking-tight text-yellow [text-shadow:none]">
            {getCountdownLabel(COUNTDOWN_STEPS[countdownIndex])}
          </p>
        </div>
      )}

      {showMarker &&
        markerTop !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-none fixed left-1/2 z-[100]"
            style={{
              top: markerTop,
              transform: "translate(-50%, -50%)",
              background: "transparent",
              boxShadow: "none",
              filter: "none",
            }}
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
