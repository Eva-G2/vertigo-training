"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CalibrationData, GazeRecenterBaseline } from "@/lib/types";

const initialCalibration: CalibrationData = {
  status: "PENDING",
  kL: null,
  kR: null,
  kLY: null,
  kRY: null,
  leftBaseline: null,
  rightBaseline: null,
  faceTopNormalizedY: null,
  chinNormalizedY: null,
};

type TestContextValue = {
  calibration: CalibrationData;
  setCalibration: (data: CalibrationData) => void;
  resetCalibration: () => void;
  isCalibrated: boolean;
  recenterBaseline: GazeRecenterBaseline | null;
  applyRecenterBaseline: (baseline: GazeRecenterBaseline) => void;
  clearRecenterBaseline: () => void;
};

const TestContext = createContext<TestContextValue | null>(null);

export function TestProvider({ children }: { children: ReactNode }) {
  const [calibration, setCalibrationState] =
    useState<CalibrationData>(initialCalibration);
  const [recenterBaseline, setRecenterBaseline] =
    useState<GazeRecenterBaseline | null>(null);

  const setCalibration = useCallback((data: CalibrationData) => {
    setCalibrationState(data);
  }, []);

  const resetCalibration = useCallback(() => {
    setCalibrationState(initialCalibration);
    setRecenterBaseline(null);
  }, []);

  const applyRecenterBaseline = useCallback((baseline: GazeRecenterBaseline) => {
    setRecenterBaseline(baseline);
  }, []);

  const clearRecenterBaseline = useCallback(() => {
    setRecenterBaseline(null);
  }, []);

  const value = useMemo(
    () => ({
      calibration,
      setCalibration,
      resetCalibration,
      isCalibrated: calibration.status === "CALIBRATED",
      recenterBaseline,
      applyRecenterBaseline,
      clearRecenterBaseline,
    }),
    [
      applyRecenterBaseline,
      calibration,
      clearRecenterBaseline,
      recenterBaseline,
      resetCalibration,
      setCalibration,
    ],
  );

  return (
    <TestContext.Provider value={value}>{children}</TestContext.Provider>
  );
}

export function useTestContext() {
  const ctx = useContext(TestContext);
  if (!ctx) {
    throw new Error("useTestContext must be used within TestProvider");
  }
  return ctx;
}
