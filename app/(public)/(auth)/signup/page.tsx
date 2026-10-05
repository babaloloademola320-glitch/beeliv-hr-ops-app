import type { Metadata } from "next";
import { SignupForm } from "@/components/public/auth/SignupForm";
import { getFeaturedJobs, type Job } from "@/lib/public-site/jobs";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/**
 * /signup        = general sign up.
 * /signup?job=id = job-application variant. The role is looked up in the
 * existing job data (lib/public-site/jobs.ts); an unknown id falls back to
 * the general variant.
 */
async function resolveJob(searchParams: SearchParams): Promise<Job | null> {
  const id = (await searchParams).job;
  if (typeof id !== "string" || !id) return null;
  const jobs = await getFeaturedJobs();
  return jobs.find((j) => j.id === id) ?? null;
}

// Static on purpose: a generateMetadata that reads searchParams suspends above
// this route's own loading.tsx, so the parent (Home) skeleton would flash.
export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const job = await resolveJob(searchParams);
  return <SignupForm job={job} />;
}
