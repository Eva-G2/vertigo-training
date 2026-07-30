"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useApp } from "./providers/AppProvider";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "selected";
  label: ReactNode;
  fullWidth?: boolean;
  align?: "left" | "center" | "right";
  pill?: boolean;
};

export function Button({
  variant = "primary",
  label,
  fullWidth = false,
  align = "center",
  pill = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const { state } = useApp();
  const isDark = state.theme === "dark";

  const base = `inline-flex h-[80px] min-w-[200px] items-center justify-center ${pill ? "rounded-full" : "rounded-[20px]"} border-[3px] px-8 text-xl font-bold transition-all duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50`;

  const variants = {
    primary: isDark
      ? "border-yellow bg-card text-yellow hover:bg-yellow hover:text-[#111D4D]"
      : "border-blue bg-card text-blue hover:bg-blue hover:text-white",
    secondary: isDark
      ? "border-yellow bg-card text-yellow hover:bg-yellow hover:text-[#111D4D]"
      : "border-blue bg-card text-blue hover:bg-blue hover:text-white",
    selected:
      "border-cyan bg-cyan text-white hover:bg-cyan/90",
  };

  const alignClass =
    align === "right"
      ? "self-end"
      : align === "left"
        ? "self-start"
        : "";

  return (
    <button
      type="button"
      disabled={disabled}
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${alignClass} ${className}`}
      {...props}
    >
      {label}
    </button>
  );
}
