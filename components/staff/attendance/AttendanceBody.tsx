"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, ChevronRight, CircleAlert, Clock3, LogOut, MapPin } from "@/components/applicant/icons";
import { confirmAction } from "@/components/applicant/ConfirmDialog";
import { Reveal } from "@/components/applicant/motion";
import { Chip, EmptyState, PageHeading } from "@/components/applicant/primitives";
import { CARD, SectionCard } from "@/components/applicant/SectionCard";
import { SelectMenu } from "@/components/applicant/SelectMenu";
import { toast } from "@/components/ui/toast";
import { dayNumber, formatClock, formatClockRange, formatDateTimeClock, weekday, dayMonth } from "@/lib/staff/format";
import { useAttendanceHistory, useTodayAttendance } from "@/lib/staff/hooks";
import { checkIn, checkOut } from "@/lib/staff/service";
import type { AttendanceRecord, TodayAttendance } from "@/lib/staff/types";
import { CircleCheck, History, LogIn } from "../icons";
import { withStaffPreloader } from "../StaffPreloader";
import { PanelError, SK } from "../schedule/parts";

/**
 * Attendance (brief section 8). The backend reports the state; this screen
 * only shows it and offers the contextual action. It does NOT decide how
 * attendance is verified (GPS/QR/selfie...), lateness, grace periods, absence
 * or corrections - those arrive with the backend.
 */

export function AttendanceBody() {
  const today = useTodayAttendance();
  const history = useAttendanceHistory();
  return (
    <>
      <PageHeading title="Attendance" subtitle="Check in for your shift and review your records." />
      <div className="flex flex-col gap-5 min-[1241px]:grid min-[1241px]:grid-cols-[380px_minmax(0,1fr)] min-[1241px]:items-start">
        {today.status === "loading" ? (
          <div className={`${SK} h-[240px]`} aria-busy="true" aria-label="Loading today's attendance" />
        ) : today.status === "error" || !today.data ? (
          <PanelError what="today's attendance" retry={today.retry} />
        ) : (
          <TodayCard t={today.data} />
        )}

        <SectionCard id="attendance-history" title="Recent attendance" aside>
          {history.status === "loading" ? (
            <HistorySkeleton />
          ) : history.status === "error" ? (
            <EmptyState
              icon={CircleAlert}
              title="We couldn't load your history"
              description="Check your connection and try again."
              action={
                <button type="button" onClick={history.retry} className="ap-btn ap-btn-p ap-btn-sm mt-1.5">
                  Try again
                </button>
              }
            />
          ) : history.status === "empty" || !history.data ? (
            <EmptyState icon={History} title="No attendance records yet" description="Your check-ins and check-outs are listed here after your first shift." />
          ) : (
            <>
              <div className="min-[768px]:hidden">
                <RecentList records={history.data} />
              </div>
              <div className="max-[767px]:hidden">
                <HistoryList records={history.data} />
              </div>
            </>
          )}
        </SectionCard>
      </div>
    </>
  );
}

/* ---------- Today's attendance card ---------- */

