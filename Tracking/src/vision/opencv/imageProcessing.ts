import { isOpenCVReady } from "./OpenCVLoader";

export function enhanceFrameForTracking(
  source: HTMLVideoElement | HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
): ImageData | null {
  const context = targetCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  const width = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
  const height =
    source instanceof HTMLVideoElement ? source.videoHeight : source.height;

  if (!width || !height) return null;

  targetCanvas.width = width;
  targetCanvas.height = height;
  context.drawImage(source, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);

  if (!isOpenCVReady() || !window.cv) {
    return imageData;
  }

  const cv = window.cv;
  const src = cv.matFromImageData(imageData);
  const gray = new cv.Mat();
  const enhanced = new cv.Mat();
  const rgba = new cv.Mat();

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.equalizeHist(gray, enhanced);
    cv.cvtColor(enhanced, rgba, cv.COLOR_GRAY2RGBA);
    cv.imshow(targetCanvas, rgba);
    return context.getImageData(0, 0, width, height);
  } finally {
    src.delete();
    gray.delete();
    enhanced.delete();
    rgba.delete();
  }
}
