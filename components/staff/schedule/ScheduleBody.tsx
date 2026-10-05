"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, MapPin } from "@/components/applicant/icons";
import { FilterTabs } from "@/components/applicant/FilterTabs";
import { Reveal } from "@/components/applicant/motion";
import { Chip, EmptyState, PageHeading } from "@/components/applicant/primitives";
import { CARD, SectionCard } from "@/components/applicant/SectionCard";
import { addDays, dayMonth, dayNumber, formatClock, formatClockRange, longDate, parseDate, todayISO, weekday } from "@/lib/staff/format";
import { useSchedule } from "@/lib/staff/hooks";
import type { Shift } from "@/lib/staff/types";
import { PanelError, SK, ShiftStatusChip, ShiftTimeline } from "./parts";

/**
 * Schedule (brief section 7): Today / Week / Upcoming. One fetch covers a
 * window around today; the views filter it locally so switching tabs and
 * paging weeks is instant. Mobile = chronological cards; the week view
 * becomes a 7-column grid only from 1101px. No scheduling policy is decided
 * here - status and notes come from the backend.
 */

type View = "today" | "week" | "upcoming";
const PAST_DAYS = 60;
const FUTURE_DAYS = 90;

/** Monday of the week containing `d`. */
function weekStart(d: string): string {
  const dow = (parseDate(d).getDay() + 6) % 7; // Mon = 0
  return addDays(d, -dow);
}

export function ScheduleBody() {
  const today = todayISO();
  const range = useMemo(() => ({ from: addDays(today, -PAST_DAYS), to: addDays(today, FUTURE_DAYS) }), [today]);
  const { data, status, retry } = useSchedule(range);
  const [view, setView] = useState<View>("today");
  const [weekOffset, setWeekOffset] = useState(0);

  const shifts = useMemo(() => [...(data ?? [])].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)), [data]);

  return (
    <>
      <div className="min-[768px]:hidden">
        <MobileSchedule shifts={shifts} today={today} status={status} retry={retry} />
      </div>
      <div className="max-[767px]:hidden">
      <PageHeading title="Schedule" subtitle="Your shifts today, this week and coming up." />
      <FilterTabs
        className="mb-5"
        label="Schedule view"
        value={view}
        onChange={setView}
        options={[
          { key: "today", label: "Today" },
          { key: "week", label: "Week" },
          { key: "upcoming", label: "Upcoming" },
        ]}
      />

      {status === "loading" ? (
        <ScheduleSkeleton />
      ) : status === "error" ? (
        <PanelError what="your schedule" retry={retry} />
      ) : view === "today" ? (
        <TodayView shifts={shifts} today={today} />
      ) : view === "week" ? (
        <WeekView shifts={shifts} today={today} offset={weekOffset} setOffset={setWeekOffset} />
      ) : (
        <UpcomingView shifts={shifts} today={today} />
      )}
      </div>
    </>
  );
}

/* ---------- Phones: week strip + the selected day ---------- */

/**
 * Phones only (below 768px), per the Staff reference: a Monday-to-Sunday strip, the selected
 * day's shift, and its details. Only fields the schedule really has are shown: no reporting
 * time or manager is invented. Tablet and desktop keep the Today / Week / Upcoming tabs.
 */
