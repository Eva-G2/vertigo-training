import { useEyeTracking } from "@/state";
import { CombinedHeadMovementGraph } from "./CombinedHeadMovementGraph";
import { ShoulderMovementGraph } from "./ShoulderMovementGraph";
import { TrackingGraph } from "./TrackingGraph";
import { useTrackingDataStream } from "./trackingDataStream";
import { type AnalyticsCopy, DEFAULT_ANALYTICS_COPY } from "./analyticsCopy";
import "@/components/charts/chartSetup";

type EyeMovementGraphProps = {
  className?: string;
  copy?: AnalyticsCopy;
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
export function EyeMovementGraph({
  className = "",
  copy = DEFAULT_ANALYTICS_COPY,
}: EyeMovementGraphProps) {
  const { state } = useEyeTracking();
  const trackingDataStream = useTrackingDataStream();
  const {
    latestSample,
    recordingStatus,
    pipelineStatus,
    movementRecordCount,
    verticalPursuitRecordCount,
    calibration,
    pursuitAxis,
    samples,
  } = state;

  return (
    <section className={`flex flex-col gap-4 ${className}`}>
      <div className="flex flex-wrap gap-2 text-xs font-medium">
        <span className="rounded-full bg-cyan/15 px-3 py-1 text-cyan">
          {copy.pipeline}: {pipelineStatus}
        </span>
        <span className="rounded-full bg-blue/10 px-3 py-1 text-blue">
          {copy.recording}: {recordingStatus}
        </span>
        <span className="rounded-full bg-dark-blue/10 px-3 py-1 text-dark-blue">
          {copy.samples}: {samples.length}
        </span>
        <span className="rounded-full bg-yellow/30 px-3 py-1 text-dark-blue">
          {copy.movement}: {movementRecordCount}
        </span>
        {verticalPursuitRecordCount > 0 && (
          <span className="rounded-full bg-cyan/15 px-3 py-1 text-cyan">
            {pursuitAxis === "vergence"
              ? `${copy.vergence}: ${verticalPursuitRecordCount}`
              : `${copy.vertical}: ${verticalPursuitRecordCount}`}
          </span>
        )}
        <span className="rounded-full bg-green-500/15 px-3 py-1 text-green-700">
          {copy.calibration}:{" "}
          {calibration.isCalibrated ? copy.injected : copy.pending}
        </span>
      </div>

      {latestSample && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label={copy.leftCorrectedH}
            value={
              latestSample.leftEyeCorrected
                ? `${latestSample.leftEyeCorrected.horizontal.toFixed(2)}°`
                : latestSample.leftCalibratedOffset && calibration.isCalibrated
                  ? `${latestSample.leftCalibratedOffset.horizontalDeg.toFixed(2)}°`
                  : latestSample.leftEye.horizontal.toFixed(3)
            }
          />
          <MetricCard
            label={copy.rightCorrectedH}
            value={
              latestSample.rightEyeCorrected
                ? `${latestSample.rightEyeCorrected.horizontal.toFixed(2)}°`
                : latestSample.rightCalibratedOffset && calibration.isCalibrated
                  ? `${latestSample.rightCalibratedOffset.horizontalDeg.toFixed(2)}°`
                  : latestSample.rightEye.horizontal.toFixed(3)
            }
          />
          <MetricCard
            label={copy.stability}
            value={
              Number.isFinite(latestSample.gazeStability)
                ? latestSample.gazeStability.toFixed(3)
                : copy.pending
            }
          />
          <MetricCard
            label={copy.fovGaze}
            value={
              latestSample.fovGaze
                ? `${latestSample.fovGaze.x.toFixed(2)}, ${latestSample.fovGaze.y.toFixed(2)}`
                : copy.notCalibrated
            }
          />
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-4">
        <TrackingGraph
          axis="vertical"
          data={trackingDataStream.vertical}
          exerciseMode={pursuitAxis}
          copy={copy}
        />
        <TrackingGraph
          axis="horizontal"
          data={trackingDataStream.horizontal}
          exerciseMode={pursuitAxis}
          copy={copy}
        />
        {trackingDataStream.showShoulderMovement ? (
          <ShoulderMovementGraph
            data={trackingDataStream.shoulderMovement}
            copy={copy}
          />
        ) : (
          <CombinedHeadMovementGraph
            data={trackingDataStream.headMovement}
            verticalEye={trackingDataStream.vertical}
            horizontalEye={trackingDataStream.horizontal}
            headEyeVelocity={trackingDataStream.headEyeVelocity}
            pursuitAxis={trackingDataStream.pursuitAxis}
            copy={copy}
          />
        )}
      </div>
    </section>
  );
}
