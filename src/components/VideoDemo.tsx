"use client";

import { NurseIllustration } from "./NurseIllustration";

type VideoDemoProps = {
  videoSrc?: string;
  /** Stage 2: 20% zoom + dark-mode colour invert */
  stage2Media?: boolean;
  /** Stage 3 body demos: horizontal flip correction */
  stage3Media?: boolean;
};

export function VideoDemo({
  videoSrc,
  stage2Media = false,
  stage3Media = false,
}: VideoDemoProps) {
  const videoClassName = [
    "h-full w-full object-cover",
    stage3Media ? "-scale-x-100" : "",
    stage2Media ? "stage2-demo-video-zoom stage2-demo-media" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[20px] border-[3px] border-blue bg-card">
      {videoSrc ? (
        <video
          key={videoSrc}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className={videoClassName}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <NurseIllustration />
        </div>
      )}
    </div>
  );
}
