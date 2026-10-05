import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getApplicantJobs } from "@/lib/applicant/jobs";
import { JobBody } from "@/components/applicant/JobBody";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const jobs = await getApplicantJobs();
  const job = jobs.find((j) => j.id === id);
  return { title: job ? job.role : "Job not found" };
}

export default async function ApplicantJobDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const jobs = await getApplicantJobs();
  const job = jobs.find((j) => j.id === id);
  if (!job) notFound();
  return <JobBody job={job} />;
}
