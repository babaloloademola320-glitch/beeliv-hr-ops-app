"use client";

/**
 * The live part of /jobs (Jobs-Desktop.dc.html / Jobs-Mobile.dc.html):
 * search form, sidebar filters (desktop) / bottom sheet (mobile), the active
 * filter-chip row, the results list, and the Jobs-Empty-* fallback. Hero,
 * "Why Beeliv" and the candidate CTA are static and stay in page.tsx (server).
 */
import { SelectMenu } from "@/components/applicant/SelectMenu";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { BellIcon, CloseIcon, FiltersIcon, JobsSearchIcon, LocationPinIcon, SortIcon } from "../icons";
import { Reveal, SoftLink } from "../kit";
import { stagger } from "../primitives";
import {
  JOBS_ALERT_CARD,
  JOBS_FILTERS_UI,
  JOBS_QUICK_CHIPS,
  JOBS_SEARCH,
  LOCATIONS,
} from "@/lib/public-site/jobs-content";
import type { Job } from "@/lib/public-site/jobs";
import { jobDetailsFor } from "@/lib/public-site/job-details";
import { EMPTY_FILTERS, activeChips, filterJobs, toggleValue, type JobFilters } from "@/lib/public-site/jobs-filters";
import { EmptyState } from "./EmptyState";
import { FilterSheet } from "./FilterSheet";
import { FiltersPanel } from "./FiltersPanel";
import { JobCard } from "./JobCard";

type SortKey = "recent" | "salary";

