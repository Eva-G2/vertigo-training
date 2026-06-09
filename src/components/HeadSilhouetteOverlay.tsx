"use client";

import { useApp } from "./providers/AppProvider";

type HeadSilhouetteOverlayProps = {
  showBottomMarker?: boolean;
};

export function HeadSilhouetteOverlay({
  showBottomMarker = false,
}: HeadSilhouetteOverlayProps) {
  const { state } = useApp();
  const markerColor =
    state.theme === "dark" ? "var(--overlay-marker)" : "var(--overlay-marker)";

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {/* Top A marker */}
      <div
        className="absolute top-[12%] text-5xl font-bold drop-shadow-md"
        style={{ color: markerColor }}
      >
        A
      </div>

      {/* Dashed silhouette */}
      <svg
        viewBox="0 0 200 280"
        className="h-[70%] w-auto max-w-[55%]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <ellipse
          cx="100"
          cy="75"
          rx="55"
          ry="65"
          stroke="white"
          strokeWidth="3"
          strokeDasharray="10 8"
        />
        <path
          d="M45 145 Q100 200 155 145 L155 260 Q100 280 45 260 Z"
          stroke="white"
          strokeWidth="3"
          strokeDasharray="10 8"
        />
      </svg>

      {/* Bottom A marker (training steps) */}
      {showBottomMarker && (
        <div
          className="absolute bottom-[12%] text-5xl font-bold drop-shadow-md"
          style={{ color: markerColor }}
        >
          A
        </div>
      )}
    </div>
  );
}
