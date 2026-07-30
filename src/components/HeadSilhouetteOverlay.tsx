"use client";

import { useApp } from "./providers/AppProvider";

type HeadSilhouetteOverlayProps = {
  showBottomMarker?: boolean;
  useHeadIcon?: boolean;
};

export function HeadSilhouetteOverlay({
  showBottomMarker = false,
  useHeadIcon = false,
}: HeadSilhouetteOverlayProps) {
  const { state } = useApp();
  const markerColor =
    state.theme === "dark" ? "var(--overlay-marker)" : "var(--overlay-marker)";

  return (
    <div className="pointer-events-none absolute inset-0">
      {!useHeadIcon && (
        <div
          className="absolute top-[12%] left-1/2 -translate-x-1/2 text-5xl font-bold drop-shadow-md"
          style={{ color: markerColor }}
        >
          A
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element -- SVG asset from /public */}
      <img
        src="/icons/Head.svg"
        alt=""
        className="absolute top-[20%] bottom-0 left-1/2 h-[80%] w-auto max-w-none -translate-x-1/2 object-contain object-bottom"
        aria-hidden="true"
      />

      {showBottomMarker && (
        <div
          className="absolute bottom-[12%] left-1/2 -translate-x-1/2 text-5xl font-bold drop-shadow-md"
          style={{ color: markerColor }}
        >
          A
        </div>
      )}
    </div>
  );
}
