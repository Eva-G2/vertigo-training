/**
 * Resolves once the video element has metadata and non-zero frame dimensions.
 * Chrome often needs this before MediaPipe can read frames reliably.
 */
export async function waitForVideoFrame(
  video: HTMLVideoElement,
): Promise<void> {
  if (
    video.readyState >= HTMLMediaElement.HAVE_METADATA &&
    video.videoWidth > 0 &&
    video.videoHeight > 0
  ) {
    return;
  }

  await new Promise<void>((resolve) => {
    const check = () => {
      if (
        video.readyState >= HTMLMediaElement.HAVE_METADATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        video.removeEventListener("loadedmetadata", check);
        video.removeEventListener("resize", check);
        resolve();
      }
    };

    video.addEventListener("loadedmetadata", check);
    video.addEventListener("resize", check);
    check();
  });
}
