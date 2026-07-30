"use client";

import { useCallback } from "react";
import type { GazeRecenterBaseline } from "@/lib/types";
import { useTestContext } from "@/components/providers/TestContext";
import { useEyeTracking } from "@/state";

/**
 * Captures live gaze/head offsets at the current fixation pose, applies them
 * to the active tracking service, and persists them in TestContext.
 */
export function useGazeRecenterBaseline() {
  const { recenterTracking } = useEyeTracking();
  const { applyRecenterBaseline: storeRecenterBaseline, recenterBaseline: storedBaseline } =
    useTestContext();

  const captureRecenterBaseline = useCallback((): GazeRecenterBaseline | null => {
    const baseline = recenterTracking();
    if (!baseline) {
      return null;
    }

    storeRecenterBaseline(baseline);
    return baseline;
  }, [recenterTracking, storeRecenterBaseline]);

  return {
    captureRecenterBaseline,
    storedRecenterBaseline: storedBaseline,
  };
}