export function JobsBrowser({ jobs }: { jobs: Job[] }) {
  const [filters, setFilters] = useState<JobFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("recent");
  const [sheetOpen, setSheetOpen] = useState(false);

  const results = useMemo(() => {
    const r = filterJobs(jobs, filters);
    if (sort === "recent") return [...r].sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
    // "Salary (high to low)": published top of range first; unlisted salaries last (stable).
    const top = (j: Job) => {
      const s = jobDetailsFor(j.id, j.department).salary;
      return s.max ?? s.min ?? -1;
    };
    return [...r].sort((a, b) => top(b) - top(a));
  }, [jobs, filters, sort]);

  const chips = activeChips(filters);
  const empty = results.length === 0;

  return (
    <>
      {/* ---- search form (Jobs-Desktop hero form / Jobs-Mobile hero form) --- */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="mx-auto flex max-w-[calc(1440*var(--u))] flex-col gap-3 px-5 pt-3 wf-d:px-[calc(96*var(--u))] wf-d:pb-2"
      >
        {/* Desktop: single card row (keyword + location + submit). */}
        <div className="ps-cd hidden grid-cols-[1.6fr_1fr_auto] gap-3 p-4 shadow-[0_14px_40px_rgba(17,17,27,.06)] wf-d:grid">
          <label className="jb-sch" htmlFor="jd-k">
            <JobsSearchIcon stroke="var(--muted-text)" />
            <input
              id="jd-k"
              placeholder={JOBS_SEARCH.keywordPlaceholder}
              value={filters.keyword}
              onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
            />
          </label>
          <label className="jb-sch pr-1.5" htmlFor="jd-l">
            <LocationPinIcon stroke="var(--muted-text)" />
            <SelectMenu
              id="jd-l"
              variant="bare"
              label="Location"
              value={filters.location}
              onChange={(v) => setFilters((f) => ({ ...f, location: v }))}
              options={[{ value: "", label: JOBS_SEARCH.locationAll }, ...LOCATIONS]}
            />
          </label>
          <button type="submit" className="ps-btn ps-bp px-9">
            {JOBS_SEARCH.submit}
          </button>
        </div>

        {/* Mobile: keyword field, Filters + Search row, quick department chips. */}
        <div className="flex flex-col gap-3 wf-d:hidden">
          <label className="jb-sch !h-[52px]" htmlFor="jm-k">
            <JobsSearchIcon stroke="var(--muted-text)" />
            <input
              id="jm-k"
              placeholder={JOBS_SEARCH.keywordPlaceholder}
              value={filters.keyword}
              onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              onClick={() => setSheetOpen(true)}
              className="ps-btn ps-bo bg-white"
            >
              <FiltersIcon stroke="var(--beeliv-purple)" />
              {JOBS_SEARCH.filtersButton}
            </button>
            <button type="submit" className="ps-btn ps-bp">
              {JOBS_SEARCH.submit}
            </button>
          </div>
          <div className="ps-swipe flex gap-2 pt-1">
            {JOBS_QUICK_CHIPS.map((d) => {
              const on = filters.departments.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilters((f) => ({ ...f, departments: toggleValue(f.departments, d) }))}
                  className="ps-chip flex h-[38px] shrink-0 items-center px-3.5 text-[15px] font-semibold"
                  style={on ? { background: "rgba(91,8,123,.1)", color: "var(--beeliv-purple)" } : undefined}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      </form>

      {/* ---------------------------- sidebar + results --------------------------- */}
      <section className="mx-auto max-w-[calc(1440*var(--u))] px-5 py-8 wf-d:grid wf-d:grid-cols-[320px_minmax(0,1fr)] wf-d:gap-10 wf-d:px-[calc(96*var(--u))] wf-d:pt-[calc(40*var(--u))] wf-d:pb-[calc(110*var(--u))]">
        {/* Desktop sidebar (hidden on mobile: filters live in the sheet instead). */}
        <aside className="hidden flex-col gap-5 wf-d:sticky wf-d:top-[calc(112*var(--u))] wf-d:flex wf-d:self-start">
          <div className="ps-cd px-[22px] pb-[22px]">
            <FiltersPanel filters={filters} onChange={setFilters} showKeyword={false} idPrefix="fd" />
          </div>
          <div className="flex flex-col gap-2.5 rounded-[18px] bg-(--deep-plum) p-[22px] text-white">
            <BellIcon stroke="var(--antique-gold)" />
            <b className="text-lg">{JOBS_ALERT_CARD.title}</b>
            <p className="text-[15px] leading-[1.5] text-white/80">{JOBS_ALERT_CARD.body}</p>
            <Link href={JOBS_ALERT_CARD.cta.href} className="ps-btn ps-bw !h-[46px]">
              {JOBS_ALERT_CARD.cta.label}
            </Link>
          </div>
        </aside>

        <div className="flex flex-col gap-4 pt-6 wf-d:pt-0">
          {!empty && (
            <>
              <div className="flex items-center justify-between">
                <b className="text-[18px] wf-d:text-[19px]">
                  {results.length} {results.length === 1 ? "role" : "roles"} available
                </b>
                <SortControl value={sort} onChange={setSort} />
              </div>

              {chips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {chips.map((chip) => (
                    <span key={chip.key} className="jb-fchip">
                      {chip.label}
                      <button
                        type="button"
                        aria-label={`Remove ${chip.label}`}
                        onClick={() => setFilters((f) => chip.remove(f))}
                      >
                        <CloseIcon size={14} strokeWidth={2} />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFilters(EMPTY_FILTERS)}
                    className="ml-1.5 text-sm font-bold"
                  >
                    {JOBS_FILTERS_UI.clearAll}
                  </button>
                </div>
              )}
            </>
          )}

          <AnimatePresence mode="wait">
            {empty ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EmptyState filters={filters} onChange={setFilters} />
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-4"
              >
                {results.map((job, i) => (
                  <Reveal key={job.id} delay={stagger(i, 0)} y={16}>
                    <JobCard job={job} />
                  </Reveal>
                ))}
                <SoftLink href="#" className="ps-btn ps-bo mt-2 self-center">
                  {JOBS_FILTERS_UI.loadMore}
                </SoftLink>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={filters}
        onChange={setFilters}
        resultCount={results.length}
      />
    </>
  );
}

function SortControl({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return (
    <>
      <label className="hidden items-center gap-2.5 text-[15px] wf-d:flex" htmlFor="jd-s">
        {JOBS_FILTERS_UI.sortLabel}
        <SelectMenu
          id="jd-s"
          variant="compact"
          className="!w-[190px]"
          value={value}
          onChange={(v) => onChange(v as SortKey)}
          options={[
            { value: "recent", label: JOBS_FILTERS_UI.sortMostRecent },
            { value: "salary", label: JOBS_FILTERS_UI.sortSalary },
          ]}
        />
      </label>
      <div className="relative inline-flex h-11 min-h-11 items-center gap-1.5 wf-d:hidden">
        <SortIcon size={18} stroke="var(--beeliv-purple)" />
        <SelectMenu
          label="Sort"
          variant="compact"
          align="right"
          value={value}
          onChange={(v) => onChange(v as SortKey)}
          options={[
            { value: "recent", label: JOBS_FILTERS_UI.sortMostRecent },
            { value: "salary", label: JOBS_FILTERS_UI.sortSalary },
          ]}
        />
      </div>
    </>
  );
}
