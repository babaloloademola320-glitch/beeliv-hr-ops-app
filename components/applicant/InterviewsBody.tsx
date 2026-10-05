"use client";

/**
 * Interviews & Assessments — wireframe ivPage() (beeliv-website/applicant/index.html).
 * Upcoming: one `.ivc` card per scheduled interview (88px `.bigcal` date
 * tile, serif title, meta rows, "Before you join" prep list, actions).
 * Completed: `.done-row` list. Dates come from the real computed timestamps
 * (so the weekday is always correct), shown in WAT like the wireframe.
 */
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  BriefcaseBusiness,
  Calendar,
  CalendarCheck,
  Check,
  Clock3,
  FileCheck2,
  Phone,
  UserRound,
  Users,
  Video,
  type LucideIcon,
} from "@/components/applicant/icons";
import { toast } from "@/components/ui/toast";
import { useApplicantStore } from "@/lib/applicant/service";
import type { Interview, InterviewKind } from "@/lib/applicant/types";
import { Chip, EmptyState } from "./primitives";
import { fmtDay, interviewTile, interviewTimeRange, RowIcon, ScreenHeading, TabBar } from "./applications/shared";
import { Reveal } from "./motion";
import { CARD, sectionTitleClass } from "./SectionCard";

type Tab = "up" | "done";

/**
 * Glyph per interview stage (Module 1 §5): HR screening, Beeliv interview,
 * client/business interview, practical assessment. Shared with Application detail.
 */
export const INTERVIEW_KIND_ICON: Record<InterviewKind, LucideIcon> = {
  Screening: Phone,
  Interview: UserRound,
  "Client interview": Users,
  "Practical assessment": FileCheck2,
};

/** Applicant-facing stage label (the stored kind, spelled out where it helps). */
export const INTERVIEW_KIND_LABEL: Record<InterviewKind, string> = {
  Screening: "HR screening",
  Interview: "Beeliv interview",
  "Client interview": "Client interview",
  "Practical assessment": "Practical assessment",
};

