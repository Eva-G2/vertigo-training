import { DiagnosticDashboard, ICSChartrChart } from "@/components/charts";
import { VisionCamera } from "@/components/camera";

export function DiagnosticPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-sm font-medium uppercase tracking-wider text-cyan">
          Vestibular Training
        </p>
        <h1 className="mt-1 text-3xl font-bold text-dark-blue">
          Eye Tracking Diagnostics
        </h1>
        <p className="mt-2 max-w-2xl text-foreground/70">
          MediaPipe Face Mesh detects iris landmarks while OpenCV.js preprocesses
          frames for improved contrast. Tracking data flows into the diagnostic
          charts below.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <VisionCamera />
        <DiagnosticDashboard />
      </div>

      <ICSChartrChart />
    </main>
  );
}
