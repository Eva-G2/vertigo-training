type MediaPipeLoadState = "idle" | "loading" | "ready" | "error";

let loadState: MediaPipeLoadState = "idle";
let loadPromise: Promise<typeof window.FaceMesh> | null = null;

function loadScript(src: string): Promise<void> {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function waitForFaceMesh(): Promise<typeof window.FaceMesh> {
  await loadScript(
    "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js",
  );

  if (!window.FaceMesh) {
    throw new Error("MediaPipe FaceMesh is unavailable on window");
  }

  return window.FaceMesh;
}

export async function loadFaceMesh(): Promise<typeof window.FaceMesh> {
  if (loadState === "ready" && window.FaceMesh) {
    return window.FaceMesh;
  }

  if (loadPromise) return loadPromise;

  loadState = "loading";
  loadPromise = waitForFaceMesh()
    .then((FaceMesh) => {
      loadState = "ready";
      return FaceMesh;
    })
    .catch((error) => {
      loadState = "error";
      loadPromise = null;
      throw error;
    });

  return loadPromise;
}

export function getMediaPipeLoadState(): MediaPipeLoadState {
  return loadState;
}
