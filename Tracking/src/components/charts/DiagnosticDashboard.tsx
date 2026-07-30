import { useEyeTracking } from "@/state";
import { DEFAULT_SINE_STIMULUS } from "@/services/processing";
import { TrackingGraph } from "@/components/tracking/TrackingGraph";
import { GazeStabilityChart } from "./GazeStabilityChart";
import { HeadTiltChart } from "./HeadTiltChart";

export function DiagnosticDashboard() {
  const { state, downloadMovementJson } = useEyeTracking();
  const {
    samples,
    latestSample,
    recordingStatus,
    pipelineStatus,
    movementRecordCount,
    verticalPursuitRecordCount,
    pursuitAxis,
  } = state;

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-blue bg-card px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-dark-blue">
            Diagnostic Charts
          </h2>
          <p className="text-sm text-foreground/70">
            Real-time eye-tracking metrics from the vision pipeline
          </p>
        </div>
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
          {verticalPursuitRecordCount > 0 && (
            <span className="rounded-full bg-cyan/15 px-3 py-1 text-cyan">
              Vertical: {verticalPursuitRecordCount}
            </span>
          )}
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue/30 bg-card px-4 py-3">
        <p className="text-xs text-foreground/70">
          Target stimulus: sine wave ({DEFAULT_SINE_STIMULUS.frequencyHz} Hz, ±
          {DEFAULT_SINE_STIMULUS.amplitude} on {DEFAULT_SINE_STIMULUS.oscillationAxis}-axis)
        </p>
        <button
          type="button"
          onClick={downloadMovementJson}
          disabled={movementRecordCount === 0}
          className="rounded-lg bg-blue px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-dark-blue disabled:cursor-not-allowed disabled:opacity-50"
        >
          Export Chart.js JSON
        </button>
      </div>

      {latestSample && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Left corrected (H)"
            value={
              latestSample.leftEyeCorrected
                ? `${latestSample.leftEyeCorrected.horizontal.toFixed(2)}°`
                : latestSample.leftCalibratedOffset && state.calibration.isCalibrated
                  ? `${latestSample.leftCalibratedOffset.horizontalDeg.toFixed(2)}°`
                  : latestSample.leftEye.horizontal.toFixed(3)
            }
          />
          <MetricCard
            label="Right corrected (H)"
            value={
              latestSample.rightEyeCorrected
                ? `${latestSample.rightEyeCorrected.horizontal.toFixed(2)}°`
                : latestSample.rightCalibratedOffset && state.calibration.isCalibrated
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

      <div className="flex min-w-0 flex-col gap-4">
        <TrackingGraph axis="vertical" exerciseMode={pursuitAxis} />
        <TrackingGraph axis="horizontal" exerciseMode={pursuitAxis} />
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <GazeStabilityChart samples={samples} />
          <HeadTiltChart samples={samples} />
        </div>
      </div>
    </section>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
};

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-blue/30 bg-card px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-foreground/60">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-dark-blue">{value}</p>
    </div>
  );
}
