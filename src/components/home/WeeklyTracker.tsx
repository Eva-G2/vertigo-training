"use client";

import Image from "next/image";
import type { Locale } from "@/lib/types";
import {
  compareDateKeys,
  toDateKey,
  type DayMark,
} from "@/lib/training-progress";
import { WEEKDAY_SHORT, t } from "@/lib/i18n";

type WeeklyTrackerProps = {
  locale: Locale;
  weekDates: Date[];
  today: Date;
  marks: Record<string, DayMark>;
  onDaySelect?: (date: Date) => void;
};

export function WeeklyTracker({
  locale,
  weekDates,
  today,
  marks,
  onDaySelect,
}: WeeklyTrackerProps) {
  return (
    <div className="flex items-end justify-between gap-2 px-2 py-2 sm:px-6">
      {weekDates.map((date, index) => {
        const isToday = compareDateKeys(date, today) === 0;
        const isFuture = compareDateKeys(date, today) > 0;
        const mark = marks[toDateKey(date)];
        const label = isToday
          ? t(locale, "todayLabel")
          : WEEKDAY_SHORT[locale][index];
        const clickable = !isFuture && onDaySelect;

        return (
          <button
            key={toDateKey(date)}
            type="button"
            disabled={!clickable}
            onClick={() => onDaySelect?.(date)}
            className={`flex flex-col items-center gap-2 ${
              clickable
                ? "cursor-pointer transition-opacity hover:opacity-80"
                : "cursor-default"
            }`}
          >
            <WeekDayGlyph isToday={isToday} isFuture={isFuture} mark={mark} />
            <span
              className={`text-center text-lg font-bold text-dark-blue sm:text-2xl ${
                isToday ? "whitespace-nowrap" : ""
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function WeekDayGlyph({
  isToday,
  isFuture,
  mark,
}: {
  isToday: boolean;
  isFuture: boolean;
  mark?: DayMark;
}) {
  if (isToday) {
    const headSrc =
      mark === "completed" ? "/images/Head_E.png" : "/images/Head_T.png";
    return (
      <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full border-[3px] border-blue bg-yellow">
        <Image
          src={headSrc}
          alt=""
          width={80}
          height={80}
          className="h-20 w-20 object-contain"
        />
      </div>
    );
  }

  if (isFuture) {
    return (
      <div className="h-[65px] w-[65px] rounded-full border-[3px] border-[#d9d9d9] bg-[#d9d9d9]/30" />
    );
  }

  if (mark === "completed") {
    return (
      <div className="flex h-[65px] w-[65px] items-center justify-center rounded-full bg-blue">
        <Image
          src="/icons/Check.svg"
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </div>
    );
  }

  return (
    <Image
      src="/images/Head_N.png"
      alt=""
      width={65}
      height={65}
      className="h-[65px] w-[65px] object-contain"
    />
  );
}
