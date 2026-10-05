import type { ReactNode } from "react";
import { ErrorPanel } from "@/components/staff/ErrorPanel";
import { PageHeading } from "@/components/applicant/primitives";

const SK = "ap-shimmer rounded-2xl";

/** Solid skeleton at the real layout's proportions: heading, then `blocks` cards. */
export function PageSkeleton({ title, label, blocks = [120, 320] }: { title: string; label: string; blocks?: number[] }) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      <PageHeading title={title} />
      <div className="flex flex-col gap-4 min-[768px]:gap-5">
        {blocks.map((h, i) => (
          <div key={i} className={SK} style={{ height: h }} />
        ))}
      </div>
    </div>
  );
}

export function PageError({ title, heading, retry }: { title: string; heading: string; retry: () => void }) {
  return (
    <div>
      <h1 className="sr-only">{heading}</h1>
      <div className="mx-auto max-w-[860px] pt-4 min-[768px]:pt-10">
        <ErrorPanel title={title} retry={retry} />
      </div>
    </div>
  );
}

/** Small "Back to ..." link row used by the detail pages. */
export function BackRow({ children }: { children: ReactNode }) {
  return <div className="pt-3 pb-1">{children}</div>;
}
