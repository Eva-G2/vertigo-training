"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CalibrationData } from "@/lib/types";

const initialCalibration: CalibrationData = {
  status: "PENDING",
  kL: null,
  kR: null,
  kLY: null,
  kRY: null,
  leftBaseline: null,
  rightBaseline: null,
};

type TestContextValue = {
  calibration: CalibrationData;
  setCalibration: (data: CalibrationData) => void;
  resetCalibration: () => void;
  isCalibrated: boolean;
};

const TestContext = createContext<TestContextValue | null>(null);

export function TestProvider({ children }: { children: ReactNode }) {
  const [calibration, setCalibrationState] =
    useState<CalibrationData>(initialCalibration);

  const setCalibration = useCallback((data: CalibrationData) => {
    setCalibrationState(data);
  }, []);

  const resetCalibration = useCallback(() => {
    setCalibrationState(initialCalibration);
  }, []);

  const value = useMemo(
    () => ({
      calibration,
      setCalibration,
      resetCalibration,
      isCalibrated: calibration.status === "CALIBRATED",
    }),
    [calibration, resetCalibration, setCalibration],
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
