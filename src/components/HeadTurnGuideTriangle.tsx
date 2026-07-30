import { forwardRef } from "react";

const DEFAULT_GUIDE_COLOR = "#10A69C";

type HeadTurnGuideTriangleProps = {
  visible?: boolean;
  color?: string;
  className?: string;
};

export const HeadTurnGuideTriangle = forwardRef<
  HTMLDivElement,
  HeadTurnGuideTriangleProps
>(function HeadTurnGuideTriangle(
  { visible = true, color = DEFAULT_GUIDE_COLOR, className = "" },
  ref,
) {
  if (!visible) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute z-20 -translate-x-1/2 ${className}`}
      style={{ left: "50%" }}
      aria-hidden="true"
    >
      <svg
        width="33"
        height="39"
        viewBox="0 0 22 26"
        className="drop-shadow-sm"
      >
        <polygon points="11,26 0,0 22,0" fill={color} />
      </svg>
    </div>
  );
});
