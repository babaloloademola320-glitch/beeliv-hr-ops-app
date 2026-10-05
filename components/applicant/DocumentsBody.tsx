"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Exclaim,
  Check,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FilePenLine,
  FileText,
  FolderOpen,
  LockKeyhole,
  Plus,
  RefreshCw,
  ShieldCheck,
  Upload,
  X,
  type LucideIcon,
} from "@/components/applicant/icons";
import { toast } from "@/components/ui/toast";
import { DOCUMENT_TYPES, documentTypeOf, type DocumentTypeInfo } from "@/lib/applicant/reference-data";
import { addOptionalDocument, fulfilPreEmploymentDocument, useApplicantStore } from "@/lib/applicant/service";
import { formatDate, formatDueLabel, formatRelativePast } from "@/lib/applicant/time";
import type { ApplicantDocument, DocumentTypeKey } from "@/lib/applicant/types";
import { confirmAction } from "./ConfirmDialog";
import { DOC_TYPE_ICON, documentIcon, documentStatus } from "./document-meta";
import { ContactInput } from "./form-fields";
import { FieldError, useFlagInvalid } from "./form-feedback";
import { Chip, PageHeading, EmptyState } from "./primitives";
import { Reveal } from "./motion";
import { CARD, IconTile, sectionTitleClass, type TileTone } from "./SectionCard";
import { SelectMenu } from "./SelectMenu";

const ICON_BTN =
  "inline-flex size-11 items-center justify-center rounded-xl text-(--ap-ink-2) hover:bg-(--ap-line-2) focus-visible:outline-2 focus-visible:outline-(--ap-violet)";

