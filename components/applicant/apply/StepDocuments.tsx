"use client";

import { useEffect, useRef, useState } from "react";
import { Award, Check, FileText, IdCard, Image as ImageIcon, LockKeyhole, Upload, type LucideIcon } from "@/components/applicant/icons";
import { toast } from "@/components/ui/toast";
import { replaceDocumentFile, uploadApplicationDocument, useApplicantStore } from "@/lib/applicant/service";
import { documentTypeOf } from "@/lib/applicant/reference-data";
import type { ApplicantDocument, ApplyFormData, DocumentTypeKey } from "@/lib/applicant/types";
import { FieldError } from "@/components/applicant/form-feedback";
import { CHIP, LINK_CLS, Note, STROKE, SubHead } from "./parts";

/**
 * Documents the applicant uploads ONCE and reuses on every application
 * (wireframe DOCS.slice(0,3); Module 1 §3 "Application Documents"). The
 * ID row is Module 1 §3's "Valid ID" — a copy of an ID document FILE, with
 * the NIN slip as the accepted example; no NIN NUMBER is typed or displayed
 * anywhere in this flow.
 */
export const REUSABLE_DOCS: { name: string; short: string; icon: LucideIcon; docType: DocumentTypeKey; hint?: string }[] = [
  { name: "CV", short: "CV", icon: FileText, docType: "cv" },
  { name: "Passport photograph", short: "passport photo", icon: ImageIcon, docType: "passport-photo" },
  { name: "Valid ID", short: "valid ID", icon: IdCard, docType: "valid-id", hint: "e.g. NIN slip" },
];

/** Role-specific upload the wireframe asks for on this step (a Module 1 §3 "Professional certificate"). */
export const ROLE_CERT_NAME = "Food handler's certificate";

const ACCEPT = ".pdf,.jpg,.jpeg,.png";
/** Wireframe fakeUpload(): the mock "upload" settles after 1.3s. */
const FAKE_UPLOAD_MS = 1300;

/** Matches by checklist type, so records saved under an older name (e.g. "NIN slip") still count as the "Valid ID". */
export function findReusableDoc(documents: ApplicantDocument[], name: string): ApplicantDocument | undefined {
  const want = REUSABLE_DOCS.find((d) => d.name === name)?.docType;
  return documents.find(
    (d) =>
      d.category === "application" &&
      (want ? documentTypeOf(d)?.key === want : d.name === name) &&
      d.fileName &&
      d.status !== "action-required",
  );
}

type Phase = { fileName: string; state: "uploading" | "done" };

/** `.upl` row. On phones (≤640px) it re-flows into the wireframe's 3-column grid. */
function UploadRow({
  icon: Icon,
  title,
  detail,
  status,
  progress,
  action,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  status: React.ReactNode;
  progress?: boolean;
  action?: React.ReactNode;
}) {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    if (!progress) return;
    const id = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(id);
  }, [progress]);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-(--ap-line) bg-white px-3.5 py-3 max-[640px]:grid max-[640px]:grid-cols-[40px_minmax(0,1fr)_auto] max-[640px]:gap-x-3 max-[640px]:gap-y-0.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f8f3fa] text-(--ap-violet) max-[640px]:row-span-2">
        <Icon className="size-5" strokeWidth={STROKE} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 max-[640px]:col-start-2">
        <b className="block text-[14px]">{title}</b>
        <span className="ap-sm block truncate">{detail}</span>
        {progress ? (
          <div className="mt-1.5 h-1 overflow-hidden rounded-[2px] bg-(--ap-line-2)" aria-hidden="true">
            <i className="ap-fill block h-full bg-(--ap-violet) transition-[width] duration-[1200ms] ease-in-out" style={{ width: filled ? "100%" : "0%" }} />
          </div>
        ) : null}
      </div>
      <span className="flex shrink-0 items-center max-[640px]:col-start-2 max-[640px]:row-start-2 max-[640px]:justify-self-start" aria-live="polite">
        {status}
      </span>
      {action ? <span className="ml-2.5 flex shrink-0 items-center max-[640px]:col-start-3 max-[640px]:row-span-2 max-[640px]:row-start-1 max-[640px]:ml-0">{action}</span> : null}
    </div>
  );
}

