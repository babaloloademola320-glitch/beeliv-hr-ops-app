"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "@/components/applicant/icons";
import { PageHeading } from "@/components/applicant/primitives";
import { ClipboardList as ClipIcon } from "../icons";
import { useWorkforceRequests } from "@/lib/client/hooks";
import { dayMonth, plural } from "@/lib/client/format";
import { DEPARTMENT_LABEL } from "@/lib/client/labels";
import { requestHref } from "@/lib/client/links";
import { useOutletState } from "@/lib/client/outlet";
import { StatusChip } from "../StatusChip";
import { AnalyticsPanel, ChartEmptyState } from "../charts";
import { PageError, PageSkeleton } from "../recruitment/states";
import { RequestStatusChip } from "./meta";
import { RequestForm } from "./RequestForm";

/**
 * Workforce Requests (brief section 16): the Client tells Beeliv what staff it
 * needs and follows each request's status. Requests go to Beeliv HR for
 * review; nothing here publishes a vacancy. `?new=1` (the Overview's "Request
 * staff" links) opens the form straight away.
 */
export function RequestsBody({ initialOpen }: { initialOpen: boolean }) {
  const { data, status, retry } = useWorkforceRequests();
  const outlet = useOutletState();
  const [open, setOpen] = useState(initialOpen);
  const [justSent, setJustSent] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const showOutlet = outlet.outlets.length > 1 && outlet.scope === "all";
  const outletName = (id: string) => outlet.outlets.find((o) => o.id === id)?.name ?? "";

  useEffect(() => {
    if (open) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [open]);

  if (status === "loading" && !data) return <PageSkeleton title="Workforce Requests" label="Loading requests" blocks={[110, 380]} />;
  if (status === "error") return <PageError heading="Workforce Requests" title="We couldn't load your requests" retry={retry} />;

  const list = [...(data ?? [])].sort((a, b) => (a.submittedOn === b.submittedOn ? (Number(a.id.replace("req-", "")) < Number(b.id.replace("req-", "")) ? 1 : -1) : a.submittedOn < b.submittedOn ? 1 : -1));

  function toggle(v: boolean) {
    setOpen(v);
    if (!v && window.location.search.includes("new=1")) window.history.replaceState(null, "", "/client/requests");
  }

  return (
    <div>
      <PageHeading
        title="Workforce Requests"
        subtitle="Tell Beeliv what staff you need. Beeliv HR reviews every request."
        right={
          open ? null : (
            <button type="button" onClick={() => toggle(true)} className="ap-btn ap-btn-p h-11 text-white! max-[480px]:w-full">
              <Plus className="size-4" aria-hidden="true" /> Request staff
            </button>
          )
        }
      />

      <div className="flex flex-col gap-4 min-[768px]:gap-5">
        {open ? (
          <div ref={formRef} className="scroll-mt-[90px]">
            <AnalyticsPanel title="Request staff">
              <RequestForm
                onDone={(r) => {
                  setJustSent(r.id);
                  toggle(false);
                }}
                onCancel={() => toggle(false)}
              />
            </AnalyticsPanel>
          </div>
        ) : null}

        <AnalyticsPanel title="Your requests" subtitle={list.length ? plural(list.length, "request") : undefined}>
          {list.length === 0 ? (
            <ChartEmptyState
              icon={ClipIcon}
              title="No requests yet"
              description="Need more people? Send Beeliv a request and follow its progress here."
              action={
                open ? undefined : (
                  <button type="button" onClick={() => toggle(true)} className="ap-btn ap-btn-p ap-btn-sm mt-1 text-white!">
                    <Plus className="size-4" aria-hidden="true" /> Request staff
                  </button>
                )
              }
            />
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {list.map((r) => (
                <li key={r.id}>
                  <Link href={requestHref(r.id)} className="flex items-start gap-3 rounded-xl border border-(--ap-line-2) bg-(--ap-tint-soft) p-3.5 hover:border-(--ap-tint-2)">
                    <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--ap-tint) text-(--ap-violet)">
                      <ClipIcon className="size-[19px]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                        <b className="text-[15px] text-(--ap-ink)">
                          {r.role} <span className="font-semibold text-(--ap-muted)">x {r.count}</span>
                        </b>
                        <span className="flex flex-wrap items-center gap-1.5">
                          {r.id === justSent ? <StatusChip tone="ok">Just sent</StatusChip> : null}
                          {r.hasUpdate ? <StatusChip tone="plum">Updated</StatusChip> : null}
                          <RequestStatusChip status={r.status} />
                        </span>
                      </span>
                      <span className="mt-0.5 block text-[13px] text-(--ap-muted)">
                        {showOutlet ? `${outletName(r.outletId)} · ` : ""}
                        {DEPARTMENT_LABEL[r.departmentId]} · Start {dayMonth(r.resumptionDate)} · {r.publicId}
                      </span>
                    </span>
                    <ChevronRight className="mt-3 size-4 shrink-0 text-(--ap-faint)" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AnalyticsPanel>
      </div>
    </div>
  );
}
