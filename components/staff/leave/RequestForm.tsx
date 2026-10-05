"use client";

import { useRef, useState } from "react";
import { Check, Plus, Upload, X } from "@/components/applicant/icons";
import { Field } from "@/components/applicant/apply/parts";
import { DatePicker } from "@/components/applicant/form-fields";
import { SelectMenu } from "@/components/applicant/SelectMenu";
import { CARD } from "@/components/applicant/SectionCard";
import { FieldError, invalidAttrs, useFlagInvalid } from "@/components/applicant/form-feedback";
import { toast } from "@/components/ui/toast";
import { requestLeave } from "@/lib/staff/service";
import { ACCEPT, fileProblem, FORMATS } from "../documents/file-rules";
import { LEAVE_TYPE_OPTIONS } from "./leave-meta";

/**
 * Request Leave form. It only collects and checks the basics (type, dates in
 * order); entitlement, notice period and approval are backend decisions (brief
 * section 9), so nothing here validates against them.
 */
export function RequestForm({ onDone }: { onDone: () => void }) {
  const [type, setType] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ type?: string; start?: string; end?: string; file?: string }>({});
  const [busy, setBusy] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const flag = useFlagInvalid(formRef);

  function pick(f: File | undefined) {
    if (!f) return;
    const problem = fileProblem(f);
    setErrors((e) => ({ ...e, file: problem ?? undefined }));
    setFile(problem ? null : f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!type) next.type = "Choose a leave type.";
    if (!start) next.start = "Choose the first day.";
    if (!end) next.end = "Choose the last day.";
    else if (start && end < start) next.end = "The last day can't be before the first day.";
    if (errors.file) next.file = errors.file;
    setErrors(next);
    if (Object.keys(next).length) {
      flag();
      return;
    }

    setBusy(true);
    try {
      await requestLeave({ type, startDate: start, endDate: end, reason: reason.trim(), attachment: file });
      toast.add({ title: "Leave request sent", description: "You'll see its status here once Beeliv responds.", type: "success" });
      setType(""); setStart(""); setEnd(""); setReason(""); setFile(null); setErrors({});
      onDone();
    } catch {
      toast.add({ title: "We couldn't send your request", description: "Please try again.", type: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className={`${CARD} flex flex-col gap-4`} aria-labelledby="leave-form-h">
      <h2 id="leave-form-h" className="ap-serif text-[25px]">Request leave</h2>
      <Field label="Leave type" htmlFor="lv-type">
        <SelectMenu id="lv-type" invalid={!!errors.type} describedBy={errors.type ? "lv-type-err" : undefined} value={type} options={LEAVE_TYPE_OPTIONS} onChange={(v) => { setType(v); setErrors((x) => ({ ...x, type: undefined })); }} placeholder="Select a leave type" />
        <FieldError id="lv-type-err">{errors.type}</FieldError>
      </Field>
      <div className="grid grid-cols-1 gap-4 min-[768px]:grid-cols-2">
        <Field label="Start date" htmlFor="lv-start">
          <DatePicker id="lv-start" invalid={!!errors.start} describedBy={errors.start ? "lv-start-err" : undefined} title="Start date" value={start} onChange={(v) => { setStart(v); setErrors((x) => ({ ...x, start: undefined, end: undefined })); }} placeholder="Choose a date" />
          <FieldError id="lv-start-err">{errors.start}</FieldError>
        </Field>
        <Field label="End date" htmlFor="lv-end">
          <DatePicker id="lv-end" invalid={!!errors.end} describedBy={errors.end ? "lv-end-err" : undefined} title="End date" value={end} min={start || undefined} onChange={(v) => { setEnd(v); setErrors((x) => ({ ...x, end: undefined })); }} placeholder="Choose a date" />
          <FieldError id="lv-end-err">{errors.end}</FieldError>
        </Field>
      </div>
      <Field label="Reason (optional)" htmlFor="lv-reason">
        <textarea id="lv-reason" rows={3} maxLength={500} className="ap-input" placeholder="Anything Beeliv should know" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <Field label="Attachment (optional)" hint={FORMATS}>
        {file ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-(--ap-line) bg-white px-3.5 py-2.5">
            <Check className="size-4 shrink-0 text-(--ap-ok)" aria-hidden="true" />
            <span className="ap-sm min-w-0 flex-1 truncate font-semibold text-(--ap-ink)">{file.name}</span>
            <button type="button" onClick={() => setFile(null)} aria-label="Remove attachment" className="ap-hit flex size-8 items-center justify-center rounded-lg text-(--ap-muted) hover:bg-(--ap-tint)">
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => picker.current?.click()} {...invalidAttrs(!!errors.file)} aria-describedby={errors.file ? "lv-file-err" : undefined} className="ap-btn ap-btn-s ap-btn-sm self-start">
            <Upload className="size-4" aria-hidden="true" /> Attach a file
          </button>
        )}
        <input ref={picker} type="file" accept={ACCEPT} className="hidden" tabIndex={-1} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        <FieldError id="lv-file-err">{errors.file}</FieldError>
      </Field>
      <button type="submit" disabled={busy} className="ap-btn ap-btn-p h-12 w-full min-[768px]:w-auto min-[768px]:self-start">
        {busy ? <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
        {busy ? "Sending..." : "Send request"}
      </button>
    </form>
  );
}
