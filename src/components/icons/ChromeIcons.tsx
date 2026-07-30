"use client";

import Image from "next/image";

type IconProps = {
  src: string;
  alt: string;
  className?: string;
};

function IconImg({ src, alt, className = "h-6 w-6" }: IconProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={24}
      height={24}
      className={`${className} object-contain`}
      style={{ filter: "brightness(0) invert(1)" }}
    />
  );
}

function IconImgDark({ src, alt, className = "h-6 w-6" }: IconProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={24}
      height={24}
      className={`${className} object-contain`}
    />
  );
}

export function LanguageIcon({ theme }: { theme: "light" | "dark" }) {
  return theme === "light" ? (
    <IconImg src="/icons/Language.svg" alt="Language" />
  ) : (
    <IconImgDark src="/icons/Language.svg" alt="Language" />
  );
}

export function SoundOnIcon() {
  return <IconImg src="/icons/Sound_On.svg" alt="Sound on" />;
}

export function SoundOffIcon() {
  return <IconImg src="/icons/Sound_Off.svg" alt="Sound off" />;
}

/** Open eye — bone landmark dots visible. */
export function EyeOpenIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={24}
      height={24}
      className="h-6 w-6"
      aria-hidden="true"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Closed eye — bone landmark dots hidden. */
export function EyeClosedIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={24}
      height={24}
      className="h-6 w-6"
      aria-hidden="true"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function DarkModeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      width={24}
      height={24}
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        fill="#FFF600"
        d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Zm0-80q88 0 158-48.5T740-375q-20 5-40 8t-40 3q-123 0-209.5-86.5T364-660q0-20 3-40t8-40q-78 32-126.5 102T200-480q0 116 82 198t198 82Zm-10-270Z"
      />
    </svg>
  );
}

export function LightModeIcon() {
  return (
    <Image
      src="/icons/Light_mode.svg"
      alt="Light mode"
      width={24}
      height={24}
      className="h-6 w-6 object-contain"
      style={{ filter: "brightness(0) saturate(100%) invert(24%) sepia(90%) saturate(1500%) hue-rotate(210deg)" }}
    />
  );
}

export function CloseIcon({ theme }: { theme: "light" | "dark" }) {
  return theme === "light" ? (
    <IconImg src="/icons/Close.svg" alt="Close" />
  ) : (
    <IconImgDark src="/icons/Close.svg" alt="Close" />
  );
}

export function AppLogo({ theme }: { theme: "light" | "dark" }) {
  return (
    <Image
      src="/icons/Logo.svg"
      alt="Vertigo Training"
      width={40}
      height={40}
      className="h-10 w-10 object-contain"
      style={{
        filter:
          theme === "light"
            ? "brightness(0) saturate(100%) invert(24%) sepia(90%) saturate(1500%) hue-rotate(210deg)"
            : "brightness(0) invert(1)",
      }}
    />
  );
}
