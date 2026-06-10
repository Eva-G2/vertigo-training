"use client";

import { NurseIllustration } from "./NurseIllustration";

type VideoDemoProps = {
  videoSrc?: string;
};

export function VideoDemo({ videoSrc }: VideoDemoProps) {
  return (
    <div className="flex aspect-[4/3] w-full max-w-3xl items-center justify-center overflow-hidden rounded-[20px] border-[3px] border-blue bg-card">
      {videoSrc ? (
        <video
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      ) : (
        <NurseIllustration />
      )}
    </div>
  );
}
