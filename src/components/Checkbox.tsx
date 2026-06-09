"use client";

import Image from "next/image";
import type { InputHTMLAttributes } from "react";
import { useApp } from "./providers/AppProvider";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export function Checkbox({ label, checked, onChange, ...props }: CheckboxProps) {
  const { state } = useApp();
  const isDark = state.theme === "dark";
  const iconFilter = isDark
    ? "brightness(0) saturate(100%) invert(88%) sepia(60%) saturate(1200%) hue-rotate(10deg)"
    : "brightness(0) saturate(100%) invert(24%) sepia(90%) saturate(1500%) hue-rotate(210deg)";

  return (
    <label className="flex cursor-pointer items-start gap-3">
      <span className="relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
          {...props}
        />
        <Image
          src="/icons/Check_box.svg"
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 peer-checked:hidden"
          style={{ filter: iconFilter }}
        />
        <Image
          src="/icons/Check.svg"
          alt=""
          width={24}
          height={24}
          className="hidden h-6 w-6 peer-checked:block"
          style={{ filter: iconFilter }}
        />
      </span>
      <span className="text-sm leading-relaxed text-foreground">{label}</span>
    </label>
  );
}
