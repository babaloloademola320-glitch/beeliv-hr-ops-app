"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { ArrowRight, Bookmark, BriefcaseBusiness, Check, ChevronLeft, Clock3, MapPin, Share, ShieldCheck } from "@/components/applicant/icons";
import type { ApplicantJob as Job } from "@/lib/applicant/jobs";
import { useApplicantStore } from "@/lib/applicant/service";
import { useSavedJobs } from "@/lib/applicant/saved";
import { screeningQuestionsFor } from "@/lib/applicant/screening";
import { experienceLabel, formatLongDate, salaryLabel } from "@/lib/public-site/job-details";
import { DETAIL_TITLE, JobThumb } from "./primitives";
import { JobChips } from "./jobs/JobCard";
import { SaveJobButton, ShareJobButton, shareJob, toggleSaveWithToast } from "./jobs/SaveJobButton";
import { LIST_SEARCH_KEY } from "./jobs/filters";
import { Reveal } from "./motion";
import { FactGrid, JobDetailSections } from "./jobs/JobDetailSections";

const noopSubscribe = () => () => {};
function readListSearch(): string {
  try {
    return window.sessionStorage.getItem(LIST_SEARCH_KEY) ?? "";
  } catch {
    return ""; // sessionStorage unavailable - plain list link.
  }
}

/** Header status chip (§2.13): only the applicant-visible states that need calling out. */
function StatusChip({ status }: { status: Job["status"] }) {
  if (status === "Closing soon") return <span className="ap-chip ap-chip-warn">Closing soon</span>;
  if (status === "Filled") return <span className="ap-chip ap-chip-mute">Position filled</span>;
  if (status === "Closed") return <span className="ap-chip ap-chip-mute">Closed to new applicants</span>;
  return null;
}

/**
 * Wireframe jobPage(), extended to the requirements doc's §2.15 job-listing
 * structure (docs/requirements/beeliv-recruitment-and-job-listings-2026-09-29.md):
 * header facts in the "Job overview" card, then the body sections in
 * ./jobs/JobDetailSections.tsx. Vacancy content is SAMPLE data
 * (lib/public-site/job-details.ts).
 */
