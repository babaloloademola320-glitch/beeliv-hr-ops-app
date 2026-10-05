"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useState } from "react";
import { Check, ChevronRight, ShieldCheck, X } from "@/components/applicant/icons";
import { newsreader } from "@/components/applicant/fonts";
import { confirmAction } from "@/components/applicant/ConfirmDialog";
import { Reveal } from "@/components/applicant/motion";
import { Chip, EmptyState, PageHeading } from "@/components/applicant/primitives";
import { CARD, IconTile } from "@/components/applicant/SectionCard";
import { toast } from "@/components/ui/toast";
import { longDate } from "@/lib/staff/format";
import { useStaffRecords } from "@/lib/staff/hooks";
import { acknowledgeStaffRecord } from "@/lib/staff/service";
import type { StaffRecord } from "@/lib/staff/types";
import { ClipboardList } from "../icons";
import { withStaffPreloader } from "../StaffPreloader";
import { PageError } from "./PageError";
import { RecordsSkeleton } from "./RecordsSkeleton";

/**
 * Warnings & Records (brief section 12). Deliberately neutral: plain labels,
 * calm tones (never red/warn), no stages, strikes, penalties or appeal rules -
 * the type label and wording are authored by Beeliv. Attachments/evidence are
 * not in the data contract yet (TBD), so none are shown.
 */
function statusChip(r: StaffRecord) {
  if (r.status === "acknowledged") return <Chip tone="ok" icon={Check}>Acknowledged</Chip>;
  if (r.status === "closed") return <Chip tone="mute">Closed</Chip>;
  return <Chip tone="info">{r.requiresAcknowledgement ? "Awaiting your acknowledgement" : "Open"}</Chip>;
}

export function RecordsBody() {
  const { data, status, retry } = useStaffRecords();
  const [openId, setOpenId] = useState<string | null>(null);

  if (status === "loading") return <RecordsSkeleton />;
  if (status === "error") return <PageError title="Warnings & Records" what="your records" retry={retry} />;

  const records = [...(data ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const open = records.find((r) => r.id === openId) ?? null;

  return (
    <div>
      <PageHeading title="Warnings & Records" subtitle="Records relating to your employment that Beeliv has shared with you." />

      {status === "empty" || records.length === 0 ? (
        <div className={CARD}>
          <EmptyState icon={ClipboardList} title="No records to show" description="When Beeliv shares a record with you, it appears here. Having nothing here is normal." />
        </div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {records.map((r) => (
            <Reveal as="li" key={r.id}>
              <button
                type="button"
                onClick={() => setOpenId(r.id)}
                className="ap-card ap-card-hover flex w-full items-center gap-3.5 rounded-[18px] p-4 text-left min-[768px]:p-5"
              >
                <IconTile icon={ClipboardList} tone="v" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <b className="ap-title">{r.type}</b>
                    <span className="ap-label text-(--ap-muted)">{longDate(r.date)}</span>
                  </span>
                  <span className="ap-sm mt-1 line-clamp-2 block text-(--ap-ink-2)">{r.summary}</span>
                  <span className="mt-2 block min-[768px]:hidden">{statusChip(r)}</span>
                </span>
                <span className="hidden shrink-0 min-[768px]:block">{statusChip(r)}</span>
                <ChevronRight className="size-4 shrink-0 text-(--ap-muted)" aria-hidden="true" />
              </button>
            </Reveal>
          ))}
        </ul>
      )}

      <RecordSheet record={open} onClose={() => setOpenId(null)} />
    </div>
  );
}

/** Detail: bottom sheet on phones, right-hand panel from 768px. */
function RecordSheet({ record, onClose }: { record: StaffRecord | null; onClose: () => void }) {
  // Keep the last record while the sheet animates out.
  const [shown, setShown] = useState<StaffRecord | null>(null);
  if (record && record !== shown) setShown(record);
  const r = record ?? shown;

  async function acknowledge() {
    if (!r) return;
    const ok = await confirmAction({
      tone: "neutral",
      title: "Acknowledge this record?",
      description: "Your acknowledgement is recorded against this record on your Beeliv account.",
      confirmLabel: "Acknowledge",
    });
    if (!ok) return;
    try {
      await withStaffPreloader("save", () => acknowledgeStaffRecord(r.id));
      toast.add({ title: "Acknowledgement recorded", type: "success" });
    } catch {
      toast.add({ title: "We couldn't record that", description: "Please try again.", type: "error" });
    }
  }

  return (
    <Dialog.Root open={record !== null} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-[rgba(17,17,27,.36)] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          className={`applicant-shell ${newsreader.variable} fixed z-[71] flex flex-col bg-white outline-none transition-transform duration-[250ms] ease-[cubic-bezier(.2,.7,.2,1)] max-[767px]:inset-x-0 max-[767px]:bottom-0 max-[767px]:max-h-[86vh] max-[767px]:rounded-t-[22px] max-[767px]:data-ending-style:translate-y-full max-[767px]:data-starting-style:translate-y-full min-[768px]:inset-y-0 min-[768px]:right-0 min-[768px]:w-[460px] min-[768px]:max-w-full min-[768px]:data-ending-style:translate-x-full min-[768px]:data-starting-style:translate-x-full`}
        >
          {r ? (
            <>
              <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 min-[768px]:px-6 min-[768px]:pt-6">
                <div className="min-w-0">
                  <div className="ap-eb">Record</div>
                  <Dialog.Title className="ap-serif m-0 text-[28px] leading-tight">{r.type}</Dialog.Title>
                </div>
                <Dialog.Close aria-label="Close" className="flex size-10 shrink-0 items-center justify-center rounded-xl hover:bg-(--ap-line-2)">
                  <X className="size-5" aria-hidden="true" />
                </Dialog.Close>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] min-[768px]:px-6">
                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="ap-label text-(--ap-muted)">Date</dt>
                    <dd className="ap-sm mt-1 rounded-xl border border-(--ap-line) bg-(--ap-tint-soft) px-3 py-2 font-semibold text-(--ap-ink)">{longDate(r.date)}</dd>
                  </div>
                  <div>
                    <dt className="ap-label text-(--ap-muted)">Status</dt>
                    <dd className="mt-1 flex min-h-10 items-center">{statusChip(r)}</dd>
                  </div>
                </dl>
                <h3 className="ap-label mt-5 text-(--ap-muted)">Summary</h3>
                <Dialog.Description className="ap-bd mt-1.5 text-(--ap-ink-2)">{r.summary}</Dialog.Description>

                {r.requiresAcknowledgement && r.status === "open" ? (
                  <div className="mt-5 rounded-2xl border border-(--ap-line) bg-(--ap-tint-soft) p-4">
                    <b className="ap-title block">Beeliv asks you to acknowledge this record</b>
                    <p className="ap-sm mt-1">Take your time to read it. If anything is unclear, contact Beeliv from Help &amp; support.</p>
                    <button type="button" onClick={acknowledge} className="ap-btn ap-btn-p mt-3 max-[640px]:w-full">
                      <ShieldCheck className="size-4" aria-hidden="true" /> Acknowledge
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
