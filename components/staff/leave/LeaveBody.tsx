"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Plus, Sun } from "@/components/applicant/icons";
import { confirmAction } from "@/components/applicant/ConfirmDialog";
import { CountUp } from "@/components/applicant/CountUp";
import { FilterTabs } from "@/components/applicant/FilterTabs";
import { EmptyState, PageHeading } from "@/components/applicant/primitives";
import { CARD, IconTile, SectionCard } from "@/components/applicant/SectionCard";
import { toast } from "@/components/ui/toast";
import { dayMonth, longDate, timeAgo } from "@/lib/staff/format";
import { useLeaveRequests, useStaffHome } from "@/lib/staff/hooks";
import { cancelLeaveRequest } from "@/lib/staff/service";
import type { LeaveRequest, LeaveStatus } from "@/lib/staff/types";
import { LeaveStatusChip, rangeLabel } from "./leave-meta";
import { RequestForm } from "./RequestForm";
import { Sheet } from "./Sheet";
import { HeadingSkeleton, PageError, SK } from "./states";

type Tab = "all" | LeaveStatus;
const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "cancelled", label: "Cancelled" },
];

export function LeaveSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your leave">
      <HeadingSkeleton title="Leave" />
      <div className="flex flex-col gap-5">
        <div className={`${SK} h-[110px]`} />
        <div className="grid grid-cols-1 gap-5 min-[1241px]:grid-cols-[minmax(0,1fr)_400px]">
          <div className={`${SK} h-[360px]`} />
          <div className={`${SK} hidden h-[460px] min-[1241px]:block`} />
        </div>
      </div>
    </div>
  );
}

/**
 * Leave: balance (only when the backend supplies one), request form, history
 * with status filter, and a detail sheet with Cancel for pending requests.
 * On 1241px+ the form sits beside the list; below that it opens from the
 * "Request leave" button so the list stays first on phones.
 */
