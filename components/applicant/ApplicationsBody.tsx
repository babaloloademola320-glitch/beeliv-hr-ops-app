"use client";

/**
 * My Applications — wireframe appsPage() (beeliv-website/applicant/index.html).
 * Tabs All / Draft / Active / Completed with live counts; one `.acard` per
 * application; genuine empty states per tab ("new" prototype mode = none).
 */
import Link from "next/link";
import { useState } from "react";
import { DraftProgress } from "./CountUp";
import { ArrowRight, BriefcaseBusiness, CircleAlert, Clock3, FileText, MapPin, Users } from "@/components/applicant/icons";
import { useApplicantStore } from "@/lib/applicant/service";
import type { Application, Interview } from "@/lib/applicant/types";
import { Chip, EmptyState } from "./primitives";
import { applicationStatus, CoMonogram, isTerminal, ScreenHeading, TabBar, updatedLine } from "./applications/shared";
import { Reveal } from "./motion";
import { markClass } from "./mark";

type TabKey = "all" | "draft" | "active" | "completed";

function tabGroup(app: Application): Exclude<TabKey, "all"> {
  if (app.lifecycle === "draft") return "draft";
  if (app.lifecycle === "submitted") return "active";
  return "completed"; // withdrawn / not_selected / in_talent_pool / completed
}

const TAB_LABELS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

const EMPTY_COPY: Record<TabKey, { title: string; description: string }> = {
  all: { title: "No applications yet", description: "Find a role that matches your experience and start your application." },
  draft: { title: "Nothing in this list", description: "Applications you start but haven't submitted yet are kept here." },
  active: { title: "Nothing in this list", description: "Submitted applications move here while Beeliv is working on them." },
  completed: { title: "Nothing in this list", description: "Closed applications stay here, including ones kept in the talent pool." },
};

