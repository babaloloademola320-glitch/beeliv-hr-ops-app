"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase, ChevronRight, Plus, UsersRound } from "@/components/applicant/icons";
import { FilterTabs } from "@/components/applicant/FilterTabs";
import { AnalyticsLink } from "../AnalyticsLink";
import { PageHeading } from "@/components/applicant/primitives";
import { useCandidates, useRecruitmentSummary } from "@/lib/client/hooks";
import { dayMonth, plural } from "@/lib/client/format";
import { NEW_REQUEST_HREF, analyticsFamilyHref, requestHref } from "@/lib/client/links";
import { useOutletState } from "@/lib/client/outlet";
import type { CandidateFeedback, CandidateReview, RecruitmentPosition } from "@/lib/client/types";
import { PersonPhoto } from "../PersonPhoto";
import { StatusChip } from "../StatusChip";
import { AnalyticsPanel, ChartEmptyState } from "../charts";
import { FeedbackChip, POSITION_STATE_TONE } from "./meta";
import { PageError, PageSkeleton } from "./states";
import { CANDIDATE_FILTERS, type CandidateFilter } from "./filters";

const LABEL: Record<CandidateFilter, string> = {
  all: "All",
  "awaiting-feedback": "Awaiting feedback",
  interested: "Interested",
  "interview-requested": "Interview requested",
  "not-suitable": "Not suitable",
};

const matches = (c: CandidateReview, f: CandidateFilter) => (f === "all" ? true : f === "awaiting-feedback" ? c.feedback === null : c.feedback === (f as CandidateFeedback));

function positionChip(p: RecruitmentPosition): string {
  if (p.state === "candidates-ready") return `${plural(p.candidatesReady, "candidate")} ready for your review`;
  if (p.state === "screening") return `${p.candidatesScreening} in screening`;
  return "Recruitment in progress";
}

/**
 * Recruitment / Candidates (brief section 15). Client-relevant view only: per
 * role, how hiring is going; and the candidates Beeliv HR deliberately
 * submitted for review. Beeliv's internal pipeline (applications, interviews,
 * offers) is never recreated here, and screening candidates are a count with
 * no names.
 */
