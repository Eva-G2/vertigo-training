"use client";

import type { ReactNode } from "react";

/** Live webcam video column width. Height fills space between title and progress. */
export const LIVE_VIDEO_FRAME_SIZE_CLASS = "h-full min-h-0 w-[70vw]";
/** Demo pages: original fixed max width (aspect ratio on the video box). */
export const DEMO_VIDEO_FRAME_WIDTH_CLASS = "w-full max-w-3xl";
/** Inner live video box fills the live frame. */
export const LIVE_VIDEO_FILL_CLASS = "h-full w-full";
/**
 * Reserved height for the training progress row (label + gap + bar),
 * so calibration video aligns with training video when progress is absent.
 */
export const LIVE_PROGRESS_SLOT_CLASS = "min-h-[44px]";

type LiveCameraPageLayoutProps = {
  title: ReactNode;
  titleClassName?: string;
  titleContainerClassName?: string;
  /** Optional content below the floating title (e.g. instructions). */
  subtitle?: ReactNode;
  /** Centered live-camera stage (video, progress, and action). */
  video: ReactNode;
  /**
   * Video column size.
   * - `live` (default): 70vw, height from 30px under title to above progress
   * - `demo`: original max-w-3xl sizing
   */
  frameSize?: "live" | "demo";
};

export function LiveCameraPageLayout({
  title,
  titleClassName = "",
  titleContainerClassName = "px-[40px]",
  subtitle,
  video,
  frameSize = "live",
}: LiveCameraPageLayoutProps) {
  const isDemo = frameSize === "demo";

  if (isDemo) {
    return (
      <>
        <div
          className={`pointer-events-none fixed top-[50px] right-0 left-0 z-30 ${titleContainerClassName}`}
        >
          <h1
            className={`text-3xl font-bold text-foreground ${titleClassName}`}
          >
            {title}
          </h1>
          {subtitle ? <div className="pt-4">{subtitle}</div> : null}
        </div>

        <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-[40px]">
          <div
            className={`pointer-events-auto ${DEMO_VIDEO_FRAME_WIDTH_CLASS}`}
          >
            {video}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col pb-[30px] pt-[50px]">
      <div
        className={`pointer-events-none shrink-0 ${titleContainerClassName}`}
      >
        <h1
          className={`text-3xl font-bold text-foreground ${titleClassName}`}
        >
          {title}
        </h1>
        {subtitle ? <div className="pt-4">{subtitle}</div> : null}
      </div>

      <div className="mt-[30px] flex min-h-0 flex-1 flex-col items-center px-[40px]">
        <div className="pointer-events-auto flex h-full min-h-0 w-[70vw] flex-col">
          {video}
        </div>
      </div>
    </div>
  );
}
