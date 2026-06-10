import { useEyeTracking } from "@/state";
import { EyePositionChart } from "@/components/charts/EyePositionChart";
import { GazeStabilityChart } from "@/components/charts/GazeStabilityChart";
import { HeadTiltChart } from "@/components/charts/HeadTiltChart";
import "@/components/charts/chartSetup";

type EyeMovementGraphProps = {
  className?: string;
};

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-blue/30 bg-card px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-foreground/60">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-dark-blue">{value}</p>
    </div>
  );
}

/**
 * Real-time eye movement charts and tracking statistics for analytics overlays.
 */
export function EyeMovementGraph({ className = "" }: EyeMovementGraphProps) {
  const { state } = useEyeTracking();
  const {
    samples,
    latestSample,
    recordingStatus,
    pipelineStatus,
    movementRecordCount,
    calibration,
  } = state;

  return (
    <section className={`flex flex-col gap-4 ${className}`}>
      <div className="flex flex-wrap gap-2 text-xs font-medium">
        <span className="rounded-full bg-cyan/15 px-3 py-1 text-cyan">
          Pipeline: {pipelineStatus}
        </span>
        <span className="rounded-full bg-blue/10 px-3 py-1 text-blue">
          Recording: {recordingStatus}
        </span>
        <span className="rounded-full bg-dark-blue/10 px-3 py-1 text-dark-blue">
          Samples: {samples.length}
        </span>
        <span className="rounded-full bg-yellow/30 px-3 py-1 text-dark-blue">
          Movement: {movementRecordCount}
        </span>
        <span className="rounded-full bg-green-500/15 px-3 py-1 text-green-700">
          Calibration: {calibration.isCalibrated ? "Injected" : "Pending"}
        </span>
      </div>

      {latestSample && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Left gaze (H)"
            value={
              latestSample.leftCalibratedOffset && calibration.isCalibrated
                ? `${latestSample.leftCalibratedOffset.horizontalDeg.toFixed(2)}°`
                : latestSample.leftEye.horizontal.toFixed(3)
            }
          />
          <MetricCard
            label="Right gaze (H)"
            value={
              latestSample.rightCalibratedOffset && calibration.isCalibrated
                ? `${latestSample.rightCalibratedOffset.horizontalDeg.toFixed(2)}°`
                : latestSample.rightEye.horizontal.toFixed(3)
            }
          />
          <MetricCard
            label="Stability"
            value={latestSample.gazeStability.toFixed(3)}
          />
          <MetricCard
            label="FOV gaze"
            value={
              latestSample.fovGaze
                ? `${latestSample.fovGaze.x.toFixed(2)}, ${latestSample.fovGaze.y.toFixed(2)}`
                : "Not calibrated"
            }
          />
        </div>
      )}

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <EyePositionChart
          samples={samples}
          isCalibrated={calibration.isCalibrated}
        />
        <GazeStabilityChart samples={samples} />
        <HeadTiltChart samples={samples} className="lg:col-span-2" />
      </div>
    </section>
  );
}
