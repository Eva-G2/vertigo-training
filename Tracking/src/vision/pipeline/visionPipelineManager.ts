import { VisionPipeline } from "./VisionPipeline";
import type {
  VisionPipelineCallbacks,
  VisionPipelineConfig,
} from "./types";

let sharedPipeline: VisionPipeline | null = null;
let initPromise: Promise<VisionPipeline> | null = null;
let consumerCount = 0;

export async function acquireVisionPipeline(
  callbacks: VisionPipelineCallbacks,
  config: Partial<VisionPipelineConfig> = {},
): Promise<VisionPipeline> {
  consumerCount += 1;

  if (sharedPipeline) {
    sharedPipeline.setCallbacks(callbacks);
    return sharedPipeline;
  }

  if (!initPromise) {
    initPromise = (async () => {
      const pipeline = new VisionPipeline(callbacks, config);
      await pipeline.initialize();
      sharedPipeline = pipeline;
      return pipeline;
    })().catch((error) => {
      initPromise = null;
      sharedPipeline = null;
      throw error;
    });
  }

  const pipeline = await initPromise;
  pipeline.setCallbacks(callbacks);
  return pipeline;
}

export function releaseVisionPipeline(): void {
  consumerCount = Math.max(0, consumerCount - 1);
  sharedPipeline?.stop();
}

export function getSharedVisionPipeline(): VisionPipeline | null {
  return sharedPipeline;
}
