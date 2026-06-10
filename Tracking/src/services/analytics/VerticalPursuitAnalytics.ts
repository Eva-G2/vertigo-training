import type { EyeTrackingSample } from "@/types/eye-tracking";

export type VerticalPursuitRecord = {
  timestamp: number;
  targetY: number;
  eyeY: number;
};

export type VerticalPursuitDataset = {
  records: VerticalPursuitRecord[];
  startedAt: number;
  endedAt: number;
};

/** Maps viewport pixel Y to a normalized vertical axis (-1 top, 0 center, 1 bottom). */
export function normalizeViewportY(
  pixelY: number,
  viewportHeight: number,
): number | null {
  if (!Number.isFinite(pixelY) || viewportHeight <= 0) {
    return null;
  }

  return (pixelY / viewportHeight - 0.5) * 2;
}

/**
 * Collects synchronized target/eye vertical samples while smooth pursuit is active.
 */
export class VerticalPursuitAnalytics {
  private active = false;
  private records: VerticalPursuitRecord[] = [];
  private getTargetY: (() => number | null) | null = null;
  private startedAt = 0;
  private endedAt = 0;

  start(getTargetY: () => number | null): void {
    this.active = true;
    this.records = [];
    this.getTargetY = getTargetY;
    this.startedAt = performance.now();
    this.endedAt = 0;
  }

  stop(): VerticalPursuitDataset {
    this.active = false;
    this.endedAt = performance.now();
    this.getTargetY = null;

    return {
      records: this.records,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
    };
  }

  isActive(): boolean {
    return this.active;
  }

  record(sample: EyeTrackingSample): VerticalPursuitRecord | null {
    if (!this.active || !sample.faceDetected) {
      return null;
    }

    const eyeY = sample.fovGaze?.y;
    if (eyeY == null || !Number.isFinite(eyeY)) {
      return null;
    }

    const targetY = this.getTargetY?.();
    if (targetY == null || !Number.isFinite(targetY)) {
      return null;
    }

    const entry: VerticalPursuitRecord = {
      timestamp: sample.timestamp,
      targetY,
      eyeY,
    };
    this.records.push(entry);
    return entry;
  }

  getRecords(): VerticalPursuitRecord[] {
    return this.records;
  }
}