export function LeaveBody() {
  const { data, status, retry } = useLeaveRequests();
  const [formOpen, setFormOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Bring the form into view when it is opened from the header button.
  useEffect(() => {
    if (formOpen) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [formOpen]);

  if (status === "loading") return <LeaveSkeleton />;

  const requests = [...(data ?? [])].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const shown = tab === "all" ? requests : requests.filter((r) => r.status === tab);
  const count = (t: Tab) => (t === "all" ? requests.length : requests.filter((r) => r.status === t).length);
  const selected = requests.find((r) => r.id === openId) ?? null;

  return (
    <>
      <PageHeading
        title="Leave"
        subtitle="Request leave and follow its status."
        right={
          <button type="button" onClick={() => setFormOpen((v) => !v)} aria-expanded={formOpen} className="ap-btn ap-btn-p min-[1241px]:hidden">
            <Plus className="size-4" aria-hidden="true" /> {formOpen ? "Close form" : "Request leave"}
          </button>
        }
      />
      {status === "error" ? (
        <PageError what="your leave" retry={retry} />
      ) : (
        <div className="flex flex-col gap-5">
          <BalanceCard />
          <div className="flex flex-col gap-5 min-[1241px]:grid min-[1241px]:grid-cols-[minmax(0,1fr)_400px] min-[1241px]:items-start">
            <div ref={formRef} className={`scroll-mt-[90px] min-[1241px]:order-2 ${formOpen ? "" : "hidden min-[1241px]:block"}`}>
              <RequestForm onDone={() => setFormOpen(false)} />
            </div>
            <SectionCard title="My requests" className="min-w-0 min-[1241px]:order-1">
              {requests.length === 0 ? (
                <EmptyState
                  icon={Sun}
                  title="No leave requests yet"
                  description="When you request leave it appears here with its status."
                  action={
                    <button type="button" onClick={() => setFormOpen(true)} className="ap-btn ap-btn-p ap-btn-sm mt-1.5 min-[1241px]:hidden">
                      Request leave
                    </button>
                  }
                />
              ) : (
                <>
                  <FilterTabs label="Filter leave requests" className="mb-4" value={tab} onChange={setTab} options={TABS.map((t) => ({ ...t, count: count(t.key) }))} />
                  {shown.length === 0 ? (
                    <p className="ap-sm py-4 text-(--ap-muted)">No {tab} requests.</p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {shown.map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            onClick={() => setOpenId(r.id)}
                            className="flex w-full items-center gap-3 rounded-2xl border border-(--ap-line-2) p-3 text-left transition-colors hover:border-(--ap-tint-2) hover:bg-(--ap-tint-soft)"
                          >
                            <IconTile icon={Sun} tone={r.status === "approved" ? "ok" : "a"} />
                            <span className="min-w-0 flex-1">
                              <b className="ap-title block">{r.type}</b>
                              <span className="ap-label block text-(--ap-muted)">{rangeLabel(r)}</span>
                            </span>
                            <LeaveStatusChip status={r.status} />
                            <ChevronRight className="size-4 shrink-0 text-(--ap-faint) max-[420px]:hidden" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </SectionCard>
          </div>
        </div>
      )}
      <Sheet open={selected !== null} title="Leave request" onClose={() => setOpenId(null)}>
        {selected ? <Detail req={selected} /> : null}
      </Sheet>
    </>
  );
}

/** Balance comes from the backend's leave summary. We never compute or assume an entitlement. */
function BalanceCard() {
  const { data, status } = useStaffHome();
  if (status === "loading") return <div className={`${SK} h-[110px]`} />;
  const s = data?.leaveSummary ?? null;
  return (
    <section className={`${CARD} flex items-center gap-4`} aria-label="Leave balance">
      <IconTile icon={Sun} tone="a" className="size-14 rounded-2xl" iconClassName="size-[26px]" />
      {s ? (
        <div className="min-w-0">
          <div className="ap-label text-(--ap-muted)">Leave balance</div>
          <b className="ap-serif block text-[34px] leading-none">
            <CountUp value={s.remaining} /> <span className="ap-sm font-semibold">{s.unit} remaining</span>
          </b>
          <span className="ap-sm mt-1 block text-(--ap-muted)">
            {s.used} {s.unit} used
          </span>
        </div>
      ) : (
        <div className="min-w-0">
          <b className="ap-title block">Leave balance</b>
          <span className="ap-sm block text-(--ap-muted)">Your balance appears here once Beeliv confirms your leave arrangements.</span>
        </div>
      )}
    </section>
  );
}

function Detail({ req }: { req: LeaveRequest }) {
  const [busy, setBusy] = useState(false);
  const rows: [string, string][] = [
    ["Leave type", req.type],
    ["Dates", req.startDate === req.endDate ? longDate(req.startDate) : `${longDate(req.startDate)} to ${longDate(req.endDate)}`],
    ["Sent", `${dayMonth(req.submittedAt.slice(0, 10))} (${timeAgo(req.submittedAt)})`],
    ["Reason", req.reason ?? "No reason given"],
    ["Attachment", req.attachmentName ?? "None"],
  ];

  async function cancel() {
    const ok = await confirmAction({
      tone: "caution",
      title: "Cancel this leave request?",
      description: `${req.type}, ${rangeLabel(req)}. Beeliv will see that you cancelled it.`,
      confirmLabel: "Cancel request",
      cancelLabel: "Keep request",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await cancelLeaveRequest(req.id);
      toast.add({ title: "Leave request cancelled", type: "success" });
    } catch {
      toast.add({ title: "We couldn't cancel that request", description: "Please try again.", type: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div>
        <LeaveStatusChip status={req.status} />
      </div>
      <dl className="flex flex-col gap-3">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="ap-label text-(--ap-muted)">{k}</dt>
            <dd className="ap-sm mt-1 rounded-xl border border-(--ap-line) bg-(--ap-tint-soft) px-3 py-2 font-semibold break-words text-(--ap-ink)">{v}</dd>
          </div>
        ))}
      </dl>
      {req.decisionNote ? (
        <div className="rounded-xl bg-(--ap-tint) p-3.5">
          <div className="ap-label text-(--ap-muted)">Note from Beeliv</div>
          <p className="ap-sm mt-1 text-(--ap-ink-2)">{req.decisionNote}</p>
        </div>
      ) : null}
      {req.status === "pending" && req.canCancel ? (
        <button type="button" onClick={cancel} disabled={busy} className="ap-btn ap-btn-s h-12 w-full min-[768px]:w-auto min-[768px]:self-start">
          {busy ? "Cancelling..." : "Cancel request"}
        </button>
      ) : req.status === "pending" ? (
        <p className="ap-sm text-(--ap-muted)">This request can&apos;t be cancelled here. Contact Beeliv if you need to change it.</p>
      ) : null}
    </div>
  );
}
