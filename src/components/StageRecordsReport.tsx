"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getAnalyticsCopy, formatStageStep, t } from "@/lib/i18n";
import {
  SHOULDER_ROTATION_CUE_TIMES_SEC,
  SHOULDER_UP_CUE_TIMES_SEC,
} from "@/lib/pacingMetronome";
import { getStageSteps } from "@/lib/training-flow";
import {
  buildHeadMovementSlice,
  buildShoulderMovementSlice,
} from "@/lib/step-analysis-view";
import type { Step } from "@/lib/types";
import { Button } from "./Button";
import { StepAnalysisGraphs } from "./StepAnalysisGraphs";
import { useApp } from "./providers/AppProvider";

type StageRecordsReportProps = {
  stage: number;
};

function formatStartedAt(locale: string, timestamp: number | undefined): string {
  if (timestamp == null) return "Not recorded";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(timestamp));
}

function formatDuration(durationSec: number | undefined): string {
  if (durationSec == null || !Number.isFinite(durationSec) || durationSec < 0) {
    return "Not recorded";
  }

  const totalSeconds = Math.round(durationSec);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function safeFileNamePart(value: string): string {
  return value.trim().replace(/[^\p{L}\p{N}-]+/gu, "-").replace(/^-+|-+$/g, "");
}

function waitForReportSheets(
  sheetRefs: Map<Step, HTMLDivElement>,
  steps: Step[],
): Promise<HTMLDivElement[]> {
  const deadline = performance.now() + 4000;

  return new Promise((resolve, reject) => {
    const poll = () => {
      const sheets = steps
        .map((step) => sheetRefs.get(step))
        .filter((sheet): sheet is HTMLDivElement => sheet != null);

      if (sheets.length === steps.length) {
        const chartsReady = sheets.every((sheet) => {
          const canvases = sheet.querySelectorAll("canvas");
          if (canvases.length === 0) return true;
          return Array.from(canvases).every(
            (canvas) => canvas.width > 0 && canvas.height > 0,
          );
        });

        if (chartsReady) {
          resolve(sheets);
          return;
        }
      }

      if (performance.now() >= deadline) {
        reject(new Error("Timed out waiting for report charts to render"));
        return;
      }

      requestAnimationFrame(poll);
    };

    requestAnimationFrame(poll);
  });
}

export function StageRecordsReport({ stage }: StageRecordsReportProps) {
  const { state } = useApp();
  const { auth, locale, stepAnalysis, stepResults } = state;
  const [saving, setSaving] = useState(false);
  const sheetRefs = useRef(new Map<Step, HTMLDivElement>());
  const steps = useMemo(
    () => getStageSteps(stage).filter((step) => stepResults[step] != null),
    [stage, stepResults],
  );
  const userName =
    auth.status === "authenticated" ? auth.displayName : "Anonymous user";
  const analyticsCopy = getAnalyticsCopy(locale);

  useEffect(() => {
    if (!saving) return;

    let cancelled = false;

    const createPdf = async () => {
      try {
        await document.fonts.ready;
        const sheets = await waitForReportSheets(sheetRefs.current, steps);
        if (cancelled) return;

        // html2canvas-pro supports Tailwind v4 oklab/oklch colors; stock
        // html2canvas rejects them and aborts PDF creation.
        const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
          import("jspdf"),
          import("html2canvas-pro"),
        ]);
        if (cancelled) return;

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        for (const [index, sheet] of sheets.entries()) {
          const canvas = await html2canvas(sheet, {
            backgroundColor: "#ffffff",
            logging: false,
            scale: 2,
            useCORS: true,
          });
          if (cancelled) return;

          const scale = Math.min(
            pageWidth / canvas.width,
            pageHeight / canvas.height,
          );
          const imageWidth = canvas.width * scale;
          const imageHeight = canvas.height * scale;

          if (index > 0) pdf.addPage();
          pdf.addImage(
            canvas.toDataURL("image/jpeg", 0.92),
            "JPEG",
            (pageWidth - imageWidth) / 2,
            (pageHeight - imageHeight) / 2,
            imageWidth,
            imageHeight,
            undefined,
            "FAST",
          );
        }

        const namePart = safeFileNamePart(userName) || "user";
        pdf.save(`${namePart}-stage-${stage}-records.pdf`);
      } catch (error) {
        if (!cancelled) {
          console.error("Unable to create training records PDF", error);
          window.alert("Unable to create the PDF report. Please try again.");
        }
      } finally {
        if (!cancelled) setSaving(false);
      }
    };

    void createPdf();

    return () => {
      cancelled = true;
    };
  }, [saving, stage, steps, userName]);

  return (
    <>
      <Button
        variant="secondary"
        label={saving ? "Saving…" : "Save Records"}
        onClick={() => {
          if (!saving && steps.length > 0) setSaving(true);
        }}
        disabled={saving || steps.length === 0}
      />

      {saving ? (
        <div
          aria-hidden
          data-theme="light"
          className="pointer-events-none fixed left-[-10000px] top-0 w-[794px]"
        >
          {steps.map((step) => {
            const metrics = stepResults[step]!;
            const analysis = stepAnalysis[step];
            const shoulderCueTimes =
              stage === 3 && step === 1
                ? SHOULDER_UP_CUE_TIMES_SEC
                : stage === 3 && step === 2
                  ? SHOULDER_ROTATION_CUE_TIMES_SEC
                  : undefined;

            return (
              <div
                key={step}
                ref={(node) => {
                  if (node) sheetRefs.current.set(step, node);
                  else sheetRefs.current.delete(step);
                }}
                className="w-[794px] bg-white p-10 text-[#111d4d]"
              >
                <h1 className="text-2xl font-bold text-[#2949cc]">
                  Training Records
                </h1>
                <h2 className="mt-2 text-xl font-bold">
                  {formatStageStep(locale, stage, step)}
                </h2>

                <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <span className="font-semibold">User name</span>
                  <span>{userName}</span>
                  <span className="font-semibold">Step started</span>
                  <span>{formatStartedAt(locale, metrics.startedAtMs)}</span>
                  <span className="font-semibold">Duration</span>
                  <span>
                    {formatDuration(
                      metrics.durationSec ?? analysis?.durationSec,
                    )}
                  </span>
                  <span className="font-semibold">{t(locale, "completion")}</span>
                  <span>{metrics.completionPct}%</span>
                  <span className="font-semibold">{t(locale, "accuracy")}</span>
                  <span>{metrics.accuracyPct}%</span>
                  <span className="font-semibold">
                    {t(locale, "averageAngle")}
                  </span>
                  <span>{metrics.averageAngleDeg}°</span>
                </div>

                {analysis ? (
                  <StepAnalysisGraphs
                    className="mt-6 gap-3"
                    graphDatasets={analysis.graphDatasets}
                    copy={analyticsCopy}
                    showEyeMovement={stage !== 2}
                    headMovement={buildHeadMovementSlice(
                      analysis.headMovementPoints,
                      analysis.showNoddingTarget,
                      analysis.showTurningTarget,
                    )}
                    shoulderMovement={buildShoulderMovementSlice(
                      analysis.shoulderMovementPoints,
                      shoulderCueTimes,
                    )}
                    exerciseMode={analysis.exerciseMode}
                    fitToWidth
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