function MobileSchedule({ shifts, today, status, retry }: { shifts: Shift[]; today: string; status: string; retry: () => void }) {
  const [offset, setOffset] = useState(0);
  const [full, setFull] = useState(false);
  const [picked, setPicked] = useState(today);
  const start = addDays(weekStart(today), offset * 7);
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(start, i));
  const selected = days.includes(picked) ? picked : days[0];
  const dayShifts = shifts.filter((s) => s.date === selected);
  const arrow = "inline-flex size-10 items-center justify-center rounded-xl border border-(--ap-line) bg-white text-(--ap-violet)";
  return (
    <>
      <PageHeading title="My Schedule" />
      {status === "loading" ? (
        <ScheduleSkeleton />
      ) : status === "error" ? (
        <PanelError what="your schedule" retry={retry} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <button type="button" className={arrow} aria-label="Previous week" onClick={() => setOffset(offset - 1)}>
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <b className="text-[15px] text-(--ap-ink)">{offset === 0 ? "This week" : `${dayMonth(days[0])} - ${dayMonth(days[6])}`}</b>
            <button type="button" className={arrow} aria-label="Next week" onClick={() => setOffset(offset + 1)}>
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Days of the week">
            {days.map((d) => {
              const on = d === selected;
              const has = shifts.some((x) => x.date === d && x.status !== "cancelled");
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setPicked(d)}
                  aria-pressed={on}
                  aria-current={d === today ? "date" : undefined}
                  className={`flex min-w-0 flex-col items-center gap-1 rounded-xl py-2.5 ${on ? "bg-(--ap-violet) text-white" : `bg-white ring-1 ring-(--ap-line) ${has ? "text-(--ap-ink)" : "text-(--ap-faint)"}`}`}
                >
                  <span className="text-[11px] font-bold uppercase">{weekday(d)}</span>
                  <b className="text-[18px] leading-none">{dayNumber(d)}</b>
                </button>
              );
            })}
          </div>

          <Reveal className={`${CARD} flex flex-col gap-3 p-4`}>
            <p className="ap-sm m-0 font-bold text-(--ap-muted)">{selected === today ? "Today" : longDate(selected)}</p>
            {dayShifts.length === 0 ? (
              <p className="ap-sm rounded-xl bg-(--ap-tint-soft) px-4 py-4 text-(--ap-muted)">No shift on this day.</p>
            ) : (
              dayShifts.map((sh) => <ShiftCard key={sh.id} s={sh} />)
            )}
          </Reveal>

          {dayShifts.length > 0 ? (
            <Reveal className={`${CARD} p-4`}>
              <h2 className="ap-serif text-[22px]">Shift details</h2>
              {dayShifts.map((sh) => {
                const brk = sh.agenda.find((e) => e.kind === "break");
                const rows: [string, string][] = [
                  ["Time", formatClockRange(sh.startTime, sh.endTime)],
                  ...(brk ? ([["Break", brk.detail ? `${formatClock(brk.time)} · ${brk.detail}` : formatClock(brk.time)]] as [string, string][]) : []),
                  ["Outlet", sh.outlet],
                  ["Section", sh.section],
                  ["Role", sh.role],
                ];
                return (
                  <dl key={sh.id} className="mt-2 flex flex-col">
                    {rows.map(([k, v]) => (
                      <div key={k} className="flex items-baseline justify-between gap-4 border-t border-(--ap-line-2) py-2.5 first:border-t-0">
                        <dt className="ap-sm">{k}</dt>
                        <dd className="m-0 text-right text-[15px] font-semibold text-(--ap-ink)">{v}</dd>
                      </div>
                    ))}
                  </dl>
                );
              })}
            </Reveal>
          ) : null}

          <button type="button" onClick={() => setFull((v) => !v)} aria-expanded={full} className={`${CARD} flex items-center gap-3 p-4 text-left text-(--ap-ink)`}>
            <Calendar className="size-5 text-(--ap-violet)" aria-hidden="true" />
            <b className="flex-1 text-[16px]">{full ? "Hide full schedule" : "View full schedule"}</b>
            <ChevronRight className={`size-5 text-(--ap-muted) transition-transform ${full ? "rotate-90" : ""}`} aria-hidden="true" />
          </button>
          {full ? <UpcomingView shifts={shifts} today={today} /> : null}
        </div>
      )}
    </>
  );
}

/* ---------- shared card ---------- */