function TodayCard({ t }: { t: TodayAttendance }) {
  const shift = t.shift;
  let title = "No shift today";
  let sub = "You're currently off shift. Nothing to check in for.";
  let action: "in" | "out" | null = null;
  let disabled = false;
  switch (t.state) {
    case "upcoming":
      title = "Shift upcoming";
      sub = shift ? `Your shift starts at ${formatClock(shift.startTime)}.` : "Your shift is coming up.";
      action = "in";
      disabled = true; // the backend decides when check-in opens; until then the button stays inactive
      break;
    case "ready":
      title = "Ready to check in";
      sub = shift ? `Your shift starts at ${formatClock(shift.startTime)}.` : "";
      action = "in";
      break;
    case "checked-in":
      title = "Checked in";
      sub = t.checkedInAt ? `Since ${formatDateTimeClock(t.checkedInAt)}` : "You're on shift.";
      action = "out";
      break;
    case "checked-out":
      title = "Checked out";
      sub = t.checkedOutAt ? `At ${formatDateTimeClock(t.checkedOutAt)}. Thanks for today.` : "Thanks for today.";
      break;
    case "attention":
      title = "Needs attention";
      sub = t.attentionReason ?? "Something needs a quick look.";
      break;
  }

  async function run(kind: "in" | "out") {
    const ok = await confirmAction({
      tone: "neutral",
      icon: kind === "in" ? LogIn : LogOut,
      title: kind === "in" ? "Check in for your shift?" : "Check out of your shift?",
      description: shift ? `This records your ${kind === "in" ? "check-in" : "check-out"} for today's shift, ${formatClockRange(shift.startTime, shift.endTime)}.` : undefined,
      confirmLabel: kind === "in" ? "Check in" : "Check out",
    });
    if (!ok) return;
    try {
      await withStaffPreloader(kind === "in" ? "check-in" : "check-out", () => (kind === "in" ? checkIn() : checkOut()));
      toast.add({ title: kind === "in" ? "You're checked in" : "You're checked out", type: "success" });
    } catch {
      toast.add({ title: "We couldn't record that", description: "Please try again.", type: "error" });
    }
  }

  const Icon = t.state === "checked-out" ? CircleCheck : t.state === "attention" ? CircleAlert : t.state === "checked-in" ? Clock3 : LogIn;
  const rows: [string, string][] = [
    ["Expected", shift ? formatClockRange(shift.startTime, shift.endTime) : "-"],
    ["Checked in", t.checkedInAt ? formatDateTimeClock(t.checkedInAt) : "-"],
    ["Checked out", t.checkedOutAt ? formatDateTimeClock(t.checkedOutAt) : "-"],
  ];
  return (
    <>
    <MobileTodayCard title={title} sub={sub} action={action} disabled={disabled} attention={t.state === "attention"} shift={shift} Icon={Icon} onRun={run} />
    <Reveal as="section" className="staff-dark-card rounded-[20px] p-5 max-[767px]:hidden min-[768px]:p-6" aria-label="Today's attendance">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/14">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="text-[12px] font-bold tracking-[.14em] text-white/62 uppercase">Today&apos;s attendance</div>
          <h2 className="text-[22px] leading-tight font-bold">{title}</h2>
          <p className="ap-sm mt-0.5 text-white/78">{sub}</p>
        </div>
      </div>

      {shift ? (
        <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-white/10 p-3 max-[420px]:grid-cols-1">
          {rows.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-[12px] font-bold tracking-[.1em] text-white/62 uppercase">{k}</dt>
              <dd className="ap-sm font-bold text-white">{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {action ? (
        <button type="button" disabled={disabled} onClick={() => run(action)} className="ap-btn staff-btn-bright mt-4 h-12 w-full text-[16px]">
          {action === "in" ? "Check in" : "Check out"}
        </button>
      ) : t.state === "attention" ? (
        <Link href="/staff/help" className="ap-btn staff-btn-bright mt-4 h-12 w-full">
          Contact Beeliv <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      ) : null}

      {shift ? (
        <div className="ap-sm mt-3 flex items-center gap-2 text-white/78">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 truncate">
            {shift.outlet} ({shift.section})
          </span>
        </div>
      ) : null}
    </Reveal>
    </>
  );
}

/**
 * Phones only (below 768px): the reference layout - a large status circle, the main
 * action, today's shift and a shortcut to the history. Tablet and desktop keep the card above.
 */
function MobileTodayCard({
  title,
  sub,
  action,
  disabled,
  attention,
  shift,
  Icon,
  onRun,
}: {
  title: string;
  sub: string;
  action: "in" | "out" | null;
  disabled: boolean;
  attention: boolean;
  shift: TodayAttendance["shift"];
  Icon: typeof Clock3;
  onRun: (kind: "in" | "out") => void;
}) {
  return (
    <section className="flex flex-col gap-4 min-[768px]:hidden" aria-label="Today's attendance">
      <Reveal className={`${CARD} flex flex-col items-center px-5 pt-7 pb-6 text-center`}>
        <div className="flex size-[200px] flex-col items-center justify-center rounded-full border-[10px] border-(--ap-tint) bg-white px-6">
          <Icon className="mb-2 size-9 text-(--ap-violet)" aria-hidden="true" />
          <b className="text-[22px] leading-tight text-(--ap-ink)">{title}</b>
          <span className="ap-sm mt-1 leading-snug">{sub}</span>
        </div>
        {action ? (
          <button type="button" disabled={disabled} onClick={() => onRun(action)} className="ap-btn ap-btn-p mt-6 h-14 w-full text-[16px]">
            {action === "in" ? "Check in" : "Check out"}
          </button>
        ) : attention ? (
          <Link href="/staff/help" className="ap-btn ap-btn-p mt-6 h-14 w-full">
            Contact Beeliv <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </Reveal>

      {shift ? (
        <Reveal className={`${CARD} flex items-center gap-3.5 p-4`}>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-(--ap-tint) text-(--ap-violet)">
            <Calendar className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="ap-sm block">Today&apos;s shift</span>
            <b className="block text-[17px] text-(--ap-ink)">{formatClockRange(shift.startTime, shift.endTime)}</b>
            <span className="ap-sm block truncate">
              {shift.outlet} ({shift.section})
            </span>
          </span>
        </Reveal>
      ) : null}

      <Link href="/staff/attendance/history" className={`${CARD} flex items-center gap-3 p-4 text-(--ap-ink)`}>
        <Clock3 className="size-5 text-(--ap-violet)" aria-hidden="true" />
        <b className="flex-1 text-[16px]">Attendance history</b>
        <ChevronRight className="size-5 text-(--ap-muted)" aria-hidden="true" />
      </Link>
    </section>
  );
}

/* ---------- History ---------- */

function HistoryRow({ r }: { r: AttendanceRecord }) {
  return (
    <li>
      <Link href={`/staff/attendance/${r.id}`} className="flex items-center gap-3 rounded-2xl border border-(--ap-line-2) p-3 hover:border-(--ap-violet)">
        <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-(--ap-tint) text-(--ap-violet)" aria-hidden="true">
          <span className="text-[12px] leading-none font-bold uppercase">{weekday(r.date)}</span>
          <b className="ap-serif text-[20px] leading-none">{dayNumber(r.date)}</b>
        </span>
        <span className="min-w-0 flex-1">
          <b className="ap-title block">{dayMonth(r.date)}</b>
          <span className="ap-sm block text-(--ap-ink-2)">
            {r.checkedInAt ? formatDateTimeClock(r.checkedInAt) : "No check-in"} - {r.checkedOutAt ? formatDateTimeClock(r.checkedOutAt) : "No check-out"}
          </span>
        </span>
        <RecordChip status={r.status} />
      </Link>
    </li>
  );
}

const RECENT = 4;

/** Phones: only the latest few records, with a link to the full history page (which has the filters). */
function RecentList({ records }: { records: AttendanceRecord[] }) {
  const latest = [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, RECENT);
  return (
    <div className="flex flex-col gap-3">
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {latest.map((r) => (
          <HistoryRow key={r.id} r={r} />
        ))}
      </ul>
      <Link href="/staff/attendance/history" className="ap-btn ap-btn-s h-11 w-full">
        View all attendance history <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

type StatusFilter = "all" | "attention" | "recorded";
const PAGE = 10;

function monthLabel(ym: string) {
  return new Date(`${ym}-15T12:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** Month and status dropdowns + counts + "show more", so every record is reachable however long the history gets. */
export function HistoryList({ records }: { records: AttendanceRecord[] }) {
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  const months = Array.from(new Set(sorted.map((r) => r.date.slice(0, 7))));
  const [month, setMonth] = useState<string>("all");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [shown, setShown] = useState(PAGE);

  const inMonth = month === "all" ? sorted : sorted.filter((r) => r.date.startsWith(month));
  const counts = {
    recorded: inMonth.filter((r) => r.status === "recorded").length,
    attention: inMonth.filter((r) => r.status === "attention").length,
    noShift: inMonth.filter((r) => r.status === "no-shift").length,
  };
  const visible = filter === "all" ? inMonth : inMonth.filter((r) => (filter === "attention" ? r.status === "attention" : r.status === "recorded"));
  const page = visible.slice(0, shown);

  const pick = (m: string) => {
    setMonth(m);
    setShown(PAGE);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
        <div>
          <label htmlFor="att-month" className="ap-label mb-1.5 block">
            Month
          </label>
          <SelectMenu
            id="att-month"
            value={month}
            options={[{ value: "all", label: "All records" }, ...months.map((m) => ({ value: m, label: monthLabel(m) }))]}
            onChange={pick}
            className="h-11! text-[15px]!"
          />
        </div>
        <div>
          <label htmlFor="att-status" className="ap-label mb-1.5 block">
            Status
          </label>
          <SelectMenu
            id="att-status"
            value={filter}
            options={[
              { value: "all", label: "All statuses" },
              { value: "recorded", label: "Recorded" },
              { value: "attention", label: "Needs attention" },
            ]}
            onChange={(v) => {
              setFilter(v as StatusFilter);
              setShown(PAGE);
            }}
            className="h-11! text-[15px]!"
          />
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2" aria-label="Summary for the selected period">
        {(
          [
            ["Recorded", counts.recorded],
            ["Needs attention", counts.attention],
            ["No shift", counts.noShift],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="rounded-xl bg-(--ap-tint) px-3 py-2.5">
            <dd className="ap-serif text-[24px] leading-none text-(--ap-violet)">{v}</dd>
            <dt className="ap-sm mt-1 leading-tight">{k}</dt>
          </div>
        ))}
      </dl>

      {page.length === 0 ? (
        <EmptyState icon={History} title="No records here" description="Nothing matches this month and status. Try another month or choose All." />
      ) : (
        <ul className="flex flex-col gap-3">
          {page.map((r) => (
            <HistoryRow key={r.id} r={r} />
          ))}
        </ul>
      )}

      {visible.length > shown ? (
        <button type="button" onClick={() => setShown((n) => n + PAGE)} className="ap-btn ap-btn-s h-11 w-full">
          Show more ({visible.length - shown} left)
        </button>
      ) : visible.length > PAGE ? (
        <p className="ap-sm text-center">That&apos;s all {visible.length} records.</p>
      ) : null}
    </div>
  );
}

export function RecordChip({ status }: { status: AttendanceRecord["status"] }) {
  if (status === "attention") return <Chip tone="warn">Needs attention</Chip>;
  if (status === "no-shift") return <Chip tone="mute">No shift</Chip>;
  return <Chip tone="ok">Recorded</Chip>;
}

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading attendance history">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`${SK} h-[68px]`} />
      ))}
    </div>
  );
}

export function AttendanceLoading() {
  return (
    <>
      <PageHeading title="Attendance" subtitle="Check in for your shift and review your records." />
      <div className="flex flex-col gap-5 min-[1241px]:grid min-[1241px]:grid-cols-[380px_minmax(0,1fr)]">
        <div className={`${SK} h-[240px]`} />
        <div className={`${CARD} min-w-0`}>
          <HistorySkeleton />
        </div>
      </div>
    </>
  );
}
