import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getApplicantJobs } from "@/lib/applicant/jobs";
import { ApplyBody } from "@/components/applicant/ApplyBody";

export const metadata: Metadata = { title: "Application" };

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/**
 * /applicant/apply?job=<id> — resumes that vacancy's existing draft or
 * starts one (resolved client-side in ApplyBody via the mock service, which
 * is localStorage-backed). With no ?job the wireframe's own default
 * workspace (the Sous Chef draft) opens; an unknown id is a 404 rather than
 * silently starting an application for a different job.
 */
export default async function ApplicantApplyPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).job;
  const jobId = typeof raw === "string" ? raw : "";
  const jobs = await getApplicantJobs();
  const job = jobId ? jobs.find((j) => j.id === jobId) : jobs[0];
  if (!job) notFound();

  return <ApplyBody key={job.id} job={job} />;
}
