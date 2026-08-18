"use client";

import type { Locale } from "@/lib/types";
import {
  compareDateKeys,
  toDateKey,
  type DayMark,
} from "@/lib/training-progress";
import { MONTH_NAMES, WEEKDAY_LETTERS } from "@/lib/i18n";

type MonthlyCalendarProps = {
  locale: Locale;
  year: number;
  month: number;
  today: Date;
  cells: (Date | null)[];
  marks: Record<string, DayMark>;
  onDaySelect?: (date: Date) => void;
};

export function MonthlyCalendar({
  locale,
  year,
  month,
  today,
  cells,
  marks,
  onDaySelect,
}: MonthlyCalendarProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[40px] font-bold leading-none text-blue">
        {MONTH_NAMES[locale][month]}
      </h2>
      <div className="grid grid-cols-7 gap-y-4 text-center text-2xl font-medium text-dark-blue">
        {WEEKDAY_LETTERS[locale].map((letter, index) => (
          <span key={`${letter}-${index}`}>{letter}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-3">
        {cells.map((date, index) => {
          if (!date) {
            return <div key={`empty-${year}-${month}-${index}`} />;
          }

          const isToday = compareDateKeys(date, today) === 0;
          const isFuture = compareDateKeys(date, today) > 0;
          const mark = marks[toDateKey(date)];
          const clickable = !isFuture && onDaySelect;

          return (
            <button
              key={toDateKey(date)}
              type="button"
              disabled={!clickable}
              onClick={() => onDaySelect?.(date)}
              className={`flex h-[30px] items-center justify-center ${
                clickable
                  ? "cursor-pointer transition-opacity hover:opacity-80"
                  : "cursor-default"
              }`}
            >
              <CalendarGlyph
                isToday={isToday}
                isFuture={isFuture}
                mark={mark}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CalendarGlyph({
  isToday,
  isFuture,
  mark,
}: {
  isToday: boolean;
  isFuture: boolean;
  mark?: DayMark;
}) {
  if (isToday) {
    return (
      <div className="size-[30px] rounded-full border-2 border-blue bg-yellow" />
    );
  }

  if (isFuture) {
    return <div className="size-[22px] rounded-[5px] bg-[#d9d9d9]" />;
  }

  if (mark === "completed") {
    return <div className="size-[22px] rounded-[5px] bg-blue" />;
  }

  return (
    <div className="size-[22px] rounded-[5px] border-2 border-blue bg-transparent" />
  );
}
