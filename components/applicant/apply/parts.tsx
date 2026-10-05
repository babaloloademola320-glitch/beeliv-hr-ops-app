/**
 * Apply flow: small presentational building blocks shared by every step.
 * Each one mirrors a class from the wireframe's own CSS
 * (beeliv-website/applicant/index.html) — the class name is noted beside
 * each component so a reviewer can diff them 1:1. Values are the FINAL
 * cascaded ones (the wireframe re-declares several rules further down its
 * <style> block; later rules win).
 */
import type { ReactNode } from "react";
import { Check, type LucideIcon } from "@/components/applicant/icons";
import { FieldError, invalidAttrs } from "@/components/applicant/form-feedback";

/** Lucide stroke width used across the wireframe's icon set (`I()` helper). */
export const STROKE = 1.6;

/** `.fld` / `.fld.full` + `.lbl` + `.hint` */
export function Field({
  label,
  htmlFor,
  hint,
  full,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  full?: boolean;
  /** Reason shown under the control while it is invalid (the control sets aria-invalid itself). */
  error?: string;
  children: ReactNode;
}) {
  const labelCls = "text-[14px] font-semibold text-(--ap-ink-2)";
  return (
    <div data-ap-field className={`flex min-w-0 flex-col gap-1.5 ${full ? "col-span-full" : ""}`}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelCls}>
          {label}
        </label>
      ) : (
        <span className={labelCls}>{label}</span>
      )}
      {children}
      {hint ? <span className="ap-sm">{hint}</span> : null}
      <FieldError id={htmlFor ? `${htmlFor}-err` : undefined}>{error}</FieldError>
    </div>
  );
}

/** `.form` — 2 columns, 1 column on phones (≤640px; 641–767 keeps 2, per the wireframe's own override). */
export function FormGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`grid grid-cols-2 gap-x-4.5 gap-y-4 max-[640px]:grid-cols-1 ${className}`}>{children}</div>;
}

/** `.inp` (+ `.inp[readonly]`) */
export const INPUT_CLS =
  "ap-input read-only:bg-[#fbfafc] read-only:text-(--ap-muted) read-only:focus:border-(--ap-line) read-only:focus:shadow-none";

/** `.seg` segmented Yes/No control. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  invalid = false,
}: {
  label: string;
  value: string;
  options: readonly T[];
  onChange: (v: T) => void;
  invalid?: boolean;
}) {
  return (
    <div className="ap-seg" role="group" aria-label={label} {...invalidAttrs(invalid)}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className="focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--ap-violet)"
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/** `.pick` toggle chip — the check icon only shows while pressed. */
export function Pick({ pressed, onClick, children, hidden }: { pressed: boolean; onClick: () => void; children: ReactNode; hidden?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      hidden={hidden}
      className="ap-pick focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--ap-violet)"
    >
      {pressed ? <Check className="size-3.5" strokeWidth={STROKE} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

/** `.sub-h` — gold eyebrow used for "Employment history", "Already provided" … */
export function SubHead({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`ap-eb mt-1 mb-3 ${className}`}>
      {children}
    </div>
  );
}

/** `.note` — tinted info strip with a violet icon. */
export function Note({ icon: Icon, children, className = "" }: { icon: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-start gap-2.5 rounded-xl bg-(--ap-tint) px-3.5 py-3 ap-bd text-(--ap-ink-2) ${className}`}>
      <Icon className="mt-1 size-5 shrink-0 text-(--ap-violet)" strokeWidth={STROKE} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

/** `.lnk` — bare violet text button. */
export const LINK_CLS =
  "ap-hit inline-flex items-center border-0 bg-transparent p-0 text-[14px] font-bold text-(--ap-violet) hover:text-(--ap-plum) min-[768px]:max-[1100px]:min-h-9 max-[767px]:min-h-9";

/** Final cascaded `.chip` colours for the tones this flow uses. */
export const CHIP = {
  mute: "ap-chip !bg-[#f3f1f5] !text-[#57545f] !font-semibold",
  info: "ap-chip !bg-[#f1e7f6] !text-[#5b087b] !font-semibold",
  ok: "ap-chip !bg-[#dcfce7] !text-[#15803d] !font-semibold",
} as const;

/** `.btn` final type (15px / 600) layered on the shared ap-btn primitive. */
export const BTN = "ap-btn text-[15px] font-semibold";
