import type { Results } from "@mediapipe/face_mesh";

export const FACE_MESH_VERSION = "0.4.1633559619";

export type FaceMeshRuntimeOptions = {
  refineLandmarks?: boolean;
  maxNumFaces?: number;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  selfieMode?: boolean;
};

type FaceMeshInstance = InstanceType<typeof window.FaceMesh>;

function resolveAssetBase(): string {
  const useLocalAssets =
    typeof process !== "undefined" &&
    process.env.NODE_ENV === "development" &&
    typeof window !== "undefined" &&
    window.location.hostname === "localhost" &&
    window.location.port === "5173";

  return useLocalAssets
    ? "/mediapipe/face_mesh"
    : `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${FACE_MESH_VERSION}`;
}

let scriptPromise: Promise<typeof window.FaceMesh> | null = null;

function loadFaceMeshScript(): Promise<typeof window.FaceMesh> {
  if (window.FaceMesh) {
    return Promise.resolve(window.FaceMesh);
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const assetBase = resolveAssetBase();
    const existing = document.querySelector(`script[data-face-mesh="${assetBase}"]`);
    if (existing) {
      if (window.FaceMesh) {
        resolve(window.FaceMesh);
        return;
      }

      existing.addEventListener("load", () => {
        if (window.FaceMesh) {
          resolve(window.FaceMesh);
        } else {
          reject(new Error("MediaPipe FaceMesh is unavailable on window"));
        }
      });
      existing.addEventListener("error", () => {
        reject(new Error("Failed to load MediaPipe FaceMesh script"));
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `${assetBase}/face_mesh.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.faceMesh = assetBase;
    script.onload = () => {
      if (window.FaceMesh) {
        resolve(window.FaceMesh);
      } else {
        scriptPromise = null;
        reject(new Error("MediaPipe FaceMesh is unavailable on window"));
      }
    };
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load MediaPipe FaceMesh script"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

let faceMeshInstance: FaceMeshInstance | null = null;
let initPromise: Promise<FaceMeshInstance> | null = null;
let pendingResolve: ((results: Results) => void) | null = null;
let sendInFlight = false;
const FRAME_TIMEOUT_MS = 5000;

export async function acquireFaceMesh(
  options: FaceMeshRuntimeOptions = {},
): Promise<FaceMeshInstance> {
  if (faceMeshInstance) {
    return faceMeshInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const FaceMesh = await loadFaceMeshScript();
    const assetBase = resolveAssetBase();
    const faceMesh = new FaceMesh({
      locateFile: (file) => `${assetBase}/${file}`,
    });

    faceMesh.setOptions({
      refineLandmarks: options.refineLandmarks ?? true,
      maxNumFaces: options.maxNumFaces ?? 1,
      minDetectionConfidence: options.minDetectionConfidence ?? 0.5,
      minTrackingConfidence: options.minTrackingConfidence ?? 0.5,
      enableFaceGeometry: false,
      selfieMode: options.selfieMode ?? true,
    });

    faceMesh.onResults((results) => {
      pendingResolve?.(results);
      pendingResolve = null;
    });

    await faceMesh.initialize();
    faceMeshInstance = faceMesh;
    return faceMesh;
  })().catch((error) => {
    initPromise = null;
    faceMeshInstance = null;
    throw error;
  });

  return initPromise;
}

export async function sendFaceMeshFrame(
  image: HTMLVideoElement | HTMLCanvasElement,
): Promise<Results | null> {
  if (sendInFlight) {
    return null;
  }

  sendInFlight = true;

  try {
    const faceMesh = await acquireFaceMesh();

    return await new Promise<Results>((resolve, reject) => {
      let settled = false;

      const timeoutId = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        pendingResolve = null;
        reject(new Error("FaceMesh frame timed out"));
      }, FRAME_TIMEOUT_MS);

      pendingResolve = (results) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        resolve(results);
      };

      void faceMesh.send({ image }).catch((error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        pendingResolve = null;
        reject(error);
      });
    });
  } finally {
    sendInFlight = false;
  }
}
