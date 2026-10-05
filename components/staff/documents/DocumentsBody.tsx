"use client";

import { useRef, useState } from "react";
import { Clock3, FileText, Files, Upload } from "@/components/applicant/icons";
import { Chip, EmptyState, PageHeading } from "@/components/applicant/primitives";
import { CARD, IconTile, SectionCard, type TileTone } from "@/components/applicant/SectionCard";
import { toast } from "@/components/ui/toast";
import { dueLabel, timeAgo } from "@/lib/staff/format";
import { useStaffDocuments } from "@/lib/staff/hooks";
import { replaceStaffDocument, uploadStaffDocument } from "@/lib/staff/service";
import type { DocumentGroup, DocumentStatus, StaffDocument } from "@/lib/staff/types";
import { CircleCheck } from "../icons";
import { ImageRoom } from "../ImageRoom";
import { HeadingSkeleton, PageError, SK } from "../leave/states";
import { ACCEPT, fileProblem, FORMATS } from "./file-rules";

const GROUPS: { key: DocumentGroup; label: string }[] = [
  { key: "identity", label: "Personal / Identity" },
  { key: "employment", label: "Employment" },
  { key: "payroll", label: "Payroll / Banking" },
  { key: "certificates", label: "Certificates" },
  { key: "agreements", label: "Agreements & Consents" },
  { key: "other", label: "Other requested documents" },
];

const STATUS_CHIP: Record<DocumentStatus, React.ReactNode> = {
  required: <Chip tone="warn">Required</Chip>,
  uploaded: <Chip tone="info">Uploaded</Chip>,
  "under-review": <Chip tone="info">Under review</Chip>,
  verified: <Chip tone="ok">Verified</Chip>,
  "update-required": <Chip tone="warn">Update required</Chip>,
  expired: <span className="ap-chip bg-(--ap-rose-bg) text-(--ap-rose)">Expired</span>,
};
const STATUS_TONE: Record<DocumentStatus, TileTone> = { required: "a", uploaded: "v", "under-review": "v", verified: "ok", "update-required": "a", expired: "r" };
const needsAction = (d: StaffDocument) => d.status === "required" || d.status === "update-required" || d.status === "expired";

export function DocumentsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your documents">
      <HeadingSkeleton title="Documents" />
      <div className="flex flex-col gap-5">
        <div className={`${SK} h-[84px]`} />
        <div className="grid grid-cols-1 gap-5 min-[1241px]:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-5">
            <div className={`${SK} h-[220px]`} />
            <div className={`${SK} h-[180px]`} />
          </div>
          <div className={`${SK} hidden h-[220px] min-[1241px]:block`} />
        </div>
      </div>
    </div>
  );
}

/**
 * Staff Document Centre, grouped by DocumentGroup. Rows show name, status,
 * file name (never file contents or sensitive values) and one contextual
 * action. Who may see which document is a backend/RLS decision.
 */