export function JobBody({ job }: { job: Job }) {
  const store = useApplicantStore();
  const saved = useSavedJobs().includes(job.id);
  const submitted = store.applications.find((a) => a.vacancyId === job.id && a.lifecycle !== "draft");
  const draft = store.applications.find((a) => a.vacancyId === job.id && a.lifecycle === "draft");
  const closed = Boolean(job.closed);
  const questions = useMemo(() => screeningQuestionsFor(job), [job]);
  const shownStatus: Job["status"] = closed && job.status === "Published" ? "Closed" : job.status;

  // "All jobs" returns to the list exactly as it was left (search, filters, Saved tab).
  const listSearch = useSyncExternalStore(noopSubscribe, readListSearch, () => "");
  const backHref = `/applicant/jobs${listSearch}`;

  const btn = "ap-btn h-11 w-full text-[15px] font-semibold max-[767px]:h-12";
  const cta = submitted ? (
    <Link href={`/applicant/applications/${submitted.id}`} className={`${btn} ap-btn-s`}>
      <Check className="size-[18px]" strokeWidth={1.6} aria-hidden="true" />
      You applied · View progress
    </Link>
  ) : closed ? (
    <button type="button" disabled className={`${btn} ap-btn-p`}>
      Applications closed
    </button>
  ) : (
    <Link href={`/applicant/apply?job=${job.id}`} className={`${btn} ap-btn-p text-white hover:text-white`}>
      {draft ? "Continue application" : "Apply now"}
      <ArrowRight className="size-[18px]" strokeWidth={1.6} aria-hidden="true" />
    </Link>
  );

  // §2.9 job-posting facts.
  const overview: [string, string][] = [
    ["Job ref", job.jobRef],
    ["Department", job.department],
    ["Outlet", job.company],
    ["Location", job.location],
    ["Type", job.employmentType],
    ["Openings", String(job.openings)],
    ["Experience", experienceLabel(job.experience)],
    ["Shift", job.shift],
    ["Applications close", job.deadline ? formatLongDate(job.deadline) : "Closed"],
    ["Expected resumption", formatLongDate(job.expectedResumption) || "To be confirmed"],
  ];

  return (
    <div>
      <Link
        href={backHref}
        className="mb-1.5 inline-flex items-center gap-1.5 py-1 text-sm font-bold text-(--ap-violet) hover:text-(--ap-plum) max-[1100px]:min-h-11 max-[1100px]:py-0 max-[1100px]:pr-1"
      >
        <ChevronLeft className="size-[15px]" strokeWidth={1.6} aria-hidden="true" />
        All jobs
      </Link>

      {/* header card (.jd-head) */}
      <Reveal as="section" className="mb-5 rounded-[20px] border border-(--ap-line) bg-white p-6 max-[767px]:rounded-[18px] max-[767px]:px-[18px] max-[767px]:py-5">
        {/* Phones: photo + save on the first row, title and details full-width below. */}
        <div className="flex items-center gap-[18px] max-[767px]:grid max-[767px]:grid-cols-[auto_1fr_auto] max-[767px]:items-start max-[767px]:gap-x-3 max-[767px]:gap-y-3.5">
          <span className="flex size-[84px] shrink-0 max-[767px]:size-16 [&>span]:size-full! [&>span]:rounded-[18px]!">
            <JobThumb image={job.image} department={job.department} size={84} radius={18} />
          </span>
          <div className="min-w-0 flex-1 max-[767px]:col-span-full max-[767px]:row-start-2">
            <h1 className={`${DETAIL_TITLE} m-0`}>{job.role}</h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-(--ap-muted) max-[767px]:mt-2.5">
              <span className="inline-flex items-center gap-1.5">
                <BriefcaseBusiness className="size-[17px] shrink-0" strokeWidth={1.6} aria-hidden="true" />
                {job.company}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-[17px] shrink-0" strokeWidth={1.6} aria-hidden="true" />
                {job.location}, Nigeria
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-[17px] shrink-0" strokeWidth={1.6} aria-hidden="true" />
                {job.postedLabel}
              </span>
            </div>
            <JobChips job={job} withShift className="mt-2 max-[767px]:mt-3.5" />
            {shownStatus !== "Published" ? (
              <div className="mt-3">
                <StatusChip status={shownStatus} />
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-1 self-start min-[768px]:self-center max-[767px]:col-start-3 max-[767px]:row-start-1">
            <ShareJobButton role={job.role} company={job.company} className="max-[767px]:hidden" />
            <SaveJobButton jobId={job.id} role={job.role} />
          </div>
        </div>
      </Reveal>

      {/* .two */}
      <div className="grid grid-cols-1 items-start gap-5 min-[1241px]:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-[20px] border border-(--ap-line) bg-white p-6 max-[767px]:rounded-[18px] max-[767px]:px-[18px] max-[767px]:py-5">
          <JobDetailSections job={job} questions={questions} />
          <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-(--ap-tint) px-3.5 py-3 text-[17px] leading-[1.65] text-(--ap-ink-2)">
            <ShieldCheck className="mt-[5px] size-5 shrink-0 text-(--ap-violet)" strokeWidth={1.6} aria-hidden="true" />
            <span>You apply once. Your profile, CV and ID are reused, so you only add what this role needs.</span>
          </div>
        </section>

        {/* Below 1241px the overview sits above the body so the key facts are the first thing on a phone. */}
        <aside className="min-[1241px]:sticky min-[1241px]:top-[88px] max-[1240px]:order-first">
          <Reveal as="section" className="rounded-[20px] border border-(--ap-line) bg-white p-6 max-[767px]:rounded-[18px] max-[767px]:px-[18px] max-[767px]:py-5">
            <h2 className="ap-serif m-0 mb-3 text-[29px] max-[767px]:text-[25px] min-[768px]:max-[1100px]:text-[26px]">Job overview</h2>
            {/* §2.6: published figure, or "Competitive, based on experience". */}
            <div className="mb-4 rounded-xl bg-(--ap-tint) px-3.5 py-3">
              <span className="block text-sm font-semibold text-(--ap-muted)">Salary</span>
              <b className={`text-base ${job.pay ? "text-(--ap-ok)" : "text-(--ap-ink)"}`}>{salaryLabel(job.salary)}</b>
            </div>
            <FactGrid rows={overview} />
            <div className="mt-[18px] flex flex-col gap-2.5 max-[767px]:hidden">
              {cta}
              <button
                type="button"
                onClick={() => toggleSaveWithToast(job.id)}
                aria-pressed={saved}
                className={`${btn} ${saved ? "ap-btn-l" : "ap-btn-s"}`}
              >
                <Bookmark key={saved ? "on" : "off"} className={`size-[18px] ${saved ? "ap-bump" : ""}`} strokeWidth={1.6} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
                {saved ? "Saved" : "Save role"}
              </button>
              <button type="button" onClick={() => void shareJob(job.role, job.company)} className={`${btn} ap-btn-s`}>
                <Share className="size-[18px]" strokeWidth={1.6} aria-hidden="true" />
                Share
              </button>
            </div>
          </Reveal>
        </aside>
      </div>

      {/* .apply-bar: <=767px the CTA floats as a rounded card above the bottom edge (+ share and save icons); no bottom nav on this page. */}
            <div className="h-24 min-[768px]:hidden" aria-hidden="true" />
      <div className="fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom,0px))] z-[35] flex gap-2.5 rounded-[20px] border border-(--ap-line) bg-white p-2.5 shadow-[0_12px_32px_rgba(37,0,68,.22)] min-[768px]:hidden">
        <div className="flex min-w-0 flex-1 [&>*]:h-12">{cta}</div>
        <button type="button" onClick={() => void shareJob(job.role, job.company)} aria-label={`Share ${job.role}`} className="ap-btn ap-btn-s size-12 shrink-0 p-0">
          <Share className="size-5" strokeWidth={1.6} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => toggleSaveWithToast(job.id)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${job.role} from saved jobs` : `Save ${job.role}`}
          className={`ap-btn size-12 shrink-0 p-0 ${saved ? "ap-btn-l" : "ap-btn-s"}`}
        >
          <Bookmark key={saved ? "on" : "off"} className={`size-5 ${saved ? "ap-bump" : ""}`} strokeWidth={1.6} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