export function InterviewsBody() {
  const store = useApplicantStore();
  const [tab, setTab] = useState<Tab>("up");
  const upcoming = store.interviews
    .filter((v) => v.status === "scheduled")
    .sort((a, b) => ((a.scheduledAt ?? "") < (b.scheduledAt ?? "") ? -1 : 1));
  const completed = store.interviews
    .filter((v) => v.status === "completed")
    .sort((a, b) => ((a.completedAt ?? "") > (b.completedAt ?? "") ? -1 : 1));

  return (
    <div>
      <ScreenHeading title="Interviews & Assessments" subtitle="Your scheduled and completed interviews and assessments." />

      <div className="mb-4.5">
        <TabBar
          label="Filter interviews"
          tabs={[
            { key: "up" as Tab, label: "Upcoming", count: upcoming.length },
            { key: "done" as Tab, label: "Completed", count: completed.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === "up" ? (
        upcoming.length ? (
          <div className="flex flex-col gap-5">
            {upcoming.map((v) => (
              <InterviewCard key={v.id} v={v} />
            ))}
          </div>
        ) : (
          <div className={CARD}>
            <EmptyState
              icon={Calendar}
              title="No interviews scheduled"
              description="When an interview or assessment is scheduled, you'll find the details here. Not every role has an interview stage."
              action={
                <Link href="/applicant/applications" className="ap-btn ap-btn-s ap-btn-sm mt-1.5">
                  View my applications
                </Link>
              }
            />
          </div>
        )
      ) : completed.length ? (
        <Reveal as="section" className={CARD}>
          {completed.map((v, i) => (
            <div
              key={v.id}
              className={`grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3.5 py-3.5 max-[640px]:grid-cols-[40px_minmax(0,1fr)] ${
                i === 0 ? "pt-0" : "border-t border-(--ap-line-2)"
              }`}
            >
              <RowIcon icon={Check} tone="ok" />
              <div className="min-w-0">
                <b className="ap-title block">{v.title}</b>
                <span className="ap-sm">
                  {INTERVIEW_KIND_LABEL[v.kind] ?? v.kind} · {v.applicationLabel} · {v.completedAt ? fmtDay(v.completedAt) : ""}
                </span>
              </div>
              <span className="max-[640px]:col-start-2 max-[640px]:justify-self-start">
                <Chip tone="ok">Completed</Chip>
              </span>
            </div>
          ))}
          <p className="mt-3.5 text-[13px] text-(--ap-muted)">Interview notes and scores stay with the Beeliv team.</p>
        </Reveal>
      ) : (
        <div className={CARD}>
          <EmptyState icon={CalendarCheck} title="Nothing completed yet" description="Completed interviews and assessments are listed here." />
        </div>
      )}
    </div>
  );
}

function InterviewCard({ v }: { v: Interview }) {
  const tile = v.scheduledAt ? interviewTile(v.scheduledAt) : null;
  const [asked, setAsked] = useState(false);

  function join() {
    // Prototype: no meeting link exists yet (no video-call integration is in scope).
    toast.add({ title: "The Join button activates 15 minutes before the start time" });
  }

  function addToCalendar() {
    if (!v.scheduledAt) return;
    downloadIcs(v);
    toast.add({ title: "Added to your calendar", description: "Open the downloaded file to save it in your calendar app.", type: "success" });
  }

  function reschedule() {
    setAsked(true);
    toast.add({ title: "Your message was sent to the Beeliv team", description: "They'll contact you to agree a new time.", type: "success" });
  }

  return (
    <Reveal as="section" className={`${CARD} grid grid-cols-[88px_minmax(0,1fr)] gap-5 max-[767px]:grid-cols-1`}>
      {tile ? (
        <div
          className="h-max overflow-hidden rounded-2xl border border-(--ap-line) bg-white text-center max-[767px]:grid max-[767px]:grid-cols-[auto_auto_1fr] max-[767px]:items-center max-[767px]:gap-2.5 max-[767px]:pr-3 max-[767px]:text-left"
          aria-label={`${tile.weekday} ${tile.day} ${tile.month}`}
        >
          <small className="block bg-(--ap-violet) py-1.5 text-[13px] font-bold tracking-[0.12em] text-white max-[767px]:px-2.5 max-[767px]:py-3.5">
            {tile.month}
          </small>
          <b className="block pt-2.5 pb-0.5 text-[34px] leading-none font-bold tracking-[-0.01em] tabular-nums max-[767px]:p-0 max-[767px]:text-2xl">
            {tile.day}
          </b>
          <span className="block pb-2.5 text-[13px] text-(--ap-muted) max-[767px]:p-0">{tile.weekday}</span>
        </div>
      ) : null}
      <div className="min-w-0">
        <Chip tone="violet" icon={INTERVIEW_KIND_ICON[v.kind]}>
          {INTERVIEW_KIND_LABEL[v.kind] ?? v.kind}
        </Chip>
        <h2 className={`${sectionTitleClass()} mt-2.5`}>{v.title}</h2>
        <div className="mt-3 mb-4 flex flex-col gap-1.5 text-sm text-(--ap-ink-2)">
          <MetaRow icon={BriefcaseBusiness}>{v.applicationLabel}</MetaRow>
          {v.scheduledAt ? <MetaRow icon={Clock3}>{interviewTimeRange(v.scheduledAt, v.durationMinutes)}</MetaRow> : null}
          {v.mode ? <MetaRow icon={Video}>{v.mode}</MetaRow> : null}
          {v.withWhom ? <MetaRow icon={UserRound}>{v.withWhom}</MetaRow> : null}
        </div>
        {v.prep?.length ? (
          <>
            <div className="ap-eb mt-1 mb-3">Before you join</div>
            <ul className="mb-4.5 flex list-none flex-col gap-2 rounded-xl bg-(--ap-tint) px-4 py-3.5">
              {v.prep.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm text-(--ap-ink-2)">
                  <Check className="size-4 shrink-0 text-(--ap-violet)" strokeWidth={1.8} aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <div className="flex flex-wrap gap-2.5 max-[767px]:[&>button]:flex-1">
          <button type="button" onClick={join} className="ap-btn ap-btn-p text-[15px] font-semibold">
            <Video className="size-4.5" strokeWidth={1.6} aria-hidden="true" /> Join interview
          </button>
          <button type="button" onClick={addToCalendar} className="ap-btn ap-btn-s text-[15px] font-semibold">
            <Calendar className="size-4.5" strokeWidth={1.6} aria-hidden="true" /> Add to calendar
          </button>
          <button
            type="button"
            onClick={reschedule}
            disabled={asked}
            className="ap-btn bg-[#f1eff3] text-[15px] font-semibold text-(--ap-ink) hover:bg-(--ap-line)"
          >
            {asked ? "Reschedule requested" : "Need to reschedule?"}
          </button>
        </div>
      </div>
    </Reveal>
  );
}

function MetaRow({ icon: Icon, children }: { icon: typeof Clock3; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <Icon className="size-4.25 shrink-0 text-(--ap-muted)" strokeWidth={1.6} aria-hidden="true" />
      {children}
    </span>
  );
}

/** Builds a standard .ics file for the interview and downloads it (no dependency, no network). */
function downloadIcs(v: Interview) {
  if (!v.scheduledAt) return;
  const start = new Date(v.scheduledAt);
  const end = new Date(start.getTime() + (v.durationMinutes ?? 45) * 60_000);
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Beeliv Hospitality//Applicant//EN",
    "BEGIN:VEVENT",
    `UID:${v.id}@beeliv-applicant`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(`${v.title} · ${v.applicationLabel}`)}`,
    `DESCRIPTION:${esc([v.mode, v.withWhom].filter(Boolean).join(" — "))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "beeliv-interview.ics";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
