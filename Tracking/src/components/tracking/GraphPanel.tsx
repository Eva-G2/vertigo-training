import type { ReactNode } from "react";

type GraphPanelProps = {
  title: string;
  /** Shown in brackets to the right of the title. */
  subtitle?: string;
  headerExtra?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function GraphPanel({
  title,
  subtitle,
  headerExtra,
  className = "",
  children,
}: GraphPanelProps) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-3 rounded-2xl border-2 border-blue bg-card p-4 shadow-sm ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-dark-blue">
          {title}
          {subtitle ? (
            <span className="font-normal text-foreground/60"> [{subtitle}]</span>
          ) : null}
        </h3>
        {headerExtra}
      </div>
      {children}
    </div>
  );
}
