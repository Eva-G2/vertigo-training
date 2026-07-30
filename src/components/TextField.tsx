"use client";

import Image from "next/image";
import { useState, type InputHTMLAttributes } from "react";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
};

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "Insert text here",
  ...props
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const filled = Boolean(value && String(value).length > 0);

  const stateClass = filled
    ? "border-cyan bg-cyan text-dark-blue placeholder:text-dark-blue/60"
    : focused
      ? "border-border ring-2 ring-border/20"
      : "border-border bg-card";

  return (
    <label className="flex w-full flex-col gap-2">
      <span className="text-lg font-bold text-foreground">{label}</span>
      <div className="relative w-full">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`h-[72px] w-full rounded-full border-[3px] px-8 text-lg text-foreground transition-all duration-200 placeholder:text-foreground/40 focus:outline-none ${stateClass}`}
          {...props}
        />
        {filled && (
          <Image
            src="/icons/Check.svg"
            alt=""
            width={28}
            height={28}
            className="pointer-events-none absolute right-5 top-1/2 h-7 w-7 -translate-y-1/2"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        )}
      </div>
    </label>
  );
}
