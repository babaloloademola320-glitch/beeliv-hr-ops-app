import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobDetailBody } from "@/components/public/JobDetail";
import { getFeaturedJobs } from "@/lib/public-site/jobs";

type Params = Promise<{ id: string }>;

// Sample-data-only for now: ids like head-chef, restaurant-supervisor,
// bar-supervisor, guest-relations-officer resolve via the same
// getFeaturedJobs() list Home's teaser and Signup's ?job= lookup use. Any
// other id 404s. Swap for a real lookup once a jobs API/query exists -
// nothing else on this page changes.
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const jobs = await getFeaturedJobs();
  const job = jobs.find((j) => j.id === id);
  return { title: job ? job.role : "Job not found" };
}

export default async function JobDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const jobs = await getFeaturedJobs();
  const job = jobs.find((j) => j.id === id);
  if (!job) notFound();

  const related = jobs.filter((j) => j.id !== id).slice(0, 3);
  return <JobDetailBody job={job} related={related} />;
}
