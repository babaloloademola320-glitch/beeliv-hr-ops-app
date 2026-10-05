import { JobDetailBody } from "@/components/public/JobDetail";
import { SKELETON_JOBS } from "@/lib/public-site/jobs";

// Loading skeleton for /jobs/[id] (Skel-Job-Desktop / Skel-Job-Mobile.dc.html):
// the same DOM as the real page, wrapped in `.skel` (styles in
// ../../public-site.css), with placeholder job + related-job data (never
// shown as real content).
export default function Loading() {
  const [job, ...rest] = SKELETON_JOBS;
  return (
    <div className="skel" aria-busy="true" aria-label="Loading">
      <JobDetailBody job={job} related={rest.slice(0, 3)} />
    </div>
  );
}
