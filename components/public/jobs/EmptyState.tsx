"use client";

/**
 * Jobs-Empty-Desktop.dc.html / Jobs-Empty-Mobile.dc.html: shown in place of
 * the results list whenever the active filters produce zero matches. Desktop
 * centres everything; mobile left-aligns. The wireframe's boxed 420x320 /
 * full-width x260 illustration tile was dropped (project-lead direction) for
 * a plain search-lens glyph in a small round chip, sitting directly above
 * the "No roles match your search." headline.
 */
import Link from "next/link";
import { JobsSearchIcon } from "../icons";
import { Reveal } from "../kit";
import { JOBS_EMPTY, JOBS_SEARCH } from "@/lib/public-site/jobs-content";
import { EMPTY_FILTERS, type JobFilters } from "@/lib/public-site/jobs-filters";

export function EmptyState({
  filters,
  onChange,
}: {
  filters: JobFilters;
  onChange: (next: JobFilters) => void;
}) {
  return (
    <div className="flex flex-col items-start gap-5 py-8 text-left wf-d:items-center wf-d:gap-[22px] wf-d:py-4 wf-d:text-center">
      <label className="jb-sch mt-1 w-full wf-d:max-w-[720px]" htmlFor="je-k">
        <JobsSearchIcon stroke="var(--muted-text)" />
        <input
          id="je-k"
          value={filters.keyword}
          onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
          placeholder={JOBS_SEARCH.keywordPlaceholder}
        />
      </label>

      <Reveal className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[rgba(91,8,123,.08)] wf-d:h-20 wf-d:w-20">
        <JobsSearchIcon size={32} strokeWidth={1.5} stroke="var(--beeliv-purple)" />
      </Reveal>

      <h1 className="ps-serif [--fs-d:48] [--fs-m:30]">
        {JOBS_EMPTY.headlineLead} <span className="text-(--beeliv-purple) not-italic">{JOBS_EMPTY.headlineAccent}</span>
      </h1>
      <p className="ps-bd max-w-none wf-d:max-w-[46ch]">{JOBS_EMPTY.body}</p>

      <div className="flex w-full flex-col gap-3 wf-d:w-auto wf-d:flex-row wf-d:gap-3">
        <button type="button" onClick={() => onChange(EMPTY_FILTERS)} className="ps-btn ps-bp">
          {JOBS_EMPTY.clearFilters}
        </button>
        <button type="button" onClick={() => onChange(EMPTY_FILTERS)} className="ps-btn ps-bo">
          {JOBS_EMPTY.browseAll}
        </button>
      </div>

      <div className="flex flex-col items-start gap-2.5 pt-2 wf-d:items-center">
        <span className="ps-sm">{JOBS_EMPTY.popularSearchesLabel}</span>
        <div className="flex flex-wrap justify-start gap-2 wf-d:justify-center">
          {JOBS_EMPTY.popularSearches.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onChange({ ...EMPTY_FILTERS, keyword: term })}
              className="ps-chip flex h-[38px] items-center px-3.5 text-[15px]"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      <Link href={JOBS_EMPTY.alertLink.href} className="pt-1.5 text-base font-bold">
        {JOBS_EMPTY.alertLink.label}
      </Link>
    </div>
  );
}