export function RecruitmentBody({ initialFilter }: { initialFilter: CandidateFilter }) {
  const summary = useRecruitmentSummary();
  const cands = useCandidates();
  const outlet = useOutletState();
  const [filter, setFilter] = useState<CandidateFilter>(initialFilter);
  const showOutlet = outlet.outlets.length > 1 && outlet.scope === "all";

  if (summary.status === "loading" || cands.status === "loading") return <PageSkeleton title="Recruitment / Candidates" label="Loading recruitment" blocks={[180, 420]} />;
  if (summary.status === "error" || cands.status === "error") {
    return (
      <PageError
        heading="Recruitment / Candidates"
        title="We couldn't load recruitment"
        retry={() => {
          summary.retry();
          cands.retry();
        }}
      />
    );
  }

  const positions = summary.data?.positions ?? [];
  const list = cands.data ?? [];
  const shown = list.filter((c) => matches(c, filter));
  const outletName = (id: string) => outlet.outlets.find((o) => o.id === id)?.name ?? "";
  const nothing = positions.length === 0 && list.length === 0;
  const count = (f: CandidateFilter) => list.filter((c) => matches(c, f)).length;

  return (
    <div>
      <PageHeading
        title="Recruitment / Candidates"
        subtitle="Candidates Beeliv has submitted for your review, and how your hiring is progressing."
        right={
          <div className="flex items-center gap-2 max-[480px]:w-full max-[480px]:flex-col-reverse max-[480px]:items-stretch">
          <AnalyticsLink href={analyticsFamilyHref("recruitment")} label="View analytics" />
          <Link href={NEW_REQUEST_HREF} className="ap-btn ap-btn-p h-11 text-white! max-[480px]:w-full">
            <Plus className="size-4" aria-hidden="true" /> Request staff
          </Link>
          </div>
        }
      />

      {nothing ? (
        <AnalyticsPanel title="No recruitment activity">
          <ChartEmptyState
            icon={Briefcase}
            title="Nothing to review yet"
            description="When you ask Beeliv for staff, the progress of each request and any candidates Beeliv submits for you appear here."
            action={
              <Link href={NEW_REQUEST_HREF} className="ap-btn ap-btn-p ap-btn-sm mt-1 text-white!">
                <Plus className="size-4" aria-hidden="true" /> Request staff
              </Link>
            }
          />
        </AnalyticsPanel>
      ) : (
        <div className="flex flex-col gap-4 min-[768px]:gap-5">
          <AnalyticsPanel title="Recruitment & staffing needs" subtitle={`${plural(summary.data?.openPositions ?? 0, "open position")} · ${summary.data?.awaitingFeedback ?? 0} awaiting your feedback`}>
            {positions.length === 0 ? (
              <p className="text-[14px] text-(--ap-muted)">No roles are in recruitment right now.</p>
            ) : (
              <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 min-[768px]:grid-cols-2 min-[1241px]:grid-cols-3">
                {positions.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={p.state === "candidates-ready" ? "#candidates" : p.requestId ? requestHref(p.requestId) : NEW_REQUEST_HREF}
                      onClick={p.state === "candidates-ready" ? () => setFilter("awaiting-feedback") : undefined}
                      className="flex h-full min-h-[104px] flex-col justify-between gap-3 rounded-xl border border-(--ap-line-2) bg-(--ap-tint-soft) p-3.5 hover:border-(--ap-tint-2)"
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="min-w-0 leading-tight">
                          <b className="block text-[15px] text-(--ap-ink)">{p.title}</b>
                          <span className="mt-0.5 block truncate text-[13px] text-(--ap-muted)">
                            {showOutlet ? `${p.outletName} · ` : ""}
                            {plural(p.openings, "opening")}
                          </span>
                        </span>
                        <ChevronRight className="mt-0.5 size-4 shrink-0 text-(--ap-faint)" aria-hidden="true" />
                      </span>
                      <span>
                        <StatusChip tone={POSITION_STATE_TONE[p.state]}>{positionChip(p)}</StatusChip>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AnalyticsPanel>

          <div id="candidates" className="scroll-mt-[90px]">
            <AnalyticsPanel anchor="records" title="Candidates for your review" subtitle="Submitted by Beeliv HR. Your feedback informs Beeliv - it does not approve or hire anyone.">
              {list.length === 0 ? (
                <ChartEmptyState icon={UsersRound} title="No candidates submitted yet" description="Beeliv shortlists and screens first. When candidates are ready for you, they appear here and we let you know." height={150} />
              ) : (
                <>
                  <FilterTabs
                    className="mb-4"
                    label="Filter candidates"
                    value={filter}
                    onChange={(f) => {
                      setFilter(f);
                      window.history.replaceState(null, "", f === "all" ? "/client/recruitment" : `/client/recruitment?status=${f}`);
                    }}
                    options={CANDIDATE_FILTERS.map((f) => ({ key: f, label: LABEL[f], count: count(f) }))}
                  />
                  {shown.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-(--ap-line) bg-(--ap-tint-soft) px-4 py-6 text-[14px] text-(--ap-muted)">No candidates match this filter.</p>
                  ) : (
                    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                      {shown.map((c) => (
                        <li key={c.id}>
                          <Link href={`/client/recruitment/${c.id}`} className="flex items-start gap-3 rounded-xl border border-(--ap-line-2) bg-(--ap-tint-soft) p-3.5 hover:border-(--ap-tint-2)">
                            <PersonPhoto name={c.name} size={44} />
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                                <b className="text-[15px] text-(--ap-ink)">{c.name}</b>
                                <FeedbackChip feedback={c.feedback} />
                              </span>
                              <span className="mt-0.5 block text-[13px] text-(--ap-muted)">
                                {c.position}
                                {showOutlet ? ` · ${outletName(c.outletId)}` : ""} · Submitted {dayMonth(c.submittedOn)}
                              </span>
                              <span className="mt-1.5 block text-[14px] leading-snug text-(--ap-ink-2)">{c.experienceSummary}</span>
                              <span className="mt-2 flex flex-wrap gap-1.5">
                                {c.skills.slice(0, 3).map((s) => (
                                  <span key={s} className="rounded-full bg-(--ap-line-2) px-2.5 py-0.5 text-[12px] font-semibold text-(--ap-ink-2)">
                                    {s}
                                  </span>
                                ))}
                              </span>
                            </span>
                            <ChevronRight className="mt-3 size-4 shrink-0 text-(--ap-faint)" aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </AnalyticsPanel>
          </div>
        </div>
      )}
    </div>
  );
}