/** `.drop` dropzone — click to browse or drag a file onto it. */
function DropZone({ title, onFile, error }: { title: string; onFile: (file: File) => void; error?: string }) {
  const [over, setOver] = useState(false);
  return (
    <div data-ap-field>
    <label
      data-ap-invalid={error ? true : undefined}
      className={`ap-drop relative ${over ? "ap-drop-over !border-(--ap-violet) !bg-(--ap-tint)" : ""} focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--ap-violet)`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
    >
      <Upload className="size-6.5 text-(--ap-violet)" strokeWidth={STROKE} aria-hidden="true" />
      <b className="text-[15px]">{title}</b>
      <span className="text-[13px] text-(--ap-muted)">
        Drag a file here or <u>browse</u> · PDF, JPG or PNG up to 10 MB
      </span>
      <input
        type="file"
        accept={ACCEPT}
        className="absolute size-px opacity-0"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </label>
    <FieldError>{error}</FieldError>
    </div>
  );
}

function ReplaceLink({ label, onFile }: { label: string; onFile: (file: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={LINK_CLS} onClick={() => ref.current?.click()} aria-label={`Replace ${label}`}>
        Replace
      </button>
      <input
        ref={ref}
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
    </>
  );
}

const statusChip = (p: Phase | undefined) =>
  p?.state === "uploading" ? <span className={CHIP.info}>Uploading</span> : <span className={CHIP.ok}>Uploaded</span>;

export function StepDocuments({
  applicationId,
  form,
  set,
  showErrors = false,
}: {
  applicationId: string;
  form: ApplyFormData;
  set: <K extends keyof ApplyFormData>(k: K, v: ApplyFormData[K]) => void;
  /** After a failed Submit: flag the required documents that are still missing. */
  showErrors?: boolean;
}) {
  const store = useApplicantStore();
  const [phases, setPhases] = useState<Record<string, Phase>>({});
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  /** Wireframe fakeUpload(): shows the progress row, then settles and records the file through the mock service. */
  function fakeUpload(key: string, file: File, commit: () => void) {
    setPhases((p) => ({ ...p, [key]: { fileName: file.name, state: "uploading" } }));
    const t = window.setTimeout(() => {
      commit();
      setPhases((p) => ({ ...p, [key]: { fileName: file.name, state: "done" } }));
    }, FAKE_UPLOAD_MS);
    timers.current.push(t);
  }

  const provided = REUSABLE_DOCS.map((d) => ({ ...d, doc: findReusableDoc(store.documents, d.name) }));
  const missing = provided.filter((d) => !d.doc);
  const existing = provided.filter((d) => d.doc);
  const certDoc = store.documents.find((d) => d.name === ROLE_CERT_NAME && d.usedInApplicationIds.includes(applicationId));

  function uploadCert(file: File) {
    set("roleCertificateFileName", file.name);
    fakeUpload(ROLE_CERT_NAME, file, () => {
      if (certDoc) replaceDocumentFile(certDoc.id, file.name);
      else uploadApplicationDocument({ name: ROLE_CERT_NAME, fileName: file.name, applicationId, docType: "professional-certificate" });
    });
  }

  return (
    <div>
      {existing.length > 0 ? (
        <>
          <SubHead>Already provided</SubHead>
          <div className="flex flex-col gap-2.5">
          {existing.map(({ name, icon, doc }) => {
            const phase = phases[name];
            return (
              <UploadRow
                key={name}
                icon={icon}
                title={name}
                detail={phase ? phase.fileName : [doc!.fileName, doc!.size].filter(Boolean).join(" · ")}
                progress={!!phase}
                status={
                  phase ? (
                    statusChip(phase)
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[14px] font-bold whitespace-nowrap text-(--ap-ok)">
                      <Check className="size-4" strokeWidth={STROKE} aria-hidden="true" />
                      Already provided
                    </span>
                  )
                }
                action={
                  phase?.state === "uploading" ? null : (
                    <ReplaceLink
                      label={name}
                      onFile={(f) =>
                        fakeUpload(name, f, () => {
                          replaceDocumentFile(doc!.id, f.name);
                          toast.add({ title: `${name} replaced. Beeliv will review it within 1 working day.` });
                        })
                      }
                    />
                  )
                }
              />
            );
          })}
          </div>
        </>
      ) : null}

      <SubHead className={existing.length ? "mt-5.5" : ""}>Needed for this role</SubHead>
      <div className="flex flex-col gap-2.5">
      {missing.map(({ name, icon, docType, hint }) => {
        const phase = phases[name];
        const title = hint ? `${name} (${hint})` : name;
        return phase ? (
          <UploadRow key={name} icon={icon} title={title} detail={phase.fileName} progress status={statusChip(phase)} />
        ) : (
          <DropZone
            key={name}
            title={title}
            error={showErrors ? `Upload your ${name.toLowerCase() === "cv" ? "CV" : name.toLowerCase()} to submit.` : undefined}
            onFile={(f) => fakeUpload(name, f, () => uploadApplicationDocument({ name, fileName: f.name, applicationId, docType }))}
          />
        );
      })}
      {form.roleCertificateFileName ? (
        <UploadRow
          icon={Award}
          title={ROLE_CERT_NAME}
          detail={form.roleCertificateFileName}
          progress={!!phases[ROLE_CERT_NAME]}
          status={statusChip(phases[ROLE_CERT_NAME])}
          action={phases[ROLE_CERT_NAME]?.state === "uploading" ? null : <ReplaceLink label={ROLE_CERT_NAME} onFile={uploadCert} />}
        />
      ) : (
        <DropZone title={ROLE_CERT_NAME} onFile={uploadCert} />
      )}
      </div>

      <Note icon={LockKeyhole} className="mt-4">
        Guarantor, references and medical/fitness documents are only requested later, if you reach that stage.
      </Note>
    </div>
  );
}
