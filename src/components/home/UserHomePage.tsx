"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { MonthlyCalendar } from "@/components/home/MonthlyCalendar";
import { WeeklyTracker } from "@/components/home/WeeklyTracker";
import { useApp } from "@/components/providers/AppProvider";
import {
  formatBeganTraining,
  formatWelcomeBack,
  t,
} from "@/lib/i18n";
import { getDemoVideoSrc } from "@/lib/stage1Steps";
import { createClient } from "@/lib/supabase/client";
import {
  fetchTrainingRecords,
  marksFromTrainingRecords,
} from "@/lib/supabase/training-records";
import {
  getNextTrainingRoute,
  getNextTrainingStep,
  isFullProgramComplete,
} from "@/lib/training-flow";
import {
  daysSince,
  getMonthGrid,
  getWeekDates,
  toDateKey,
  type DayMark,
} from "@/lib/training-progress";

const START_VIDEO_SRC = "/videos/Start.mp4";

export function UserHomePage() {
  const router = useRouter();
  const { state, updateTraining } = useApp();
  const { locale, auth } = state;
  const displayName =
    auth.status === "authenticated" ? auth.displayName : "User";
  const userId = auth.status === "authenticated" ? auth.userId : null;

  const today = useMemo(() => new Date(), []);
  const weekDates = useMemo(() => getWeekDates(today), [today]);
  const monthCells = useMemo(
    () => getMonthGrid(today.getFullYear(), today.getMonth()),
    [today],
  );

  const [marks, setMarks] = useState<Record<string, DayMark>>({});
  const [daysAgo, setDaysAgo] = useState(0);

  useEffect(() => {
    if (!userId) return;
    void fetchTrainingRecords(userId).then((rows) => {
      setMarks(marksFromTrainingRecords(rows));
    });
  }, [userId]);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user?.created_at) return;
      setDaysAgo(daysSince(new Date(user.created_at), today));
    });
  }, [today]);

  const beganTrainingToday = Boolean(marks[toDateKey(today)]);
  const programComplete = isFullProgramComplete(state);
  const nextStep = getNextTrainingStep(state);

  const promptVideo = useMemo(() => {
    if (!beganTrainingToday || programComplete || !nextStep) {
      return {
        src: START_VIDEO_SRC,
        stage2Media: false,
        stage3Media: false,
      };
    }

    const src = getDemoVideoSrc(nextStep.stage, nextStep.step) ?? START_VIDEO_SRC;
    return {
      src,
      stage2Media: nextStep.stage === 2,
      stage3Media: nextStep.stage === 3,
    };
  }, [beganTrainingToday, programComplete, nextStep]);

  const handleOpenRecords = (date: Date) => {
    router.push(`/records?date=${toDateKey(date)}`);
  };

  const handleStart = () => {
    if (userId) {
      setMarks((prev) => ({
        ...prev,
        [toDateKey(today)]: prev[toDateKey(today)] ?? "started",
      }));
    }

    const next = getNextTrainingStep(state);
    if (next && next.stage !== state.stage) {
      updateTraining({
        stage: next.stage,
        step: 1,
        phase: "prepare",
        stepResults: {},
        stepAnalysis: {},
      });
      router.push(`/training/stage/${next.stage}/prepare`);
      return;
    }

    router.push(getNextTrainingRoute(state));
  };

  return (
    <div className="grid h-full min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.72fr)]">
      <div className="flex min-h-0 flex-col gap-4 overflow-hidden">
        <Card className="flex min-h-0 flex-1 flex-col items-center overflow-hidden !p-0">
          <h1 className="shrink-0 px-5 pt-5 text-center text-[32px] font-bold leading-tight text-blue lg:text-[36px]">
            {t(locale, "beginTrainingToday")}
          </h1>
          <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden bg-card px-5">
            <div className="relative aspect-[4/3] h-[min(324px,100%)] w-auto max-w-full overflow-hidden">
              <video
                key={promptVideo.src}
                src={promptVideo.src}
                autoPlay
                loop
                muted
                playsInline
                className={[
                  "h-full w-full object-cover",
                  promptVideo.stage3Media ? "-scale-x-100" : "",
                  promptVideo.stage2Media
                    ? "stage2-demo-video-zoom stage2-demo-media"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            </div>
          </div>
          <div className="flex shrink-0 justify-center px-5 pb-5 pt-3">
            <Button label={t(locale, "start")} onClick={handleStart} />
          </div>
        </Card>

        <Card className="shrink-0 px-4 py-3 sm:px-6">
          <WeeklyTracker
            locale={locale}
            weekDates={weekDates}
            today={today}
            marks={marks}
            onDaySelect={handleOpenRecords}
          />
        </Card>
      </div>

      <div className="flex min-h-0 flex-col gap-4 overflow-hidden">
        <Card className="flex shrink-0 flex-col justify-center gap-2 px-8 py-5">
          <h2 className="text-[28px] font-bold leading-snug text-blue">
            {formatWelcomeBack(locale, displayName)}
          </h2>
          <p className="text-lg font-medium text-dark-blue">
            {formatBeganTraining(locale, daysAgo)}
          </p>
        </Card>

        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden px-8 py-5">
          <MonthlyCalendar
            locale={locale}
            year={today.getFullYear()}
            month={today.getMonth()}
            today={today}
            cells={monthCells}
            marks={marks}
            onDaySelect={handleOpenRecords}
          />
        </Card>
      </div>
    </div>
  );
}
