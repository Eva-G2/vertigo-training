"use client";

import type { Ref } from "react";
import { STAGE3_STEP1_FOLLOW_VIDEO_SRC } from "@/lib/stage3Steps";

type Stage3FollowVideoProps = {
  videoRef: Ref<HTMLVideoElement>;
};

/**
 * S3S1 training-only follow-along clip, floated to the left of the live camera.
 */
export function Stage3FollowVideo({ videoRef }: Stage3FollowVideoProps) {
  return (
    <div className="pointer-events-none absolute top-1/2 left-0 z-20 h-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[20px] border-[3px] border-blue bg-card shadow-md">
      <video
        ref={videoRef}
        src={STAGE3_STEP1_FOLLOW_VIDEO_SRC}
        muted
        playsInline
        loop
        preload="auto"
        className="h-full w-auto max-w-none object-cover"
      />
    </div>
  );
}
