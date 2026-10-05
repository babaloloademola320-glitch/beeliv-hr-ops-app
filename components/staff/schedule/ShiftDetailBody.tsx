"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Calendar, CircleAlert, Search } from "@/components/applicant/icons";
import { EmptyState } from "@/components/applicant/primitives";
import { CARD, SectionCard } from "@/components/applicant/SectionCard";
import { addDays, formatClockRange, todayISO } from "@/lib/staff/format";
import { useSchedule } from "@/lib/staff/hooks";
import type { Shift } from "@/lib/staff/types";
import { BackCrumb, FieldGrid, PanelError, SK, ShiftStatusChip, ShiftTimeline, fullDateLong } from "./parts";

/** Shift detail (brief section 7): date, time, outlet, location, role, instructions, plus the shift's events. */
export function ShiftDetailBody({ shiftId }: { shiftId: string }) {
  const today = todayISO();
  // Same window as the Schedule page; the shift is looked up client-side.
  const range = useMemo(() => ({ from: addDays(today, -60), to: addDays(today, 90) }), [today]);
  const { data, status, retry } = useSchedule(range);
  const shift: Shift | null = data?.find((s) => s.id === shiftId) ?? null;

  return (
    <div>
      <BackCrumb href="/staff/schedule">Schedule</BackCrumb>
      {status === "loading" ? (
        <ShiftDetailSkeleton />
      ) : status === "error" ? (
        <PanelError what="this shift" retry={retry} />
      ) : !shift ? (
        <div className={CARD}>
          <EmptyState
            icon={Search}
            title="Shift not found"
            description="This shift doesn't exist any more, or it isn't part of your schedule."
            action={
              <Link href="/staff/schedule" className="ap-btn ap-btn-s ap-btn-sm mt-1.5">
                Back to Schedule
              </Link>
            }
          />
        </div>
      ) : (
        <Detail s={shift} isToday={shift.date === today} />
      )}
    </div>
  );
}

function Detail({ s, isToday }: { s: Shift; isToday: boolean }) {
  return (
    <div className="flex flex-col gap-5">
      <section className={CARD}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="ap-eb">{isToday ? "Today" : "Shift"}</div>
            <h1 className="ap-serif text-[30px] leading-tight min-[768px]:text-[38px]">{formatClockRange(s.startTime, s.endTime)}</h1>
            <p className="ap-bd mt-1">{fullDateLong(s.date)}</p>
          </div>
          <ShiftStatusChip status={s.status} />
        </div>
        {s.status === "updated" ? (
          <p className="ap-sm mt-4 flex items-start gap-2 rounded-xl bg-(--ap-warn-bg) p-3 text-(--ap-warn)">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> This shift was updated. Check the time and details below.
          </p>
        ) : null}
        {s.status === "cancelled" ? (
          <p className="ap-sm mt-4 flex items-start gap-2 rounded-xl bg-(--ap-rose-bg) p-3 text-(--ap-rose)">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> This shift has been cancelled.
          </p>
        ) : null}
        <div className="mt-5">
          <FieldGrid
            fields={[
              ["Date", fullDateLong(s.date)],
              ["Time", formatClockRange(s.startTime, s.endTime)],
              ["Client", s.client],
              ["Outlet", s.outlet],
              ["Location", s.location],
              ["Role", s.role],
              ["Section", s.section],
            ]}
          />
        </div>
      </section>

      <div className="flex flex-col gap-5 min-[1241px]:grid min-[1241px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[1241px]:items-start">
        <SectionCard title="Instructions" aside>
          {s.notes ? (
            <p className="ap-sm rounded-xl bg-(--ap-tint-soft) p-3 text-(--ap-ink-2)">{s.notes}</p>
          ) : (
            <EmptyState icon={Calendar} title="No special instructions" description="Nothing extra has been added for this shift." />
          )}
        </SectionCard>
        <SectionCard title="Shift events" aside>
          {s.agenda.length ? (
            <ShiftTimeline events={s.agenda} />
          ) : (
            <EmptyState icon={Calendar} title="No events listed" description="The shift's agenda appears here when Beeliv adds one." />
          )}
        </SectionCard>
      </div>

      {isToday && s.status !== "cancelled" ? (
        <Link href="/staff/attendance" className="ap-btn ap-btn-p w-full min-[768px]:w-fit">
          Go to Attendance
        </Link>
      ) : null}
    </div>
  );
}

export function ShiftDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading shift">
      <div className={`${SK} h-[300px]`} />
      <div className={`${SK} h-[220px]`} />
    </div>
  );
}
