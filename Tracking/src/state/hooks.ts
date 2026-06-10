import { useContext } from "react";
import { EyeTrackingContext } from "./EyeTrackingProvider";

export function useEyeTracking() {
  const context = useContext(EyeTrackingContext);
  if (!context) {
    throw new Error("useEyeTracking must be used within EyeTrackingProvider");
  }
  return context;
}
