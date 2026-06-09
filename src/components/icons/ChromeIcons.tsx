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

export function DarkModeIcon() {
  return (
    <Image
      src="/icons/Dark_mode.svg"
      alt="Dark mode"
      width={24}
      height={24}
      className="h-6 w-6 object-contain"
      style={{ filter: "sepia(1) saturate(5) hue-rotate(10deg) brightness(1.2)" }}
    />
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
