"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CircleAlert, Search } from "@/components/applicant/icons";
import { EmptyState } from "@/components/applicant/primitives";
import { CARD, SectionCard } from "@/components/applicant/SectionCard";
import { addDays, formatClockRange, formatDateTimeClock, todayISO } from "@/lib/staff/format";
import { useAttendanceHistory, useSchedule } from "@/lib/staff/hooks";
import type { AttendanceRecord, Shift } from "@/lib/staff/types";
import { BackCrumb, FieldGrid, PanelError, SK, fullDateLong } from "../schedule/parts";
import { RecordChip } from "./AttendanceBody";

/** Attendance record detail: the day, its shift (when known), check-in/out times and status. */
export function AttendanceDetailBody({ recordId }: { recordId: string }) {
  const today = todayISO();
  const range = useMemo(() => ({ from: addDays(today, -60), to: addDays(today, 90) }), [today]);
  const history = useAttendanceHistory();
  const schedule = useSchedule(range);

  const record = history.data?.find((r) => r.id === recordId) ?? null;
  // The shift is optional context: a missing one never blocks the record.
  const shift = schedule.data?.find((s) => s.id === record?.shiftId) ?? null;

  return (
    <div>
      <BackCrumb href="/staff/attendance">Attendance</BackCrumb>
      {history.status === "loading" ? (
        <div className={`${SK} h-[320px]`} aria-busy="true" aria-label="Loading record" />
      ) : history.status === "error" ? (
        <PanelError what="this record" retry={history.retry} />
      ) : !record ? (
        <div className={CARD}>
          <EmptyState
            icon={Search}
            title="Record not found"
            description="This attendance record doesn't exist, or it isn't part of your history."
            action={
              <Link href="/staff/attendance" className="ap-btn ap-btn-s ap-btn-sm mt-1.5">
                Back to Attendance
              </Link>
            }
          />
        </div>
      ) : (
        <Detail r={record} shift={shift} />
      )}
    </div>
  );
}

function Detail({ r, shift }: { r: AttendanceRecord; shift: Shift | null }) {
  return (
    <div className="flex flex-col gap-5">
      <section className={CARD}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="ap-eb">Attendance record</div>
            <h1 className="ap-serif text-[30px] leading-tight min-[768px]:text-[38px]">{fullDateLong(r.date)}</h1>
          </div>
          <RecordChip status={r.status} />
        </div>
        {r.status === "attention" ? (
          <p className="ap-sm mt-4 flex items-start gap-2 rounded-xl bg-(--ap-warn-bg) p-3 text-(--ap-warn)">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> This record needs a quick look. Contact Beeliv if you&apos;re unsure what is needed.
          </p>
        ) : null}
        <div className="mt-5">
          <FieldGrid
            fields={[
              ["Date", fullDateLong(r.date)],
              ["Check-in", r.checkedInAt ? formatDateTimeClock(r.checkedInAt) : "Not recorded"],
              ["Check-out", r.checkedOutAt ? formatDateTimeClock(r.checkedOutAt) : "Not recorded"],
            ]}
          />
        </div>
      </section>

      <SectionCard title="Shift" aside>
        {shift ? (
          <div className="flex flex-col gap-4">
            <FieldGrid
              fields={[
                ["Scheduled", formatClockRange(shift.startTime, shift.endTime)],
                ["Outlet", shift.outlet],
                ["Role", shift.role],
              ]}
            />
            <Link href={`/staff/schedule/${shift.id}`} className="ap-btn ap-btn-s ap-btn-sm w-fit">
              View shift
            </Link>
          </div>
        ) : (
          <p className="ap-sm text-(--ap-muted)">{r.shiftId ? "Shift details aren't available for this record." : "This record isn't linked to a scheduled shift."}</p>
        )}
      </SectionCard>
    </div>
  );
}

export function AttendanceDetailSkeleton() {
  return <div className={`${SK} h-[320px]`} aria-busy="true" aria-label="Loading record" />;
}
