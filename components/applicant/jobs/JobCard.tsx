"use client";

import Link from "next/link";
import { Check, MapPin, Sparkles } from "@/components/applicant/icons";
import type { ApplicantJob } from "@/lib/applicant/jobs";
import { JobThumb } from "../primitives";
import { SaveJobButton } from "./SaveJobButton";

/** Wireframe matchTag(): Sparkles + "Strong match" (violet/gold gradient) or "Good match" (neutral). */
export function MatchTag({ match }: { match: ApplicantJob["match"] }) {
  if (!match) return null;
  const strong = match === "Strong match";
  return (
    <span
      className={`mt-1 inline-flex h-6 items-center gap-[5px] rounded-full px-[9px] text-[13px] leading-none font-semibold whitespace-nowrap ${
        strong ? "bg-[linear-gradient(90deg,#F4E9FA,#FEF3C7)] text-(--ap-violet)" : "bg-(--ap-line-2) text-(--ap-ink-2)"
      }`}
    >
      <Sparkles className="size-[13px] text-(--ap-gold)" strokeWidth={1.6} aria-hidden="true" />
      {match}
    </span>
  );
}

/** Wireframe .pchip row: (status) · type · department · (shift) · pay (green). */
export function JobChips({
  job,
  withShift = false,
  withStatus = false,
  className = "",
}: {
  job: ApplicantJob;
  withShift?: boolean;
  /** Cards only: a "Closing soon" / "Closed" chip (§2.13). The job page shows its own status chip. */
  withStatus?: boolean;
  className?: string;
}) {
  const chip = "inline-flex h-[30px] items-center rounded-full px-3 text-[13px] font-semibold whitespace-nowrap max-[767px]:h-7";
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {withStatus && job.status === "Closing soon" && !job.closed ? <span className={`${chip} bg-(--ap-warn-bg) text-(--ap-warn)`}>Closing soon</span> : null}
      {withStatus && job.closed ? <span className={`${chip} bg-(--ap-line-2) text-(--ap-muted)`}>{job.status === "Filled" ? "Position filled" : "Closed"}</span> : null}
      <span className={`${chip} bg-[rgba(91,8,123,.06)] text-(--ap-ink-2)`}>{job.employmentType}</span>
      <span className={`${chip} bg-[rgba(91,8,123,.06)] text-(--ap-ink-2)`}>{job.department}</span>
      {withShift ? <span className={`${chip} bg-[rgba(91,8,123,.06)] text-(--ap-ink-2)`}>{job.shift} shift</span> : null}
      {job.pay ? <span className={`${chip} bg-(--ap-ok-bg) text-(--ap-ok)`}>{job.pay}</span> : null}
    </div>
  );
}

export type JobCardState = { applied: boolean; draft: boolean };

/** Wireframe jobCard() (.jc). */
export function JobCard({ job, state }: { job: ApplicantJob; state: JobCardState }) {
  const detail = `/applicant/jobs/${job.id}`;
  const primaryHref = state.draft && !state.applied ? `/applicant/apply?job=${job.id}` : detail;

  return (
    <article className="rounded-[18px] border border-(--ap-line) bg-white p-5 transition-[border-color,box-shadow] duration-150 hover:border-[#DCCFE6] hover:shadow-(--ap-shadow) max-[767px]:p-3.5">
      <div className="grid grid-cols-[116px_minmax(0,1fr)] gap-x-5 max-[767px]:grid-cols-[84px_minmax(0,1fr)] max-[767px]:gap-x-3.5 max-[380px]:grid-cols-[68px_minmax(0,1fr)]">
        <Link
          href={detail}
          tabIndex={-1}
          aria-hidden="true"
          className="flex size-[116px] overflow-hidden rounded-[14px] bg-[#F6EEF9] max-[767px]:size-[84px] max-[767px]:rounded-xl max-[380px]:size-[68px] [&>span]:size-full! [&>span]:rounded-[inherit]! [&>span>svg]:size-[42%]!"
        >
          <JobThumb image={job.image} department={job.department} size={116} radius={14} />
        </Link>
        <div className="flex min-w-0 flex-col gap-[5px]">
          <div className="flex items-start justify-between gap-2.5">
            <Link
              href={detail}
              className="text-[19px] leading-[1.25] font-bold text-(--ap-ink) hover:text-(--ap-violet) max-[767px]:text-[17px]"
            >
              {job.role}
            </Link>
            <SaveJobButton jobId={job.id} role={job.role} className="-mt-1 -mr-1 max-[1100px]:-mt-2 max-[1100px]:-mr-2" />
          </div>
          <div className="ap-sm">{job.company}</div>
          {job.match ? (
            <div>
              <MatchTag match={job.match} />
            </div>
          ) : null}
          <div className="ap-sm flex items-center gap-1.5">
            <MapPin className="size-[17px] shrink-0" strokeWidth={1.6} aria-hidden="true" />
            {job.location}, Nigeria
          </div>
          <JobChips job={job} withStatus className="mt-2 max-[767px]:hidden" />
        </div>
        {/* <=767px the chips span the full card width (the wireframe's own `.jc-chips{grid-column:1/-1}` intent),
            instead of wrapping one-per-line in the narrow text column. */}
        <JobChips job={job} withStatus className="col-span-full mt-3 min-[768px]:hidden" />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2.5 border-t border-(--ap-line) pt-3.5">
        {state.applied ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-(--ap-ok)">
            <Check className="size-[15px]" strokeWidth={1.6} aria-hidden="true" />
            Applied
          </span>
        ) : state.draft ? (
          <span className="inline-flex h-7 items-center rounded-full bg-[#F8F3FA] px-[11px] text-[13px] font-semibold whitespace-nowrap text-(--ap-violet)">
            Draft saved
          </span>
        ) : (
          <span className="text-sm text-(--ap-muted)">
            {job.postedLabel}
            {job.openings > 1 ? ` · ${job.openings} openings` : ""}
          </span>
        )}
        <Link
          href={primaryHref}
          className="border-b-[1.5px] border-current pb-0.5 text-base font-bold whitespace-nowrap text-(--ap-violet) hover:text-(--ap-plum)"
        >
          {state.draft && !state.applied ? "Continue application →" : "View Role →"}
        </Link>
      </div>
    </article>
  );
}
