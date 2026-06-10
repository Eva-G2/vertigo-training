import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const faceMeshAssetDir = path.resolve(
  rootDir,
  "node_modules/@mediapipe/face_mesh",
);

function serveFaceMeshAssets(basePath: string) {
  return (req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse, next: () => void) => {
    const requestPath = req.url?.split("?")[0] ?? "";
    const relativePath = requestPath.replace(basePath, "");
    const filePath = path.join(faceMeshAssetDir, relativePath);

    if (!filePath.startsWith(faceMeshAssetDir) || !fs.existsSync(filePath)) {
      next();
      return;
    }

    const extension = path.extname(filePath);
    if (extension === ".wasm") {
      res.setHeader("Content-Type", "application/wasm");
    } else if (extension === ".js") {
      res.setHeader("Content-Type", "text/javascript");
    } else if (extension === ".data") {
      res.setHeader("Content-Type", "application/octet-stream");
    }

    fs.createReadStream(filePath).pipe(res);
  };
}

function mediapipeAssetsPlugin(): Plugin {
  const basePath = "/mediapipe/face_mesh";

  return {
    name: "mediapipe-face-mesh-assets",
    configureServer(server) {
      server.middlewares.use(basePath, serveFaceMeshAssets(basePath));
    },
    configurePreviewServer(server) {
      server.middlewares.use(basePath, serveFaceMeshAssets(basePath));
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), mediapipeAssetsPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
});
