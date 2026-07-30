"use client";

import type { ReactNode } from "react";
import {
  DEMO_VIDEO_FRAME_WIDTH_CLASS,
  LIVE_PROGRESS_SLOT_CLASS,
  LIVE_VIDEO_FRAME_SIZE_CLASS,
} from "./LiveCameraPageLayout";

type LiveCameraStageFrameProps = {
  /** The live camera video box — defines the column width and viewport center. */
  video: ReactNode;
  /** Rendered above the video box, horizontally centered. Does not shift the video. */
  aboveVideo?: ReactNode;
  /** Rendered 10px below the video box, matching its width. */
  progress?: ReactNode;
  /** Beside the column on wide screens (bottom-aligned with progress); below on narrow. */
  action?: ReactNode;
  /** Optional controls to the left of the video column on wide screens. */
  leftAction?: ReactNode;
  /**
   * Video column size.
   * - `live` (default): 70vw, fills space under title down to progress
   * - `demo`: original max-w-3xl sizing
   */
  frameSize?: "live" | "demo";
  className?: string;
};

export function LiveCameraStageFrame({
  video,
  aboveVideo,
  progress,
  action,
  leftAction,
  frameSize = "live",
  className = "",
}: LiveCameraStageFrameProps) {
  const isLive = frameSize !== "demo";

  if (!isLive) {
    return (
      <div
        className={`relative ${DEMO_VIDEO_FRAME_WIDTH_CLASS} ${className}`}
      >
        {aboveVideo ? (
          <div className="pointer-events-none absolute bottom-[calc(100%+10px)] left-0 w-full text-center">
            {aboveVideo}
          </div>
        ) : null}

        <div className="relative w-full">{video}</div>

        {action || leftAction ? (
          <>
            {leftAction ? (
              <div className="absolute top-[calc(100%+10px)] left-0 flex w-full justify-start min-[1068px]:top-1/2 min-[1068px]:right-[calc(100%+20px)] min-[1068px]:bottom-auto min-[1068px]:left-auto min-[1068px]:w-auto min-[1068px]:-translate-y-1/2 min-[1068px]:justify-start">
                {leftAction}
              </div>
            ) : null}
            {action ? (
              <div className="absolute top-[calc(100%+10px)] left-0 flex w-full justify-end min-[1068px]:top-auto min-[1068px]:bottom-0 min-[1068px]:left-[calc(100%+20px)] min-[1068px]:w-auto min-[1068px]:justify-start">
                {action}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`relative flex h-full min-h-0 w-full flex-col ${className}`}>
      <div className={`relative ${LIVE_VIDEO_FRAME_SIZE_CLASS}`}>
        {aboveVideo ? (
          <div className="pointer-events-none absolute bottom-[calc(100%+10px)] left-0 w-full text-center">
            {aboveVideo}
          </div>
        ) : null}

        <div className="relative h-full w-full">{video}</div>

        {!progress && action ? (
          <div className="absolute bottom-0 left-[calc(100%+20px)] z-30 hidden min-[1068px]:block">
            {action}
          </div>
        ) : null}
        {!progress && leftAction ? (
          <div className="absolute top-1/2 right-[calc(100%+20px)] z-30 hidden -translate-y-1/2 min-[1068px]:block">
            {leftAction}
          </div>
        ) : null}
      </div>

      {/* 10px gap above progress; page padding puts progress 30px from bottom */}
      <div className={`relative mt-[10px] w-full shrink-0 ${LIVE_PROGRESS_SLOT_CLASS}`}>
        {progress ? <div className="w-full">{progress}</div> : null}

        {progress && action ? (
          <div className="mt-[10px] flex justify-end min-[1068px]:absolute min-[1068px]:bottom-0 min-[1068px]:left-[calc(100%+20px)] min-[1068px]:mt-0 min-[1068px]:justify-start">
            {action}
          </div>
        ) : null}

        {!progress && (action || leftAction) ? (
          <div className="mt-[10px] flex w-full items-center justify-between gap-4 min-[1068px]:hidden">
            <div>{leftAction}</div>
            <div className="ml-auto">{action}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
