import type { Metadata } from "next";
import { JobsBrowser } from "@/components/public/jobs/JobsBrowser";
import { JobsShell } from "@/components/public/jobs/JobsShell";
import { JOBS_HERO } from "@/lib/public-site/jobs-content";
import { getFeaturedJobs } from "@/lib/public-site/jobs";

export const metadata: Metadata = {
  title: "Find Jobs",
  description: JOBS_HERO.body,
};

/**
 * /jobs: hospitality job listings (Jobs-Desktop / Jobs-Mobile.dc.html).
 * Static on purpose (no generateMetadata reading searchParams): keeps this
 * route's own loading.tsx from being skipped in favour of a parent skeleton.
 */
export default async function JobsPage() {
  // Static placeholder data today (see lib/public-site/jobs.ts); swap the
  // body of getFeaturedJobs() for a real query later - nothing here changes.
  const jobs = await getFeaturedJobs();
  return (
    <JobsShell>
      <JobsBrowser jobs={jobs} />
    </JobsShell>
  );
}
