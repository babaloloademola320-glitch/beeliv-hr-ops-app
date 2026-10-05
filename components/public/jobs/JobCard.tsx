"use client";

/**
 * One results-grid listing (Jobs-Desktop.dc.html / Jobs-Mobile.dc.html).
 * Desktop: 116px image, 21px title, three chips (employment type, department,
 * "[Pay, if listed]"). Mobile: 84px image, 19px title, two chips only (the
 * wireframe's mobile card drops the pay chip - matched exactly below).
 *
 * "Save" is a local, unpersisted UI toggle only (no saved-jobs list, no
 * backend) - the wireframe draws the button but nothing beyond it is in
 * scope for a frontend-only pass.
 */
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookmarkIcon, LocationPinIcon } from "../icons";
import { jobDetailsFor, payChipLabel } from "@/lib/public-site/job-details";
import type { Job } from "@/lib/public-site/jobs";
import { Chip } from "../primitives";

export function JobCard({ job }: { job: Job }) {
  const [saved, setSaved] = useState(false);
  // SAMPLE vacancy detail (lib/public-site/job-details.ts): pay chip + "Closing soon".
  const d = jobDetailsFor(job.id, job.department);
  const pay = payChipLabel(d.salary);
  return (
    <article className="ps-cd flex flex-col gap-3.5 p-4 wf-d:p-[22px]">
      <div className="flex items-start gap-3.5 wf-d:gap-5">
        <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[14px] wf-d:h-[116px] wf-d:w-[116px]">
          <Image
            src={job.image.src}
            alt={job.image.alt}
            fill
            sizes="116px"
            className="object-cover"
          />
        </div>
        <div className="flex min-w-0 grow flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <Link href={job.href} className="jb-title text-[19px] wf-d:text-[21px]">
              {job.role}
            </Link>
            <button
              type="button"
              aria-label={saved ? `Unsave ${job.role}` : `Save ${job.role}`}
              aria-pressed={saved}
              onClick={() => setSaved((v) => !v)}
              className="-mt-2 -mr-2 flex h-10 w-10 shrink-0 items-center justify-center border-0 bg-transparent"
            >
              <BookmarkIcon stroke={saved ? "var(--beeliv-purple)" : "var(--muted-text)"} />

            </button>
          </div>
          <div className="text-base text-(--muted-text)">{job.company}</div>
          <div className="flex items-center gap-1.5 text-[15px] text-(--muted-text)">
            <LocationPinIcon size={16} stroke="var(--muted-text)" />
            {job.location}, Nigeria
          </div>
          <div className="flex flex-wrap gap-2 pt-1.5">
            {d.status === "Closing soon" && (
              <span className="ps-chip font-semibold" style={{ background: "#fef3c7", color: "#b45309" }}>
                Closing soon
              </span>
            )}
            <Chip>{job.employmentType}</Chip>
            <Chip>{job.department}</Chip>
            {/* Pay only when Beeliv publishes a figure (wireframe "[Pay, if listed]"; desktop only). */}
            {pay && (
              <span className="hidden wf-d:inline-flex">
                <Chip>{pay}</Chip>
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="ps-hr" />
      <div className="flex items-center justify-between">
        <span className="text-sm text-(--muted-text)">{job.postedLabel}</span>
        <Link href={job.href} className="text-[16px] font-bold">
          View Role →
        </Link>
      </div>
    </article>
  );
}
