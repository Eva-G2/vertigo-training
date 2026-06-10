type OpenCVLoadState = "idle" | "loading" | "ready" | "error";

let loadState: OpenCVLoadState = "idle";
let loadPromise: Promise<void> | null = null;

function waitForOpenCV(): Promise<void> {
  if (window.cv?.Mat) {
    loadState = "ready";
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("OpenCV.js failed to load within 30 seconds"));
    }, 30_000);

    const checkReady = () => {
      if (window.cv?.Mat) {
        window.clearTimeout(timeout);
        loadState = "ready";
        resolve();
        return;
      }

      if (window.cv) {
        window.cv.onRuntimeInitialized = () => {
          window.clearTimeout(timeout);
          loadState = "ready";
          resolve();
        };
        return;
      }

      window.setTimeout(checkReady, 100);
    };

    checkReady();
  });
}

export async function loadOpenCV(): Promise<void> {
  if (loadState === "ready") return;
  if (loadPromise) return loadPromise;

  loadState = "loading";
  loadPromise = waitForOpenCV().catch((error) => {
    loadState = "error";
    loadPromise = null;
    throw error;
  });

  return loadPromise;
}

export function getOpenCVLoadState(): OpenCVLoadState {
  return loadState;
}

export function isOpenCVReady(): boolean {
  return loadState === "ready" && Boolean(window.cv?.Mat);
}
