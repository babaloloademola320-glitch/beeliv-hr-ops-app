import type { ReactNode } from "react";
import type { Job } from "@/lib/public-site/jobs";
import { JOB_DETAIL } from "@/lib/public-site/job-content";
import {
  RECRUITMENT_PROCESS,
  conditionRows,
  experienceLabel,
  formatLongDate,
  isOpenStatus,
  jobDetailsFor,
  salaryLabel,
} from "@/lib/public-site/job-details";
import { screeningQuestionsFor } from "@/lib/applicant/screening";
import { ROUTES } from "@/lib/public-site/content";
import { PageHeader } from "./PageHeader";
import { SiteFooter } from "./SiteFooter";
import { MenuProvider } from "./SiteHeader";
import { Btn, LiftCard, Reveal, SoftLink, TextLink } from "./kit";
import { CheckIcon } from "./icons";
import { ShareButton } from "./ShareButton";
import { Chip, Eyebrow, T, stagger } from "./primitives";

/**
 * Job detail (Job-Desktop.dc.html / Job-Mobile.dc.html, "JOB DETAIL · PUBLIC").
 * Used by both app/(public)/jobs/[id]/page.tsx (real job + related jobs) and
 * its loading.tsx (placeholder job + jobs, wrapped in `.skel`) - same DOM
 * either way, per the pattern already used for Home/Request.
 *
 * Two wireframe annotations are deliberately NOT rendered as visible copy
 * (design-tool notes, same rule as .ps-img's tag labels):
 * - "Signed-in applicant who has already applied sees ... instead of Apply
 *   Now" - no auth/application-state wiring exists yet (frontend only), so
 *   Apply Now always renders (unless the listing is closed). OPEN ITEM for
 *   when that state is wired up.
 * - "Sticky apply bar · stays on screen while scrolling" - describes the
 *   mobile bar's behaviour (implemented below via `sticky`), not copy.
 *
 * Extended 2026-09-29 to the requirements doc's §2.15 structure (job facts,
 * key responsibilities, essential / preferred requirements, experience,
 * skills, working conditions, benefits, required documents, screening
 * questions, recruitment process). Per-job content is SAMPLE data from
 * lib/public-site/job-details.ts. Long lists fold behind a native <details>
 * on mobile only, so this stays a server component.
 */

const H2 = "ps-serif [--fs-d:35] [--fs-m:30]";
const H3 = "ps-serif [--fs-d:26] [--fs-m:25]";
const UL = "ps-bd m-0 flex list-disc flex-col gap-1.5 pl-5";

/** Bulleted list; on mobile, items after `fold` sit behind a native "Show all" <details>. */
function FoldList({ items, fold = 6 }: { items: string[]; fold?: number }) {
  const head = items.slice(0, fold);
  const rest = items.slice(fold);
  const li = (item: string, hideOnMobile = false) => (
    <li key={item} className={hideOnMobile ? "hidden wf-d:list-item" : undefined}>
      <T>{item}</T>
    </li>
  );
  return (
    <div className="flex flex-col gap-1.5">
      <ul className={UL}>
        {head.map((x) => li(x))}
        {/* Desktop: everything visible in one list. */}
        {rest.map((x) => li(x, true))}
      </ul>
      {rest.length > 0 && (
        <details className="group wf-d:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center text-[15px] font-bold text-(--beeliv-purple) [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">{`${JOB_DETAIL.showAll} ${items.length}`}</span>
            <span className="hidden group-open:inline">Show fewer</span>
          </summary>
          <ul className={`${UL} mt-0.5`}>{rest.map((x) => li(x))}</ul>
        </details>
      )}
    </div>
  );
}

