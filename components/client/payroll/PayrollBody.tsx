"use client";

import { Calendar, CircleAlert } from "@/components/applicant/icons";
import { analyticsFamilyHref } from "@/lib/client/links";
import { AnalyticsLink } from "../AnalyticsLink";
import { PageHeading } from "@/components/applicant/primitives";
import { Reveal } from "@/components/applicant/motion";
import { dayMonth, fullDate, periodLabel, plural } from "@/lib/client/format";
import { usePayrollVisibility } from "@/lib/client/hooks";
import type { PayrollEntry } from "@/lib/client/types";
import { StatusChip } from "../StatusChip";
import { AnalyticsPanel } from "../charts";
import { ClientEmpty, PageState } from "../states";

/**
 * Payroll (brief section 22): SCHEDULE VISIBILITY ONLY. No pay actions, no
 * amounts, no salary figures, no payment processing. What the Client may see
 * of salary is still pending Beeliv, so nothing about money is shown or implied.
 * The upcoming card reads the same PayrollVisibility record as the Overview
 * "Next payroll" card, so they always match.
 */
export function PayrollBody() {
  const { data, status, retry } = usePayrollVisibility();
  return (
    <PageState status={status} title="Payroll" what="your payroll schedule" retry={retry} layout="cards" empty={<Empty />}>
      <Heading />
      {data ? (
        <div className="flex flex-col gap-5">
          <section aria-labelledby="pay-upcoming" className="flex flex-col gap-3">
            <h2 id="pay-upcoming" className="ap-eb">
              Upcoming
            </h2>
            {data.upcoming.length === 0 ? (
              <div className="ap-card rounded-[18px] p-5">
                <ClientEmpty kind="payroll" inline height={150} />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 min-[768px]:grid-cols-2 min-[1241px]:grid-cols-3">
                {data.upcoming.map((p) => (
                  <UpcomingCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </section>

          <AnalyticsPanel title="Payroll history" subtitle="Completed pay periods, most recent first">
            {data.history.length === 0 ? (
              <ClientEmpty kind="payroll" inline height={150} />
            ) : (
              <ul className="m-0 flex list-none flex-col p-0">
                {data.history.map((p) => (
                  <HistoryRow key={p.id} p={p} />
                ))}
              </ul>
            )}
          </AnalyticsPanel>

          <p className="flex items-start gap-2.5 text-[13px] leading-snug text-(--ap-muted)">
            <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
            <span>Payroll here is a schedule only. Payment amounts and salary figures aren&apos;t shown until Beeliv confirms what your account can see, and nothing on this page makes or triggers a payment.</span>
          </p>
        </div>
      ) : null}
    </PageState>
  );
}

function Heading() {
  return <PageHeading title="Payroll" subtitle="When your team's pay periods are scheduled. Visibility only." right={<AnalyticsLink href={analyticsFamilyHref("payroll")} label="View analytics" />} />;
}

function Empty() {
  return (
    <>
      <Heading />
      <ClientEmpty kind="payroll" />
    </>
  );
}

function UpcomingCard({ p }: { p: PayrollEntry }) {
  return (
    <Reveal as="article" className="ap-card flex min-w-0 flex-col gap-4 rounded-[18px] p-5 min-[768px]:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-(--ap-tint) text-(--ap-violet)">
          <Calendar className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="ap-serif text-[26px] leading-tight">{p.label}</h3>
          <p className="truncate text-[13px] text-(--ap-muted)">{p.outletName}</p>
        </div>
        <StatusChip tone="ok">Upcoming</StatusChip>
      </div>
      <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-[14px]">
        <dt className="text-(--ap-muted)">Pay period</dt>
        <dd className="m-0 text-right font-semibold text-(--ap-ink)">{periodLabel(p.periodStart, p.periodEnd)}</dd>
        <dt className="text-(--ap-muted)">Scheduled date</dt>
        <dd className="m-0 text-right font-semibold text-(--ap-ink)">{fullDate(p.scheduledDate)}</dd>
        <dt className="text-(--ap-muted)">Outlet</dt>
        <dd className="m-0 text-right font-semibold text-(--ap-ink)">{p.outletName}</dd>
        <dt className="text-(--ap-muted)">Workforce included</dt>
        <dd className="m-0 text-right font-semibold text-(--ap-ink)">{p.workforceIncluded}</dd>
      </dl>
    </Reveal>
  );
}

function HistoryRow({ p }: { p: PayrollEntry }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-t border-(--ap-line-2) py-3 first:border-t-0 min-[768px]:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_100px_auto]">
      <span className="min-w-0 leading-tight">
        <b className="block text-[15px] text-(--ap-ink)">{p.label}</b>
        <span className="block truncate text-[13px] text-(--ap-muted)">{p.outletName}</span>
      </span>
      <span className="justify-self-end min-[768px]:order-last">
        <StatusChip tone="mute">Completed</StatusChip>
      </span>
      <span className="col-span-2 text-[13px] text-(--ap-ink-2) min-[768px]:col-span-1">
        <span className="text-(--ap-muted) min-[768px]:hidden">Period </span>
        {periodLabel(p.periodStart, p.periodEnd)}
      </span>
      <span className="col-span-2 text-[13px] text-(--ap-ink-2) min-[768px]:col-span-1">
        <span className="text-(--ap-muted)">Scheduled </span>
        {dayMonth(p.scheduledDate)}
      </span>
      <span className="col-span-2 text-[13px] text-(--ap-ink-2) min-[768px]:col-span-1 min-[768px]:text-right">{plural(p.workforceIncluded, "staff member", "staff")}</span>
    </li>
  );
}
