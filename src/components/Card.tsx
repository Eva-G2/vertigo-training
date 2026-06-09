import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-[20px] border-[3px] border-border bg-card p-8 ${className}`}
    >
      {children}
    </div>
  );
}
