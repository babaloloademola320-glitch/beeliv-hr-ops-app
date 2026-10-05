import { T } from "../primitives";
import { SKELETON_JOBS } from "@/lib/public-site/jobs";
import { JobCard } from "./JobCard";

/**
 * Loading skeleton for the search + sidebar + results area (Skel-Jobs-Desktop
 * / Skel-Jobs-Mobile.dc.html - the default loaded state, not Jobs-Empty).
 * Reuses JobCard (its ps-img / ps-chip pieces already shimmer under `.skel`,
 * see app/(public)/public-site.css) so the result rows never drift from the
 * real markup; the search bar and filter groups are simplified placeholder
 * shapes, same economy as RequestFormSkeleton.
 */
function FakeField({ label }: { label: string }) {
  return (
    <div className="jb-sch">
      <span className="ps-sk">{label}</span>
    </div>
  );
}

function FakeGroup({ title }: { title: string }) {
  return (
    <div className="jb-fg">
      <h3>
        <T>{title}</T>
      </h3>
      <div className="flex flex-wrap gap-2.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="ps-chip h-[36px] w-[88px]" />
        ))}
      </div>
    </div>
  );
}

export function JobsSkeleton() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Loading
      </p>

      <div className="mx-auto flex max-w-[calc(1440*var(--u))] flex-col gap-3 px-5 pt-3 wf-d:px-[calc(96*var(--u))] wf-d:pb-2">
        <div className="ps-cd hidden grid-cols-[1.6fr_1fr_auto] gap-3 p-4 wf-d:grid">
          <FakeField label="Role, skill or company" />
          <FakeField label="All locations" />
          <span className="ps-btn ps-bp px-9">Search</span>
        </div>
        <div className="flex flex-col gap-3 wf-d:hidden">
          <FakeField label="Role, skill or company" />
          <div className="grid grid-cols-2 gap-3">
            <span className="ps-btn ps-bo bg-white">Filters</span>
            <span className="ps-btn ps-bp">Search</span>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-[calc(1440*var(--u))] px-5 py-8 wf-d:grid wf-d:grid-cols-[320px_minmax(0,1fr)] wf-d:gap-10 wf-d:px-[calc(96*var(--u))] wf-d:pt-[calc(40*var(--u))] wf-d:pb-[calc(110*var(--u))]">
        <aside className="hidden flex-col gap-5 wf-d:flex">
          <div className="ps-cd px-[22px] pb-[22px]">
            <div className="flex items-baseline justify-between pt-1 pb-1">
              <h2 className="ps-serif [--fs-d:28]">
                <T>Filters</T>
              </h2>
            </div>
            <FakeGroup title="Department" />
            <FakeGroup title="Employment type" />
            <FakeGroup title="Location" />
          </div>
          <div className="flex flex-col gap-2.5 rounded-[18px] bg-(--deep-plum) p-[22px] text-white">
            <b className="text-lg">
              <T>Get job alerts</T>
            </b>
            <span className="ps-btn ps-bw !h-[46px]">Create profile →</span>
          </div>
        </aside>

        <div className="flex flex-col gap-4 pt-6 wf-d:pt-0">
          <div className="flex items-center justify-between">
            <b className="text-[18px] wf-d:text-[19px]">
              <T>{SKELETON_JOBS.length} roles available</T>
            </b>
            <span className="ps-sk text-[15px]">Sort</span>
          </div>
          <div className="flex flex-col gap-4">
            {SKELETON_JOBS.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