/** Two-column fact grid (four columns on the desktop board when `wide`). */
function Facts({ rows, wide = false }: { rows: [string, ReactNode][]; wide?: boolean }) {
  return (
    <dl className={`m-0 grid grid-cols-2 gap-x-5 gap-y-4 ${wide ? "wf-d:grid-cols-5 wf-d:gap-x-8" : ""}`}>
      {rows.map(([k, v]) => (
        <div key={k} className="flex min-w-0 flex-col gap-0.5">
          <dt className="ps-sm text-[14px]">
            <T>{k}</T>
          </dt>
          <dd className="m-0 text-[16px] font-semibold [overflow-wrap:anywhere]">
            <T>{v}</T>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Checks({ items }: { items: readonly string[] }) {
  return (
    <ul className="ps-sm m-0 flex list-none flex-col gap-2 p-0">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2.5">
          <CheckIcon />
          <T>{item}</T>
        </li>
      ))}
    </ul>
  );
}

export function JobDetailBody({ job, related }: { job: Job; related: Job[] }) {
  const applyHref = `/signup?job=${job.id}`;
  const d = jobDetailsFor(job.id, job.department);
  const open = isOpenStatus(d.status);
  const questions = screeningQuestionsFor(job);
  const conditions = conditionRows(d.conditions);
  const statusChip = d.status === "Closing soon" ? "Closing soon" : !open ? (d.status === "Filled" ? "Position filled" : "Closed") : null;

  // §2.9 job-posting facts.
  const facts: [string, string][] = [
    ["Job ref", d.jobRef],
    ["Department", job.department],
    ["Outlet", job.company],
    ["Location", `${job.location}, Nigeria`],
    ["Employment", job.employmentType],
    ["Openings", String(d.openings)],
    ["Experience", experienceLabel(d.experience)],
    ["Salary", salaryLabel(d.salary)],
    ["Applications close", d.deadline ? formatLongDate(d.deadline) : "Closed"],
    ["Expected resumption", formatLongDate(d.expectedResumption) || "To be confirmed"],
  ];

  const applyButton = (className?: string) =>
    open ? (
      <Btn href={applyHref} label={JOB_DETAIL.applyCta} variant="bp" className={className} />
    ) : (
      <span aria-disabled="true" className={`ps-btn ps-bo cursor-not-allowed bg-white opacity-60 ${className ?? ""}`}>
        <T>{JOB_DETAIL.closedCta}</T>
      </span>
    );

  return (
    <MenuProvider>
      <PageHeader activeHref={ROUTES.jobs} />

      {/* Hero */}
      <section className="flex flex-col gap-3.5 border-b border-(--soft-border) bg-white px-5 pt-7 pb-8 wf-d:gap-[calc(22*var(--u))] wf-d:px-[calc(96*var(--u))] wf-d:pt-[calc(44*var(--u))] wf-d:pb-[calc(56*var(--u))]">
        <Reveal when="mount" y={12}>
          <nav aria-label="Breadcrumb" className="ps-sm pt-5 wf-d:pt-[calc(18*var(--u))]">
            <SoftLink href={ROUTES.jobs}>
              <T>{JOB_DETAIL.breadcrumbRoot}</T>
            </SoftLink>{" "}
            <T>{`/ ${job.role}`}</T>
          </nav>
        </Reveal>

        <div className="flex flex-col gap-4 wf-d:flex-row wf-d:items-end wf-d:justify-between wf-d:gap-12">
          <div className="flex flex-col gap-4">
            <Reveal when="mount" y={14} delay={stagger(1)}>
              <Eyebrow>{job.company || JOB_DETAIL.clientFallback}</Eyebrow>
            </Reveal>
            <Reveal when="mount" y={16} delay={stagger(2)}>
              <h1 className="ps-serif [--fs-d:64] [--fs-m:30]">
                <T>{job.role}</T>
              </h1>
            </Reveal>
            <Reveal when="mount" y={14} delay={stagger(3)} className="flex flex-wrap gap-2">
              {statusChip && (
                <span className="ps-chip font-semibold" style={open ? { background: "#fef3c7", color: "#b45309" } : undefined}>
                  <T>{statusChip}</T>
                </span>
              )}
              <Chip>{job.location}</Chip>
              <Chip>{job.employmentType}</Chip>
              <Chip>{job.department}</Chip>
              <Chip>{job.postedLabel}</Chip>
            </Reveal>
          </div>

          <Reveal when="mount" y={14} delay={stagger(4)} className="hidden gap-3 wf-d:flex">
            {applyButton()}
            <ShareButton title={`${job.role} at ${job.company}`} label={JOB_DETAIL.shareLabel} />
          </Reveal>
        </div>
      </section>

      {/* Mobile sticky apply bar */}
      <div className="sticky top-0 z-20 flex items-center gap-2.5 border-t border-b border-(--soft-border) bg-white px-5 py-3 wf-d:hidden">
        {applyButton("flex-1 justify-center")}
        <ShareButton title={`${job.role} at ${job.company}`} label={JOB_DETAIL.shareLabel} icon />
      </div>

      {/* Job facts (§2.9) - directly under the hero so the key facts scan first on a phone. */}
      <section aria-label={JOB_DETAIL.factsTitle} className="px-5 pt-8 wf-d:px-[calc(96*var(--u))] wf-d:pt-[calc(56*var(--u))]">
        <Reveal className="ps-cd p-5 wf-d:p-[calc(30*var(--u))]">
          <Facts rows={facts} wide />
        </Reveal>
      </section>

      {/* Body */}
      <section className="flex flex-col gap-9 px-5 pt-10 pb-12 wf-d:grid wf-d:grid-cols-[minmax(0,1fr)_390px] wf-d:items-start wf-d:gap-[calc(80*var(--u))] wf-d:px-[calc(96*var(--u))] wf-d:pt-[calc(56*var(--u))] wf-d:pb-[calc(96*var(--u))]">
        <article className="flex flex-col gap-9 wf-d:max-w-[720px] wf-d:gap-[calc(44*var(--u))]">
          {d.about && (
            <Reveal className="flex flex-col gap-3.5">
              <h2 className={H2}>
                <T>{JOB_DETAIL.aboutTitle}</T>
              </h2>
              <p className="ps-bd">
                <T>{d.about}</T>
              </p>
            </Reveal>
          )}

          {d.responsibilities.length > 0 && (
            <Reveal className="flex flex-col gap-3.5">
              <h2 className={H2}>
                <T>{JOB_DETAIL.doTitle}</T>
              </h2>
              <FoldList items={d.responsibilities} />
            </Reveal>
          )}

          {(d.essential.length > 0 || d.preferred.length > 0) && (
            <Reveal className="flex flex-col gap-3.5">
              <h2 className={H2}>
                <T>{JOB_DETAIL.needTitle}</T>
              </h2>
              <div className="flex flex-col gap-6">
                {d.essential.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    <h3 className={H3}>
                      <T>{JOB_DETAIL.essentialTitle}</T>
                    </h3>
                    <FoldList items={d.essential} fold={4} />
                  </div>
                )}
                {d.preferred.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    <h3 className={H3}>
                      <T>{JOB_DETAIL.preferredTitle}</T>
                    </h3>
                    <p className="ps-sm">
                      <T>{JOB_DETAIL.preferredNote}</T>
                    </p>
                    <FoldList items={d.preferred} fold={4} />
                  </div>
                )}
              </div>
            </Reveal>
          )}

          {d.experience.summary && (
            <Reveal className="flex flex-col gap-3.5">
              <h2 className={H2}>
                <T>{JOB_DETAIL.experienceTitle}</T>
              </h2>
              <p className="ps-bd">
                <T>{d.experience.summary}</T>
              </p>
            </Reveal>
          )}

          {d.skills.length > 0 && (
            <Reveal className="flex flex-col gap-3.5">
              <h2 className={H2}>
                <T>{JOB_DETAIL.skillsTitle}</T>
              </h2>
              <div className="flex flex-wrap gap-2">
                {d.skills.map((s) => (
                  <Chip key={s}>{s}</Chip>
                ))}
              </div>
            </Reveal>
          )}

          {conditions.length > 0 && (
            <Reveal className="flex flex-col gap-3.5">
              <h2 className={H2}>
                <T>{JOB_DETAIL.conditionsTitle}</T>
              </h2>
              <Facts rows={conditions} />
            </Reveal>
          )}

          {d.benefits.length > 0 && (
            <Reveal className="flex flex-col gap-3.5">
              <h2 className={H2}>
                <T>{JOB_DETAIL.benefitsTitle}</T>
              </h2>
              <ul className={UL}>
                {d.benefits.map((b) => (
                  <li key={b.kind + b.detail}>
                    <T>
                      <b className="font-semibold text-(--ink)">{b.kind}:</b> {b.detail}
                    </T>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          {questions.length > 0 && (
            <Reveal className="flex flex-col gap-3.5">
              <h2 className={H2}>
                <T>{JOB_DETAIL.screeningTitle}</T>
              </h2>
              <p className="ps-sm">
                <T>{JOB_DETAIL.screeningIntro}</T>
              </p>
              <FoldList items={questions.map((q) => q.title)} fold={3} />
            </Reveal>
          )}

          <Reveal className="flex flex-col gap-3.5">
            <h2 className={H2}>
              <T>{JOB_DETAIL.processTitle}</T>
            </h2>
            {/* §2.10 - an expectation-setting summary, not the confirmed 8-stage workflow. */}
            <ol className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-3 p-0 wf-d:grid-cols-4">
              {RECRUITMENT_PROCESS.map((label, i) => (
                <li key={label} className="flex items-center gap-2.5 text-[15px] font-semibold">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[13px] font-bold"
                    style={
                      i === 0
                        ? { background: "var(--beeliv-purple)", borderColor: "var(--beeliv-purple)", color: "#fff" }
                        : { borderColor: "var(--soft-border)", color: "var(--muted-text)" }
                    }
                  >
                    {i + 1}
                  </span>
                  <span className="sr-only">{`Step ${i + 1}: `}</span>
                  <T>{label}</T>
                </li>
              ))}
            </ol>
            {d.interviewMethod && (
              <p className="ps-sm">
                <T>
                  <b className="font-semibold text-(--ink)">{JOB_DETAIL.interviewLabel}</b> {d.interviewMethod}
                </T>
              </p>
            )}
          </Reveal>
        </article>

        <aside className="flex flex-col gap-9 wf-d:gap-5">
          <Reveal className="ps-cd flex flex-col gap-4 p-6 wf-d:p-[calc(30*var(--u))]">
            <Eyebrow>{JOB_DETAIL.applyEyebrow}</Eyebrow>
            {/* §2.12 - a valid ID is required at application. */}
            <div className="flex flex-col gap-2.5">
              <h3 className={H3}>
                <T>{JOB_DETAIL.requiredNowTitle}</T>
              </h3>
              <Checks items={[...d.requiredDocuments.atApplication, JOB_DETAIL.requiredNowExtra]} />
            </div>
            <div className="ps-hr" />
            <div className="flex flex-col gap-2.5">
              <h3 className={H3}>
                <T>{JOB_DETAIL.requiredLaterTitle}</T>
              </h3>
              <p className="ps-sm">
                <T>{JOB_DETAIL.requiredLaterNote}</T>
              </p>
              <Checks items={d.requiredDocuments.afterSelection} />
            </div>
            {applyButton("w-full")}
            <p className="ps-sm text-[13px]">
              <T>{JOB_DETAIL.applyNote}</T>
            </p>
          </Reveal>

          <Reveal delay={stagger(1)} className="ps-cd flex flex-col gap-2 border-0 bg-(--deep-plum) p-6 text-white">
            <Eyebrow className="!text-(--antique-gold)">{JOB_DETAIL.bannerEyebrow}</Eyebrow>
            <p className="text-[15px] leading-[1.55] text-white/85">
              <T>{JOB_DETAIL.bannerBody}</T>
            </p>
          </Reveal>
        </aside>
      </section>

      {/* More roles like this */}
      {related.length > 0 && (
        <section className="flex flex-col gap-5 border-t border-(--soft-border) bg-white py-14 pl-5 wf-d:gap-8 wf-d:px-[calc(96*var(--u))] wf-d:py-[calc(96*var(--u))]">
          <Reveal className="flex items-end justify-between gap-8 pr-5 wf-d:pr-0">
            <h2 className="ps-serif max-w-none pr-5 [--fs-d:41] [--fs-m:30] wf-d:pr-0">
              <T>{JOB_DETAIL.relatedTitle}</T>
            </h2>
            <TextLink href={ROUTES.jobs} label={JOB_DETAIL.relatedCta} className="hidden shrink-0 wf-d:inline-flex" />
          </Reveal>

          <div className="ps-swipe flex gap-3.5 pr-5 wf-d:grid wf-d:grid-cols-3 wf-d:gap-6 wf-d:overflow-visible wf-d:pr-0">
            {related.map((r, i) => (
              <Reveal key={r.id} delay={stagger(i)} className="w-[290px] shrink-0 wf-d:w-auto">
                <LiftCard className="ps-cd flex h-full flex-col gap-3 p-[22px] wf-d:p-7">
                  <h3 className="ps-serif [--fs-d:29] [--fs-m:25]">
                    <T>{r.role}</T>
                  </h3>
                  <div className="text-[15px] font-semibold">
                    <T>{r.company}</T>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Chip>{r.location}</Chip>
                    <Chip>{r.employmentType}</Chip>
                  </div>
                  <div className="ps-hr" />
                  <TextLink href={r.href} label={JOB_DETAIL.cardCta} />
                </LiftCard>
              </Reveal>
            ))}
          </div>

          <TextLink href={ROUTES.jobs} label={JOB_DETAIL.relatedCta} className="mr-5 wf-d:hidden" />
        </section>
      )}

      <SiteFooter />
    </MenuProvider>
  );
}
