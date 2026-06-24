import { useCallback, useRef } from "react";

import type { DateClickArg } from "@fullcalendar/interaction";

import { newDate } from "@/lib/date-utils";

import { useCalendarViewSettings } from "@/store/calendarViewSettings";

const DOUBLE_CLICK_MS = 400;
const DEFAULT_CREATE_DURATION_MS = 30 * 60 * 1000;
// Distance (px) a pointer must travel for FullCalendar to treat the gesture as
// a range selection. With this set, a stationary click no longer fires
// `select` (so it can't open the create modal); a drag still does.
const CLICK_GUARD_DISTANCE = 8;

interface CreateClickGate {
  selectMinDistance: number;
  handleDateClick: (arg: DateClickArg) => void;
}

/**
 * Centralizes the "single vs double click to create" behavior shared by every
 * calendar view. When `createOnDoubleClick` is off, behavior is unchanged: a
 * single click navigates and a `select` opens the create modal. When on, a
 * stray single click only navigates, and a deliberate double-click opens the
 * create modal — while drag-to-create keeps working via `selectMinDistance`.
 */
export function useCreateClickGate(
  onNavigate: ((date: Date) => void) | undefined,
  openCreateAt: (start: Date, end: Date, allDay: boolean) => void
): CreateClickGate {
  const createOnDoubleClick = useCalendarViewSettings(
    (s) => s.createOnDoubleClick
  );
  const lastClick = useRef<{ at: number; ms: number } | null>(null);

  const handleDateClick = useCallback(
    (arg: DateClickArg) => {
      onNavigate?.(arg.date);
      if (!createOnDoubleClick) return;

      const at = performance.now();
      const ms = arg.date.getTime();
      const prev = lastClick.current;
      if (prev && at - prev.at < DOUBLE_CLICK_MS && prev.ms === ms) {
        lastClick.current = null;
        const end = newDate(arg.date.getTime() + DEFAULT_CREATE_DURATION_MS);
        openCreateAt(arg.date, end, arg.allDay);
      } else {
        lastClick.current = { at, ms };
      }
    },
    [createOnDoubleClick, onNavigate, openCreateAt]
  );

  return {
    selectMinDistance: createOnDoubleClick ? CLICK_GUARD_DISTANCE : 0,
    handleDateClick,
  };
}
