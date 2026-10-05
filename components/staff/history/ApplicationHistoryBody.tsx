"use client";

import { Check } from "@/components/applicant/icons";
import { Reveal } from "@/components/applicant/motion";
import { Chip, EmptyState, PageHeading } from "@/components/applicant/primitives";
import { CARD } from "@/components/applicant/SectionCard";
import { useApplicantStore } from "@/lib/applicant/service";
import { describeApplicationStatus } from "@/lib/applicant/status";
import { formatDate } from "@/lib/applicant/time";
import { APPLICATION_STAGES } from "@/lib/applicant/types";
import { History } from "../icons";

/**
 * Application history, inside the Staff account. The same person applied to
 * Beeliv before joining, so those applications are shown here (read-only)
 * instead of sending staff back to the Applicant dashboard, which is easy to
 * mistake for a second account. Drafts are left out: only applications that
 * were actually submitted.
 */
export function ApplicationHistoryBody() {
  const { applications } = useApplicantStore();
  const submitted = applications
    .filter((a) => a.lifecycle !== "draft" && a.submittedAt)
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));

  return (
    <div>
      <PageHeading title="Application history" subtitle="The applications you made to Beeliv before joining the team. This is a record only." />

      {submitted.length === 0 ? (
        <EmptyState icon={History} title="No applications on record" description="Applications you made before joining Beeliv will appear here." />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {submitted.map((a) => {
            const st = describeApplicationStatus(a);
            const reached = APPLICATION_STAGES.map((name, i) => ({ name, at: a.stageDates[i] })).filter((s) => s.at);
            return (
              <li key={a.id}>
                <Reveal as="article" className={`${CARD} p-5 min-[768px]:p-6`}>
                  {/* Status first, then role, company, place and a muted date line (job-board card pattern). */}
                  <Chip tone={st.tone}>{st.label}</Chip>
                  <h2 className="mt-3 text-[18px] leading-snug font-bold wrap-anywhere">{a.role}</h2>
                  <p className="mt-1 text-[16px] text-(--ap-ink-2)">{a.company}</p>
                  <p className="text-[16px] text-(--ap-ink-2)">{a.location}</p>
                  <p className="mt-2.5 text-[15px] text-(--ap-muted)">
                    Applied {formatDate(a.submittedAt as string)} · {a.employmentType}
                  </p>

                  {reached.length ? (
                    <ol className="m-0 mt-4 flex list-none flex-col gap-2 border-t border-(--ap-line-2) p-0 pt-4" aria-label="Steps this application went through">
                      {reached.map((s) => (
                        <li key={s.name} className="flex items-center gap-2.5 text-[14px]">
                          <Check className="size-4 shrink-0 text-(--ap-ok)" aria-hidden="true" />
                          <span className="min-w-0 flex-1 text-(--ap-ink-2)">{s.name}</span>
                          <span className="ap-sm shrink-0">{formatDate(s.at as string)}</span>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
