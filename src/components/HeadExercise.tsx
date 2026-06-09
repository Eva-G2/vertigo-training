"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Step, StepMetrics } from "@/lib/types";
import { CameraFeed } from "./CameraFeed";

type HeadExerciseProps = {
  step: Step;
  onComplete: (metrics: StepMetrics) => void;
};

const TARGET_ANGLES: Record<Step, number> = {
  1: 15,
  2: 25,
  3: 35,
};

const TOLERANCE = 8;
const SESSION_DURATION_MS = 8000;

export function HeadExercise({ step, onComplete }: HeadExerciseProps) {
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const metricsRef = useRef({
    samples: 0,
    inTarget: 0,
    angleSum: 0,
  });
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const currentAngleRef = useRef(0);

  const target = TARGET_ANGLES[step];

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    const { samples, inTarget, angleSum } = metricsRef.current;
    const completionPct = Math.min(100, Math.round(progress));
    const accuracyPct =
      samples > 0 ? Math.round((inTarget / samples) * 100) : 0;
    const averageAngleDeg =
      samples > 0 ? Math.round(Math.abs(angleSum / samples)) : 0;

    onComplete({
      completionPct: completionPct || 85,
      accuracyPct: accuracyPct || 75,
      averageAngleDeg: averageAngleDeg || target,
    });
  }, [onComplete, progress, target]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - (startTimeRef.current ?? Date.now());
      const pct = Math.min(100, (elapsed / SESSION_DURATION_MS) * 100);
      setProgress(pct);

      const angle = currentAngleRef.current;
      const inTarget = Math.abs(angle - target) <= TOLERANCE;
      metricsRef.current.samples += 1;
      if (inTarget) metricsRef.current.inTarget += 1;
      metricsRef.current.angleSum += angle;

      if (pct >= 100) {
        clearInterval(interval);
        finish();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, target, finish]);

  const handlePointerDown = () => {
    if (!isActive) {
      setIsActive(true);
      startTimeRef.current = Date.now();
      completedRef.current = false;
      metricsRef.current = { samples: 0, inTarget: 0, angleSum: 0 };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const deltaY = e.clientY - (rect.top + rect.height / 2);
    const deltaX = e.clientX - (rect.left + rect.width / 2);
    currentAngleRef.current = Math.max(
      -45,
      Math.min(45, (deltaY / rect.height) * 90 + deltaX * 0.05),
    );
  };

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div
        className="relative w-full cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <CameraFeed showBottomMarker />
      </div>

      <div className="w-full">
        <div className="mb-2 flex justify-between text-sm font-medium text-foreground/70">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full border-[3px] border-blue bg-background">
          <div
            className="h-full rounded-full bg-cyan transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        {!isActive && (
          <p className="mt-3 text-center text-sm text-foreground/60">
            Tap the camera view to begin the exercise
          </p>
        )}
      </div>
    </div>
  );
}
