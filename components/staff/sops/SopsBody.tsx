"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, ChevronRight, FileText, Video } from "@/components/applicant/icons";
import { FilterTabs } from "@/components/applicant/FilterTabs";
import { Chip, EmptyState, PageHeading, ProgressBar } from "@/components/applicant/primitives";
import { CARD, IconTile, SectionCard } from "@/components/applicant/SectionCard";
import { dayMonth, dueLabel } from "@/lib/staff/format";
import { useSOPs, useTraining } from "@/lib/staff/hooks";
import type { LearningStatus } from "@/lib/staff/types";
import { BookOpen } from "../icons";
import { ImageRoom } from "../ImageRoom";
import { HeadingSkeleton, PageError, SK } from "../leave/states";
import { byPriority, toEntries } from "./learning";

const TABS: { key: LearningStatus; label: string }[] = [
  { key: "assigned", label: "Assigned" },
  { key: "in-progress", label: "In progress" },
  { key: "completed", label: "Completed" },
];

export function SopsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading SOPs and training">
      <HeadingSkeleton title="SOPs & Training" />
      <div className="grid grid-cols-1 gap-5 min-[1241px]:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5">
          <div className={`${SK} h-11 w-[340px] max-w-full`} />
          <div className={`${SK} h-[110px]`} />
          <div className={`${SK} h-[110px]`} />
          <div className={`${SK} h-[110px]`} />
        </div>
        <div className={`${SK} hidden h-[220px] min-[1241px]:block`} />
      </div>
    </div>
  );
}

/** SOPs & Training list: Assigned / In progress / Completed, each row opens its detail page. */
export function SopsBody() {
  const sops = useSOPs();
  const training = useTraining();
  const [picked, setPicked] = useState<LearningStatus | null>(null);

  if (sops.status === "loading" || training.status === "loading") return <SopsSkeleton />;

  const heading = <PageHeading title="SOPs & Training" subtitle="Standards and learning assigned to you." />;
  if (sops.status === "error" || training.status === "error") {
    return (
      <>
        {heading}
        <PageError what="your SOPs and training" retry={() => { sops.retry(); training.retry(); }} />
      </>
    );
  }

  const all = toEntries(sops.data ?? [], training.data ?? []).sort(byPriority);
  if (all.length === 0) {
    return (
      <>
        {heading}
        <div className={CARD}>
          <EmptyState icon={BookOpen} title="Nothing assigned yet" description="SOPs and training that Beeliv assigns to you appear here." />
        </div>
      </>
    );
  }

  const count = (s: LearningStatus) => all.filter((e) => e.status === s).length;
  // Default to the first tab that has something in it.
  const tab = picked ?? TABS.find((t) => count(t.key) > 0)?.key ?? "assigned";
  const shown = all.filter((e) => e.status === tab);

  return (
    <>
      {heading}
      <div className="flex flex-col gap-5 min-[1241px]:grid min-[1241px]:grid-cols-[minmax(0,1fr)_340px] min-[1241px]:items-start">
        <SectionCard title="My learning" className="min-w-0">
          <FilterTabs label="Filter by progress" className="mb-4" value={tab} onChange={setPicked} options={TABS.map((t) => ({ ...t, count: count(t.key) }))} />
          {shown.length === 0 ? (
            <EmptyState icon={BookOpen} title={tab === "completed" ? "Nothing completed yet" : "Nothing in this list"} description="SOPs and training assigned to you will show up here." />
          ) : (
            <ul className="flex flex-col gap-3">
              {shown.map((e) => (
                <li key={e.id}>
                  <Link href={`/staff/sops-training/${e.id}`} className="block rounded-2xl border border-(--ap-line-2) p-3.5 transition-colors hover:border-(--ap-tint-2) hover:bg-(--ap-tint-soft)">
                    <div className="flex items-center gap-3">
                      <IconTile icon={e.kind === "sop" ? FileText : Video} tone="v" />
                      <div className="min-w-0 flex-1">
                        <b className="ap-title block leading-snug">{e.title}</b>
                        <span className="ap-label block text-(--ap-muted)">
                          {e.kind === "sop" ? "SOP" : "Training"} - {e.category} - {e.meta}
                        </span>
                      </div>
                      {e.required ? <Chip tone="warn">Required</Chip> : null}
                      <ChevronRight className="size-4 shrink-0 text-(--ap-faint) max-[420px]:hidden" aria-hidden="true" />
                    </div>
                    {/* Call to action, prominent (project lead): Start / Continue · N% / Completed.
                        The whole card is the link, so the "button" is a styled span. */}
                    <div className="mt-3.5 flex items-center gap-3 border-t border-(--ap-line-2) pt-3.5 max-[480px]:flex-col max-[480px]:items-stretch">
                      {e.status === "completed" ? (
                        <>
                          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-(--ap-ok-bg) px-3 py-1.5 text-[13px] font-bold text-(--ap-ok)">
                            <Check className="size-4" strokeWidth={2.6} aria-hidden="true" />
                            Completed{e.completedAt ? ` ${dayMonth(e.completedAt.slice(0, 10))}` : ""}
                          </span>
                          <span className="ap-label ml-auto inline-flex items-center gap-1 font-bold text-(--ap-violet) max-[480px]:ml-0">
                            Read again <ArrowRight className="size-3.5" aria-hidden="true" />
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <span className={`ap-label ${e.dueDate && e.required ? "font-bold text-(--ap-warn)" : "text-(--ap-muted)"}`}>{e.dueDate ? dueLabel(e.dueDate) : "No due date"}</span>
                              {e.progress > 0 ? <span className="ap-label font-bold text-(--ap-violet)">{e.progress}%</span> : null}
                            </div>
                            {e.progress > 0 ? (
                              <div className="mt-1.5">
                                <ProgressBar percent={e.progress} label={`${e.title} progress`} />
                              </div>
                            ) : null}
                          </div>
                          <span className="ap-btn ap-btn-p h-11 shrink-0 px-5 text-white! shadow-[0_8px_18px_-8px_rgba(79,58,168,.7)] max-[480px]:w-full">
                            {e.progress === 0 ? (e.kind === "sop" ? "Start SOP" : "Start training") : "Continue"}
                            <ArrowRight className="size-4" aria-hidden="true" />
                          </span>
                        </>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
        <SectionCard title="How it works" aside className="min-w-0">
          <ImageRoom src={null} icon={BookOpen} className="mb-4 h-[120px] w-full rounded-2xl" iconClassName="size-10" />
          <p className="ap-sm text-(--ap-muted)">Open an item to read it, then acknowledge or complete it. Beeliv assigns SOPs and training by your role, outlet and assignment.</p>
        </SectionCard>
      </div>
    </>
  );
}
