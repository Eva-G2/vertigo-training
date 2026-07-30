import { forwardRef } from "react";

const DEFAULT_GUIDE_COLOR = "#10A69C";

type HeadNodGuideTriangleProps = {
  visible?: boolean;
  color?: string;
  className?: string;
};

export const HeadNodGuideTriangle = forwardRef<
  HTMLDivElement,
  HeadNodGuideTriangleProps
>(function HeadNodGuideTriangle(
  { visible = true, color = DEFAULT_GUIDE_COLOR, className = "" },
  ref,
) {
  if (!visible) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute left-3 z-20 -translate-y-1/2 ${className}`}
      style={{ top: "50%" }}
      aria-hidden="true"
    >
      <svg
        width="33"
        height="39"
        viewBox="0 0 22 26"
        className="drop-shadow-sm"
      >
        <polygon points="0,0 22,13 0,26" fill={color} />
      </svg>
    </div>
  );
});
