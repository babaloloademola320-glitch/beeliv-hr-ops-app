import type { Metadata } from "next";
import { LoginForm } from "@/components/public/auth/LoginForm";
import { getFeaturedJobs } from "@/lib/public-site/jobs";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export const metadata: Metadata = { title: "Log in" };

/**
 * /login        = general log in (lands on the applicant Overview).
 * /login?job=id = reached from the job-application sign-up ("Apply Now" ->
 * /signup?job=id -> "Log in"). The vacancy is preserved through
 * authentication: a successful login continues to /applicant/apply?job=id.
 * Same `?job` mechanism and lookup as /signup; an unknown id is dropped.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const id = (await searchParams).job;
  let jobId: string | null = null;
  if (typeof id === "string" && id) {
    const jobs = await getFeaturedJobs();
    jobId = jobs.some((j) => j.id === id) ? id : null;
  }
  return <LoginForm jobId={jobId} />;
}