export function ApplicationsBody() {
  const store = useApplicantStore();
  const [tab, setTab] = useState<TabKey>("all");
  const apps = store.applications;
  const groups: Record<TabKey, Application[]> = {
    all: apps,
    draft: apps.filter((a) => tabGroup(a) === "draft"),
    active: apps.filter((a) => tabGroup(a) === "active"),
    completed: apps.filter((a) => tabGroup(a) === "completed"),
  };
  const list = groups[tab];

  return (
    <div>
      <ScreenHeading title="My Applications" subtitle="Every application you start or submit. Closed ones stay here too." />

      <div className="mb-4.5">
        <TabBar
          label="Filter applications"
          tabs={TAB_LABELS.map((t) => ({ ...t, count: groups[t.key].length }))}
          active={tab}
          onChange={setTab}
        />
      </div>

      {list.length === 0 ? (
        <div className="ap-card p-6 max-[767px]:px-4.5 max-[767px]:py-5">
          <EmptyState
            icon={FileText}
            title={EMPTY_COPY[tab].title}
            description={EMPTY_COPY[tab].description}
            action={
              <Link href="/applicant/jobs" className="ap-btn ap-btn-p ap-btn-sm mt-1.5">
                Browse jobs <ArrowRight className="size-4.5" aria-hidden="true" />
              </Link>
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((a) => (
            <ApplicationCard key={a.id} application={a} interviews={store.interviews} />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({ application: a, interviews }: { application: Application; interviews: Interview[] }) {
  const { label, tone } = applicationStatus(a, interviews);
  const isDraft = a.lifecycle === "draft";
  const closed = isTerminal(a);
  const pct = Math.max(0, Math.min(100, a.draftPercent ?? 0));

  const cta = isDraft ? (
    <Link href={a.vacancyId ? `/applicant/apply?job=${a.vacancyId}` : "/applicant/apply"} className="ap-btn ap-btn-p text-[15px] font-semibold">
      Continue application <ArrowRight className="size-4.5" aria-hidden="true" />
    </Link>
  ) : (
    <Link href={`/applicant/applications/${a.id}`} className="ap-btn ap-btn-p text-[15px] font-semibold">
      {closed ? "View details" : "View progress"}
      {closed ? null : <ArrowRight className="size-4.5" aria-hidden="true" />}
    </Link>
  );

  // Phones: stacked like a job-board card (status first, then role, company, place, a muted line, full-width action).
  // Desktop keeps the row layout below.
  return (
    <>
      <Reveal as="article" className="rounded-[20px] border border-(--ap-line) bg-white p-4 min-[768px]:hidden">
        <Chip tone={tone}>{label}</Chip>
        <b className="mt-3 block text-[18px] leading-snug">{a.role}</b>
        <p className="mt-1 text-[16px] text-(--ap-ink-2)">{a.company}</p>
        <p className="text-[16px] text-(--ap-ink-2)">{a.location}</p>
        <p className="mt-2.5 text-[15px] text-(--ap-muted)">
          {updatedLine(a)} · {a.employmentType}
        </p>
        {isDraft ? (
          <div className="mt-3">
            <DraftProgress value={pct} />
          </div>
        ) : a.next ? (
          <p className="mt-3 flex items-start gap-2 text-[15px] text-(--ap-ink-2)">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-(--ap-warn)" strokeWidth={1.8} aria-hidden="true" />
            <span className={markClass(a.next.tone)}>{a.next.label}</span>
          </p>
        ) : a.lifecycle === "in_talent_pool" ? (
          <p className="mt-3 flex items-start gap-2 text-[15px]">
            <Users className="mt-0.5 size-4 shrink-0 text-(--ap-ink-2)" strokeWidth={1.8} aria-hidden="true" />
            <span className="ap-mark ap-mark-violet">Kept in the talent pool for similar roles</span>
          </p>
        ) : null}
        <div className="mt-4 [&>a]:h-12 [&>a]:w-full">{cta}</div>
      </Reveal>
    <Reveal as="article" className="max-[767px]:hidden grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-(--ap-line) bg-white p-4.5 max-[767px]:grid-cols-[48px_minmax(0,1fr)] max-[767px]:p-4">
      <CoMonogram name={a.company} fontSize={17} className="size-14 max-[767px]:size-12" />
      <div className="min-w-0">
        <b className="text-[16.5px]">{a.role}</b>
        <div className="ap-sm mt-1 flex flex-wrap gap-x-3.5 gap-y-1">
          <span className="inline-flex items-center gap-1.25">
            <BriefcaseBusiness className="size-3.5" strokeWidth={1.6} aria-hidden="true" /> {a.company}
          </span>
          <span className="inline-flex items-center gap-1.25">
            <MapPin className="size-3.5" strokeWidth={1.6} aria-hidden="true" /> {a.location}
          </span>
          <span className="inline-flex items-center gap-1.25">
            <Clock3 className="size-3.5" strokeWidth={1.6} aria-hidden="true" /> {a.employmentType}
          </span>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-2 max-[640px]:gap-y-1.5">
          <Chip tone={tone}>{label}</Chip>
          <span className="text-[13px] text-(--ap-muted)">{updatedLine(a)}</span>
          {isDraft ? (
            <DraftProgress value={pct} />
          ) : a.next ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-(--ap-ink-2)">
              <CircleAlert className="size-3.75 shrink-0 text-(--ap-warn)" strokeWidth={1.6} aria-hidden="true" />
              <span className={markClass(a.next.tone)}>{a.next.label}</span>
            </span>
          ) : a.lifecycle === "in_talent_pool" ? (
            <span className="inline-flex items-center gap-1.5 text-sm">
              <Users className="size-3.75 shrink-0" strokeWidth={1.8} aria-hidden="true" />
              <span className="ap-mark ap-mark-violet">Kept in the talent pool for similar roles</span>
            </span>
          ) : null}
        </div>
      </div>
      <div className="max-[767px]:col-span-full max-[767px]:[&>a]:h-11.5 max-[767px]:[&>a]:w-full">{cta}</div>
    </Reveal>
    </>
  );
}
