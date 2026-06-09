type HeadIllustrationProps = {
  angle?: number;
  interactive?: boolean;
  size?: "sm" | "lg";
};

export function HeadIllustration({
  angle = 0,
  interactive = false,
  size = "lg",
}: HeadIllustrationProps) {
  const dim = size === "lg" ? 200 : 120;

  return (
    <div
      className={`relative flex items-center justify-center ${interactive ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={{ width: dim, height: dim }}
    >
      {/* Angle marker A - top */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full border-[3px] border-yellow bg-yellow px-3 py-1 text-sm font-bold text-dark-blue">
        A
      </div>
      {/* Angle marker A - bottom */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-full border-[3px] border-yellow bg-yellow px-3 py-1 text-sm font-bold text-dark-blue">
        A
      </div>

      <div
        className="transition-transform duration-100"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <svg
          width={dim * 0.7}
          height={dim * 0.7}
          viewBox="0 0 140 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse
            cx="70"
            cy="70"
            rx="55"
            ry="65"
            fill="var(--color-cyan)"
            fillOpacity="0.2"
            stroke="var(--color-blue)"
            strokeWidth="3"
          />
          <circle cx="70" cy="55" r="35" fill="var(--color-blue)" fillOpacity="0.15" stroke="var(--color-blue)" strokeWidth="3" />
          <circle cx="55" cy="50" r="5" fill="var(--color-dark-blue)" />
          <circle cx="85" cy="50" r="5" fill="var(--color-dark-blue)" />
          <path
            d="M55 75 Q70 90 85 75"
            stroke="var(--color-dark-blue)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <line
            x1="70"
            y1="20"
            x2="70"
            y2="5"
            stroke="var(--color-cyan)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