/** One shift as a tappable card (links to its detail). */
export function ShiftCard({ s, showDate = false, compact = false }: { s: Shift; showDate?: boolean; compact?: boolean }) {
  const off = s.status === "cancelled";
  return (
    <Link href={`/staff/schedule/${s.id}`} className="ap-card ap-card-hover flex items-center gap-3 rounded-2xl p-3.5 min-[768px]:p-4">
      {showDate ? (
        <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-(--ap-tint) text-(--ap-violet)" aria-hidden="true">
          <span className="text-[12px] leading-none font-bold uppercase">{weekday(s.date)}</span>
          <b className="ap-serif text-[22px] leading-none">{dayNumber(s.date)}</b>
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <b className={`ap-title block ${off ? "line-through decoration-(--ap-faint)" : ""}`}>{formatClockRange(s.startTime, s.endTime)}</b>
        <span className="ap-sm block text-(--ap-ink-2) min-[768px]:truncate">
          {s.role} - {s.section}
        </span>
        {compact ? null : (
          <span className="ap-label mt-0.5 flex items-center gap-1.5 text-(--ap-muted)">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{s.outlet}</span>
          </span>
        )}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <ShiftStatusChip status={s.status} />
        <ChevronRight className="size-4 text-(--ap-faint)" aria-hidden="true" />
      </span>
    </Link>
  );
}

/* ---------- Today ---------- */

function TodayView({ shifts, today }: { shifts: Shift[]; today: string }) {
  const mine = shifts.filter((s) => s.date === today);
  const next = shifts.find((s) => s.date > today && s.status !== "cancelled");
  if (mine.length === 0) {
    return (
      <div className={CARD}>
        <EmptyState
          icon={Calendar}
          title="No shift today"
          description={next ? `Your next shift is ${longDate(next.date)}, ${formatClockRange(next.startTime, next.endTime)}.` : "Nothing is scheduled for you today."}
          action={
            next ? (
              <Link href={`/staff/schedule/${next.id}`} className="ap-btn ap-btn-s ap-btn-sm mt-1.5">
                View next shift
              </Link>
            ) : undefined
          }
        />
      </div>
    );
  }
  const now = new Date();
  const nowKey = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return (
    <div className="flex flex-col gap-5">
      {mine.map((s) => (
        <div key={s.id} className="flex flex-col gap-5 min-[1241px]:grid min-[1241px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[1241px]:items-start">
          <SectionCard title="Today's shift" aside action={<Chip tone="violet">{longDate(s.date)}</Chip>}>
            <ShiftCard s={s} />
            {s.notes ? <p className="ap-sm mt-3 rounded-xl bg-(--ap-tint-soft) p-3 text-(--ap-ink-2)">{s.notes}</p> : null}
          </SectionCard>
          {s.agenda.length ? (
            <SectionCard title="Shift events" aside>
              <ShiftTimeline events={s.agenda} nowKey={s.status === "cancelled" ? undefined : nowKey} />
            </SectionCard>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* ---------- Week ---------- */

function WeekView({ shifts, today, offset, setOffset }: { shifts: Shift[]; today: string; offset: number; setOffset: (n: number) => void }) {
  const start = addDays(weekStart(today), offset * 7);
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(start, i));
  const label = `${dayMonth(days[0])} - ${dayMonth(days[6])}`;
  const btn = "inline-flex size-11 items-center justify-center rounded-xl border border-(--ap-line) bg-white text-(--ap-violet) hover:bg-(--ap-tint-soft)";
  return (
    <SectionCard
      title={offset === 0 ? "This week" : label}
      aside
      action={
        <div className="flex items-center gap-2">
          <span className="ap-sm hidden font-bold text-(--ap-muted) min-[480px]:inline">{label}</span>
          <button type="button" className={btn} aria-label="Previous week" onClick={() => setOffset(offset - 1)}>
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button type="button" className={btn} aria-label="Next week" onClick={() => setOffset(offset + 1)}>
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
          {offset !== 0 ? (
            <button type="button" className="ap-btn ap-btn-s ap-btn-sm" onClick={() => setOffset(0)}>
              Today
            </button>
          ) : null}
        </div>
      }
    >
      <ul className="grid grid-cols-1 gap-3 min-[1101px]:grid-cols-7">
        {days.map((d) => {
          const day = shifts.filter((s) => s.date === d);
          const isToday = d === today;
          return (
            <li key={d} className={`flex min-w-0 flex-col gap-2 rounded-2xl border p-3 ${isToday ? "border-(--ap-violet) bg-(--ap-tint-soft)" : "border-(--ap-line)"}`}>
              <div className="flex items-baseline gap-1.5 min-[1101px]:flex-col min-[1101px]:gap-0">
                <b className="ap-title">{weekday(d)}</b>
                <span className="ap-sm text-(--ap-muted)">{dayMonth(d)}</span>
                {isToday ? <span className="ml-auto min-[1101px]:ml-0 min-[1101px]:mt-1"><Chip tone="violet">Today</Chip></span> : null}
              </div>
              {day.length ? (
                day.map((s) => (
                  <Link key={s.id} href={`/staff/schedule/${s.id}`} className="block rounded-xl bg-white p-2.5 ring-1 ring-(--ap-line) hover:ring-(--ap-violet)">
                    <b className={`ap-sm block ${s.status === "cancelled" ? "line-through decoration-(--ap-faint)" : ""}`}>{formatClockRange(s.startTime, s.endTime)}</b>
                    <span className="ap-label mb-1.5 block text-(--ap-muted)">{s.section}</span>
                    <ShiftStatusChip status={s.status} />
                  </Link>
                ))
              ) : (
                <span className="ap-sm text-(--ap-muted)">No shift</span>
              )}
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

/* ---------- Upcoming ---------- */

function UpcomingView({ shifts, today }: { shifts: Shift[]; today: string }) {
  const list = shifts.filter((s) => s.date > today);
  if (list.length === 0) {
    return (
      <div className={CARD}>
        <EmptyState icon={Calendar} title="No upcoming shifts" description="When Beeliv schedules your next shifts, they appear here." />
      </div>
    );
  }
  // Group by date so each day reads as one block.
  const dates = [...new Set(list.map((s) => s.date))];
  return (
    <ul className="flex flex-col gap-3">
      {dates.map((d) => (
        <Reveal as="li" key={d} className="flex flex-col gap-2">
          {list
            .filter((s) => s.date === d)
            .map((s) => (
              <ShiftCard key={s.id} s={s} showDate />
            ))}
        </Reveal>
      ))}
    </ul>
  );
}

/* ---------- loading ---------- */

export function ScheduleSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading your schedule">
      <div className={`${SK} h-[92px]`} />
      <div className={`${SK} h-[92px]`} />
      <div className={`${SK} h-[92px]`} />
    </div>
  );
}

export function ScheduleLoading() {
  return (
    <>
      <PageHeading title="Schedule" subtitle="Your shifts today, this week and coming up." />
      <div className={`${SK} mb-5 h-12 w-full max-w-[340px]`} />
      <ScheduleSkeleton />
    </>
  );
}