export function DocumentsBody() {
  const store = useApplicantStore();
  // "Requested by Beeliv" = pre-employment items tied to an application. Optional
  // documents the applicant added themselves (e.g. "Other supporting documents")
  // sit in the stored list even when their category is pre-employment.
  const requested = store.documents.filter((d) => d.category === "pre-employment" && d.forApplicationId);
  const applicationDocs = store.documents.filter((d) => !requested.includes(d));
  const [adding, setAdding] = useState(false);
  const openCount = requested.filter((r) => r.status === "action-required").length;
  const verifiedCount = applicationDocs.filter((d) => d.status === "verified").length;
  const inReviewCount = applicationDocs.filter((d) => d.status === "pending-review").length;

  if (store.documents.length === 0) {
    return (
      <div>
        <PageHeading title="Documents" subtitle="Stored once, reused across your applications." />
        <div className={CARD}>
          <EmptyState
            icon={FolderOpen}
            title="No documents yet"
            description="Your CV, photo and ID live here once you add them. You upload each one once and reuse it on every application."
            action={
              <div className="flex flex-col items-center gap-2.5 min-[480px]:flex-row">
                <Link href="/applicant/jobs" className="ap-btn ap-btn-p text-white! hover:text-white!">
                  Find a role to apply for
                </Link>
                <Link href="/applicant/profile" className="ap-btn ap-btn-s">
                  Complete my profile
                </Link>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeading title="Documents" subtitle="Stored once, reused across your applications. Only verified files are shared with employers." />

      {/* Applications at the Documentation stage (index 3) → the onboarding documentation form */}
      {store.applications
        .filter((a) => a.lifecycle === "submitted" && a.stage === 3)
        .map((a) => (
          <Link
            key={a.id}
            href={`/applicant/applications/${a.id}/documentation`}
            className="ap-card ap-card-hover mb-5 flex items-center gap-3.5 border-[#FCD34D]! bg-[#FFFBEB]! p-4 text-(--ap-ink)! max-[640px]:items-start"
          >
            <IconTile icon={FilePenLine} tone="a" className="size-11 shrink-0 rounded-xl" />
            <span className="min-w-0 flex-1">
              <b className="block text-[15px]">Complete your documentation for {a.role}</b>
              <span className="block text-[13px] text-(--ap-muted)">
                {a.company}<span className="max-[767px]:hidden"> · personal details, employment, next of kin, NIN & bank details, and the onboarding terms</span>
              </span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-(--ap-violet)" aria-hidden="true" />
          </Link>
        ))}

      <p className="mb-4 text-[15px] text-(--ap-muted) min-[768px]:hidden">
        {verifiedCount} approved · {inReviewCount} in review · {openCount} to do
      </p>
      <div className="mb-5 grid grid-cols-3 gap-3.5 max-[767px]:hidden">
        <SummaryTile icon={ShieldCheck} tone="v" value={verifiedCount} label="Approved" />
        <SummaryTile icon={Clock3} tone="a" value={inReviewCount} label="In review" />
        <SummaryTile icon={openCount > 0 ? Exclaim : ShieldCheck} tone={openCount > 0 ? "r" : "v"} value={openCount} label="Action required" />
      </div>

      {requested.length > 0 ? (
        <Reveal as="section" className="mb-[22px]" aria-labelledby="req-h">
          <div className="mb-[18px] flex items-center justify-between gap-3">
            <h2 id="req-h" className={sectionTitleClass()}>
              Requested by Beeliv
            </h2>
            <Chip tone={openCount ? "warn" : "ok"}>{openCount ? `${openCount} to do` : "All sent"}</Chip>
          </div>
          {openCount === 0 ? (
            <div className="mb-3 flex items-start gap-3 rounded-2xl border border-[#B9E6C9] bg-[#EAF8EF] p-3.5 text-[15px] text-[#14532D]">
              <Check className="mt-0.5 size-5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
              <span>
                <b className="block">All documents sent</b>
                Beeliv will review them within 1 working day and tell you here.
              </span>
            </div>
          ) : null}
          <div className="flex flex-col gap-3">
            {requested.map((r) => {
              const app = store.applications.find((a) => a.id === r.forApplicationId);
              return <RequiredDocCard key={r.id} doc={r} applicationLabel={app ? `${app.role} · ${app.company}` : ""} />;
            })}
          </div>
        </Reveal>
      ) : null}

      <Reveal as="section" className={CARD} aria-labelledby="appdocs-h">
        <div className="mb-[18px] flex items-center justify-between gap-3 max-[640px]:flex-wrap">
          <h2 id="appdocs-h" className={sectionTitleClass()}>
            Application documents
          </h2>
          {adding ? null : (
            <button type="button" onClick={() => setAdding(true)} className="ap-btn ap-btn-s ap-btn-sm">
              <Plus className="size-4" aria-hidden="true" />
              Add document
            </button>
          )}
        </div>
        {adding ? <AddDocumentPanel onClose={() => setAdding(false)} /> : null}
        {applicationDocs.length === 0 ? (
          <div className="border-t border-(--ap-line-2)">
            <EmptyState
              icon={FolderOpen}
              title="No application documents yet"
              description="Add your CV, a passport photograph and a valid ID. They are saved once and reused on every application."
              action={
                adding ? undefined : (
                  <button type="button" onClick={() => setAdding(true)} className="ap-btn ap-btn-p">
                    <Plus className="size-4" aria-hidden="true" />
                    Add document
                  </button>
                )
              }
            />
          </div>
        ) : (
          <ul className="m-0 list-none p-0">
            {applicationDocs.map((d) => (
              <DocRow key={d.id} doc={d} />
            ))}
          </ul>
        )}
        <div className="mt-5 flex gap-2.5 rounded-xl bg-(--ap-tint) p-3.5 text-sm text-(--ap-ink-2)">
          <LockKeyhole className="mt-0.5 size-[18px] shrink-0 text-(--ap-violet)" aria-hidden="true" />
          <span>
            Saved documents are reused automatically on new applications. Guarantor, references and medical/fitness documents are only
            requested later, if you reach that stage.
          </span>
        </div>
      </Reveal>

      <DocumentChecklist documents={store.documents} />
    </div>
  );
}

const STATUS_RANK = { verified: 2, "pending-review": 1, "action-required": 0 } as const;

/**
 * Module 1 §3 "Document Checklist": every document type with the doc's own
 * Required column and status wording. A type with no record yet shows
 * "Pending". Phones stack the Required text under the name.
 */
function DocumentChecklist({ documents }: { documents: ApplicantDocument[] }) {
  const rows = DOCUMENT_TYPES.map((t) => {
    const best = documents
      .filter((d) => documentTypeOf(d)?.key === t.key)
      .sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status])[0];
    return { t, best };
  });
  const group = (category: DocumentTypeInfo["category"]) => rows.filter((r) => r.t.category === category);
  return (
    <Reveal as="section" className={`${CARD} mt-[22px]`} aria-labelledby="checklist-h">
      <div className="mb-1.5 flex items-center gap-3">
        <IconTile icon={FileCheck2} className="size-10 rounded-[12px]" iconClassName="size-5" />
        <h2 id="checklist-h" className={sectionTitleClass()}>
          Document checklist
        </h2>
      </div>
      <p className="ap-sm mb-4">You don&apos;t need everything to apply. Pre-employment documents are only requested once you reach that stage.</p>
      {(["application", "pre-employment"] as const).map((cat) => (
        <div key={cat} className="[&+&]:mt-5">
          <div className="ap-eb mb-1">{cat === "application" ? "Application documents" : "Pre-employment documents"}</div>
          <div role="table" aria-label={cat === "application" ? "Application documents checklist" : "Pre-employment documents checklist"}>
            <div
              role="row"
              className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-3 py-2 text-[13px] font-semibold text-(--ap-muted) max-[640px]:hidden"
            >
              <span role="columnheader">Document</span>
              <span role="columnheader">Required</span>
              <span role="columnheader" className="text-right">
                Status
              </span>
            </div>
            {group(cat).map(({ t, best }) => {
              const Icon = DOC_TYPE_ICON[t.key];
              const status = best ? documentStatus(best) : { label: "Pending", tone: "warn" as const };
              return (
                <div
                  role="row"
                  key={t.key}
                  className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center gap-3 border-t border-(--ap-line-2) py-2.5 max-[640px]:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <span role="cell" className="flex min-w-0 items-center gap-2.5">
                    <Icon className="size-[18px] shrink-0 text-(--ap-violet)" aria-hidden="true" />
                    <span className="min-w-0">
                      <b className="block text-[15px] font-semibold">{t.label}</b>
                      {t.example ? <span className="block text-[13px] text-(--ap-muted)">{t.example}</span> : null}
                      <span className="block text-[13px] text-(--ap-muted) min-[641px]:hidden">Required: {t.required}</span>
                    </span>
                  </span>
                  <span role="cell" className="text-sm text-(--ap-ink-2) max-[640px]:hidden">
                    {t.required}
                  </span>
                  <span role="cell" className="justify-self-end">
                    <Chip tone={status.tone}>{status.label}</Chip>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </Reveal>
  );
}

/**
 * "Add document": the applicant picks one of the optional Module 1 §3 types
 * (DOCUMENT_TYPES[].selfAdd), then chooses a file. Mock only — the file never
 * leaves the browser; the record is saved to localStorage for review.
 */
function AddDocumentPanel({ onClose }: { onClose: () => void }) {
  const options = DOCUMENT_TYPES.filter((t) => t.selfAdd);
  const [type, setType] = useState<DocumentTypeKey | "">("");
  const info = options.find((t) => t.key === type);

  function accept(file: File | undefined) {
    if (!file || !info) return;
    if (!ACCEPTED.test(file.name)) {
      toast.add({ title: "Use a PDF, JPG or PNG file", type: "error" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.add({ title: "That file is over 10 MB", description: "Try a smaller scan or photo.", type: "error" });
      return;
    }
    void addOptionalDocument(info.key, file.name);
    toast.add({ title: `${info.label} added. Beeliv will review it within 1 working day.`, type: "success" });
    onClose();
  }

  return (
    <div className="mb-4 rounded-[14px] border border-(--ap-line) bg-[#FBF8FD] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <b className="text-[15px]">Add a document</b>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex size-9 items-center justify-center rounded-[10px] text-(--ap-muted) hover:bg-(--ap-line-2) hover:text-(--ap-ink)"
        >
          <X className="size-4.5" aria-hidden="true" />
        </button>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <label htmlFor="add-doc-type" className="text-sm font-semibold text-(--ap-ink-2)">
          Document type
        </label>
        <SelectMenu
          id="add-doc-type"
          placeholder="Choose a document type"
          value={type}
          options={options.map((t) => ({ value: t.key, label: `${t.label} · ${t.required.toLowerCase()}` }))}
          onChange={(v) => setType(v as DocumentTypeKey)}
        />
        {info?.example ? <span className="ap-sm">{info.example.charAt(0).toUpperCase() + info.example.slice(1)}</span> : null}
      </div>
      {info ? (
        <label className="ap-drop relative mt-3.5">
          <Upload className="size-[26px] text-(--ap-violet)" aria-hidden="true" />
          <b className="text-[15px]">Upload {info.label.toLowerCase()}</b>
          <span className="text-[13px] text-(--ap-muted)">
            Tap to <u>browse</u> · PDF, JPG or PNG up to 10 MB
          </span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="absolute size-px opacity-0"
            onChange={(e) => {
              accept(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      ) : null}
    </div>
  );
}

function SummaryTile({ icon, tone, value, label }: { icon: LucideIcon; tone: TileTone; value: number; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-(--ap-line) bg-white p-4 max-[767px]:flex-col max-[767px]:items-start max-[767px]:gap-1.5 max-[767px]:p-3">
      <IconTile
        icon={icon}
        tone={tone}
        className={`size-10 rounded-[13px] max-[767px]:size-[34px] max-[767px]:rounded-[10px] ${tone === "r" ? "bg-[#C8102E]! text-white!" : ""}`}
        iconClassName="size-6 max-[767px]:size-5"
      />
      <span className="min-w-0">
        <b className="block text-[22px] leading-[1.1] font-bold tracking-[-0.01em] tabular-nums">{value}</b>
        <span className="text-[13px] text-(--ap-muted)">{label}</span>
      </span>
    </div>
  );
}

function DocRow({ doc: d }: { doc: ApplicantDocument }) {
  const ok = d.status === "verified";
  const status = documentStatus(d);
  // Valid ID: show which accepted ID was supplied (e.g. "NIN slip").
  const example = documentTypeOf(d)?.key === "valid-id" && d.description ? d.description : null;
  const used = d.usedInApplicationIds.length;
  const replaceRef = useRef<HTMLInputElement>(null);
  return (
    <li className="grid grid-cols-[44px_minmax(0,1.3fr)_minmax(0,1fr)_auto_auto] items-center gap-3.5 border-t border-(--ap-line-2) py-3.5 max-[1040px]:grid-cols-[44px_minmax(0,1fr)_auto] max-[640px]:grid-cols-[40px_minmax(0,1fr)] max-[640px]:gap-y-2">
      <IconTile icon={documentIcon(d)} className="size-11 rounded-xl max-[640px]:size-10" />
      <div className="min-w-0">
        <b className="block text-[15px]">
          {d.name}
          {example ? <span className="font-medium text-(--ap-muted)"> · {example}</span> : null}
        </b>
        <span className="block truncate ap-sm">
          {[d.fileName, d.size, d.uploadedOn ? formatDate(d.uploadedOn) : null].filter(Boolean).join(" · ")}
        </span>
      </div>
      <span className="text-[13px] text-(--ap-ink-2) max-[1040px]:hidden">
        {used ? `Used in ${used} application${used === 1 ? "" : "s"}` : "Not used yet"}
        <small className="block text-[13px] text-(--ap-muted)">Reused automatically</small>
      </span>
      <span className="max-[640px]:col-start-2 max-[640px]:justify-self-start">
        <Chip tone={status.tone} icon={ok ? ShieldCheck : Clock3}>
          {status.label}
        </Chip>
      </span>
      <span className="flex gap-1 max-[1040px]:col-start-2 max-[1040px]:col-end-[-1] max-[1040px]:-my-1.5 max-[1040px]:-ml-2.5">
        <button type="button" aria-label={`View ${d.name}`} title="View" onClick={() => toast.add({ title: "Opens a secure preview" })} className={ICON_BTN}>
          <Eye className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`Download ${d.name}`}
          title="Download"
          onClick={() => toast.add({ title: `Downloads ${d.fileName ?? d.name}`, description: "File storage isn't connected in this preview." })}
          className={ICON_BTN}
        >
          <Download className="size-5" aria-hidden="true" />
        </button>
        <button type="button" aria-label={`Replace ${d.name}`} title="Replace" onClick={() => {
            // Replacing an already-verified file resets its review, so confirm first.
            if (!ok) return replaceRef.current?.click();
            confirmAction({
              tone: "caution",
              icon: RefreshCw,
              title: `Replace your verified ${d.name}?`,
              description: "Choose the new file on the next step.",
              points: ["The new file goes back to review before it's shared with employers."],
              confirmLabel: "Choose new file",
              onConfirm: () => replaceRef.current?.click(),
            });
          }}
          className={ICON_BTN}
        >
          <RefreshCw className="size-5" aria-hidden="true" />
        </button>
        <input
          ref={replaceRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) toast.add({ title: `${f.name} selected`, description: `Replacing your ${d.name} isn't connected in this preview. Nothing was changed.` });
          }}
        />
      </span>
    </li>
  );
}

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = /\.(pdf|jpe?g|png)$/i;

function RequiredDocCard({ doc: r, applicationLabel }: { doc: ApplicantDocument; applicationLabel: string }) {
  const done = r.status !== "action-required";
  const [uploading, setUploading] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [refs, setRefs] = useState({ n1: "", c1: "", n2: "", c2: "" });
  const [refsTried, setRefsTried] = useState(false);
  const refsForm = useRef<HTMLFormElement>(null);
  const flagRefs = useFlagInvalid(refsForm);
  const [barFull, setBarFull] = useState(false);
  const Icon = documentIcon(r);
  const status = documentStatus(r);

  // Animate the progress bar from 0 -> 100% once the uploaded state paints (wireframe .upl .pb data-w).
  useEffect(() => {
    if (!uploading && !done) return;
    const id = requestAnimationFrame(() => setBarFull(true));
    return () => cancelAnimationFrame(id);
  }, [uploading, done]);

  function accept(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.test(file.name)) {
      toast.add({ title: "Use a PDF, JPG or PNG file", type: "error" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.add({ title: "That file is over 10 MB", description: "Try a smaller scan or photo.", type: "error" });
      return;
    }
    setBarFull(false);
    setUploading(file.name);
    // Wireframe fakeUpload(): ~1.3s simulated transfer. No file leaves the browser.
    window.setTimeout(() => {
      void fulfilPreEmploymentDocument(r.id, file.name);
      setUploading(null);
      toast.add({ title: "Submitted. Beeliv will review it within 1 working day.", type: "success" });
    }, 1300);
  }

  const refsReady = refs.n1.trim() && refs.c1.trim() && refs.n2.trim() && refs.c2.trim();

  return (
    <div className={done ? "rounded-2xl border border-(--ap-line) bg-white p-[18px]" : "rounded-2xl border border-[#FCD34D] bg-linear-to-b from-[#FFFBEB] to-white p-[18px]"}>
      <div className="mb-3.5 flex items-start justify-between gap-3 max-[640px]:flex-wrap">
        <div className="flex gap-3 max-[640px]:flex-[1_1_100%]">
          <IconTile icon={done ? Check : Icon} tone={done ? "ok" : "a"} />
          <div className="min-w-0">
            <b className="block text-base">{r.name}</b>
            <span className="text-[13px] text-(--ap-muted)">{[applicationLabel, r.due ? formatDueLabel(r.due) : ""].filter(Boolean).join(" · ")}</span>
          </div>
        </div>
        <span className="max-[640px]:ml-14">
          <Chip tone={status.tone}>{status.label}</Chip>
        </span>
      </div>
      {r.description && !done ? <p className="ap-bd -mt-1 mb-3.5 text-(--ap-ink-2)">{r.description}</p> : null}

      {r.hasTemplate && !done && !uploading ? (
        <button
          type="button"
          onClick={() => toast.add({ title: "Guarantor form template downloaded", type: "success" })}
          className="ap-btn ap-btn-s ap-btn-sm mb-3"
        >
          <Download className="size-4" aria-hidden="true" />
          Download template
        </button>
      ) : null}

      {done || uploading ? (
        <div className="flex items-center gap-3 rounded-xl border border-(--ap-line) bg-white px-3.5 py-3 max-[640px]:grid max-[640px]:grid-cols-[40px_minmax(0,1fr)] max-[640px]:gap-x-3 max-[640px]:gap-y-1">
          <IconTile icon={FileText} className="size-10 rounded-[10px] max-[640px]:row-span-2" />
          <div className="min-w-0 flex-1">
            <b className="block truncate text-sm">{uploading ?? r.fileName}</b>
            <span className="block truncate ap-sm" aria-live="polite">
              {uploading
                ? "Uploading…"
                : `Submitted ${r.uploadedOn ? lowerFirst(formatRelativePast(r.uploadedOn)) : "just now"} · Beeliv will review it within 1 working day`}
            </span>
            <div className="ap-pb" role="progressbar" aria-label={`Upload progress for ${r.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={barFull ? 100 : 0}>
              <i style={{ width: barFull ? "100%" : "0%" }} />
            </div>
          </div>
          <span className="max-[640px]:col-start-2 max-[640px]:justify-self-start">
            <Chip tone={uploading ? "mute" : status.tone}>{uploading ? "Uploading" : status.label}</Chip>
          </span>
        </div>
      ) : r.isReferenceForm ? (
        <form
          ref={refsForm}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!refsReady) {
              setRefsTried(true);
              flagRefs();
              return;
            }
            void fulfilPreEmploymentDocument(r.id, "Two references added");
            toast.add({ title: "References saved", type: "success" });
          }}
        >
          <div className="grid grid-cols-2 gap-x-[18px] gap-y-4 max-[640px]:grid-cols-1">
            <RefField id={`${r.id}-n1`} error={refsTried && !refs.n1.trim() ? "Enter your first reference's name and role." : undefined} label="Reference 1 · name and role" placeholder="e.g. Tunde A., Restaurant Manager" value={refs.n1} onChange={(v) => setRefs({ ...refs, n1: v })} />
            <ContactInput id={`${r.id}-c1`} error={refsTried && !refs.c1.trim() ? "Enter a phone number or email for reference 1." : undefined} label="Phone or email" value={refs.c1} onChange={(v) => setRefs({ ...refs, c1: v })} />
            <RefField id={`${r.id}-n2`} error={refsTried && !refs.n2.trim() ? "Enter your second reference's name and role." : undefined} label="Reference 2 · name and role" value={refs.n2} onChange={(v) => setRefs({ ...refs, n2: v })} />
            <ContactInput id={`${r.id}-c2`} error={refsTried && !refs.c2.trim() ? "Enter a phone number or email for reference 2." : undefined} label="Phone or email" value={refs.c2} onChange={(v) => setRefs({ ...refs, c2: v })} />
          </div>
          <button type="submit" className="ap-btn ap-btn-p ap-btn-sm mt-3.5">
            Save references
          </button>
        </form>
      ) : (
        <label
          className={`ap-drop relative ${over ? "ap-drop-over border-(--ap-violet)! bg-(--ap-tint)!" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            accept(e.dataTransfer.files?.[0]);
          }}
        >
          <Upload className="size-[26px] text-(--ap-violet)" aria-hidden="true" />
          <b className="text-[15px]">Upload {r.name.toLowerCase()}</b>
          <span className="text-[13px] text-(--ap-muted)">
            Drag a file here or <u>browse</u> · PDF, JPG or PNG up to 10 MB
          </span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="absolute size-px opacity-0"
            onChange={(e) => {
              accept(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}

function RefField({ id, label, placeholder, value, onChange, error }: { id: string; label: string; placeholder?: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div data-ap-field className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-(--ap-ink-2)">
        {label}
      </label>
      <input id={id} className="ap-input" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined} />
      <FieldError id={`${id}-err`}>{error}</FieldError>
    </div>
  );
}

function lowerFirst(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