export function DocumentsBody() {
  const { data, status, retry } = useStaffDocuments();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (status === "loading") return <DocumentsSkeleton />;

  async function send(doc: StaffDocument, file: File) {
    const problem = fileProblem(file);
    if (problem) {
      toast.add({ title: problem, type: "error" });
      return;
    }
    setBusyId(doc.id);
    try {
      // Replace when a file already exists, otherwise a first upload.
      await (doc.fileName ? replaceStaffDocument(doc.id, file) : uploadStaffDocument(doc.id, file));
      toast.add({ title: "Document sent", description: `${doc.name} is now with Beeliv for review.`, type: "success" });
    } catch {
      toast.add({ title: "We couldn't upload that file", description: "Please try again.", type: "error" });
    } finally {
      setBusyId(null);
    }
  }

  const docs = data ?? [];
  const pending = docs.filter(needsAction).length;

  return (
    <>
      <PageHeading title="Documents" subtitle="Upload what Beeliv needs and keep your records current." />
      {status === "error" ? (
        <PageError what="your documents" retry={retry} />
      ) : docs.length === 0 ? (
        <div className={CARD}>
          <EmptyState icon={Files} title="No documents yet" description="When Beeliv asks for a document, or you have one on file, it appears here." />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <section className={`${CARD} flex items-center gap-4`} aria-live="polite">
            <IconTile icon={pending ? Clock3 : CircleCheck} tone={pending ? "a" : "ok"} className="size-12 rounded-2xl" />
            <div className="min-w-0">
              <b className="ap-title block">{pending ? `${pending} ${pending === 1 ? "document needs" : "documents need"} your attention` : "Your documents are up to date"}</b>
              <span className="ap-sm block text-(--ap-muted)">{pending ? "Upload the items marked Required, Update required or Expired." : "Nothing is waiting on you right now."}</span>
            </div>
          </section>
          <div className="flex flex-col gap-5 min-[1241px]:grid min-[1241px]:grid-cols-[minmax(0,1fr)_340px] min-[1241px]:items-start">
            <div className="flex min-w-0 flex-col gap-5">
              {GROUPS.map((g) => {
                const items = docs.filter((d) => d.group === g.key);
                if (items.length === 0) return null;
                return (
                  <SectionCard key={g.key} title={g.label}>
                    <ul className="flex flex-col gap-3">
                      {items.map((d) => (
                        <DocRow key={d.id} doc={d} busy={busyId === d.id} disabled={busyId !== null} onFile={(f) => send(d, f)} />
                      ))}
                    </ul>
                  </SectionCard>
                );
              })}
            </div>
            <SectionCard title="Before you upload" aside className="min-w-0">
              <ImageRoom src={null} icon={Files} className="mb-4 h-[120px] w-full rounded-2xl" iconClassName="size-10" />
              <p className="ap-sm text-(--ap-muted)">Accepted files: {FORMATS}. Only upload documents Beeliv has asked for. Use Replace if a document has changed.</p>
            </SectionCard>
          </div>
        </div>
      )}
    </>
  );
}

function DocRow({ doc, busy, disabled, onFile }: { doc: StaffDocument; busy: boolean; disabled: boolean; onFile: (f: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const first = doc.status === "required";
  const label = first ? "Upload" : doc.requestNote && needsAction(doc) ? "Respond to request" : needsAction(doc) ? "Upload new" : "Replace";
  const primary = needsAction(doc);
  const detail = doc.fileName ? `${doc.fileName}${doc.updatedAt ? ` - updated ${timeAgo(doc.updatedAt)}` : ""}` : "No file uploaded yet";

  return (
    <li className="rounded-2xl border border-(--ap-line-2) p-3">
      <div className="flex flex-col gap-2.5 min-[768px]:flex-row min-[768px]:items-center min-[768px]:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <IconTile icon={doc.fileName ? FileText : Upload} tone={STATUS_TONE[doc.status]} />
          <div className="min-w-0 flex-1">
            <b className="ap-title block leading-snug">{doc.name}</b>
            <span className="ap-label block truncate text-(--ap-muted)">{detail}</span>
            {doc.dueDate && needsAction(doc) ? <span className="ap-label block font-bold text-(--ap-warn)">{dueLabel(doc.dueDate)}</span> : null}
          </div>
          <div className="shrink-0 min-[768px]:hidden">{STATUS_CHIP[doc.status]}</div>
        </div>
        <div className="flex items-center gap-3 min-[768px]:shrink-0">
          <div className="hidden min-[768px]:block">{STATUS_CHIP[doc.status]}</div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => input.current?.click()}
            aria-label={`${label}: ${doc.name}`}
            className={`ap-btn ap-btn-sm max-[767px]:w-full ${primary ? "ap-btn-p" : "ap-btn-l"}`}
          >
            {busy ? <span className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
            {busy ? "Uploading..." : label}
          </button>
          <input
            ref={input}
            type="file"
            accept={ACCEPT}
            className="hidden"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>
      {/* Beeliv's request note ("Respond to request") */}
      {doc.requestNote && needsAction(doc) ? <p className="ap-sm mt-2.5 rounded-xl bg-(--ap-tint-soft) px-3 py-2 text-(--ap-ink-2)">{doc.requestNote}</p> : null}
    </li>
  );
}
