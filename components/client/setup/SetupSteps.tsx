"use client";

import { PhotoSourceDialog } from "@/components/shared/PhotoSourceDialog";
import Link from "next/link";
import { useState } from "react";
import { readAndResize } from "@/lib/applicant/avatar";
import { ClientAvatar } from "../ClientAvatar";
import { ArrowRight, Briefcase, Check, Calendar, Clock3, FileText, LockKeyhole, MapPin, ShieldCheck, UsersRound } from "@/components/applicant/icons";
import { SubmittedMark } from "@/components/applicant/apply/SubmittedMark";
import { CheckMark, SwitchRow } from "@/components/applicant/documentation/controls";
import { FieldError, invalidAttrs } from "@/components/applicant/form-feedback";
import { PhoneInput } from "@/components/applicant/form-fields";
import { SelectMenu } from "@/components/applicant/SelectMenu";
import { Field, FormGrid, INPUT_CLS, Note, SubHead } from "@/components/applicant/apply/parts";
import { NEW_REQUEST_HREF } from "@/lib/client/links";
import type { AgreementAck, BeelivTeam, ClientContactDetails, NotificationPrefKey, NotificationPrefs, OnboardingItem, Outlet, PreferredContact } from "@/lib/client/types";
import { BarChart3, Building, UserPlus, Wallet } from "../icons";
import { setupStepHref } from "./steps";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ap-violet)";
const BTN = "ap-btn text-[15px] font-semibold";

function OutletList({ outlets, badge }: { outlets: Outlet[]; badge?: string }) {
  return (
    <ul className="grid grid-cols-1 gap-2.5 min-[641px]:grid-cols-2">
      {outlets.map((o) => (
        <li key={o.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-(--ap-line-2) px-3.5 py-3">
          <MapPin className="size-[18px] shrink-0 text-(--ap-violet)" aria-hidden="true" />
          <span className="min-w-0">
            <b className="block truncate text-[15px]">{o.name}</b>
            <span className="ap-sm block truncate">{o.location}</span>
          </span>
          {badge ? (
            <span className="ap-label ml-auto inline-flex shrink-0 items-center gap-1 font-bold text-(--ap-ok)">
              <Check className="size-3.5" aria-hidden="true" />
              {badge}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------ 1 Welcome */

const WHAT_IT_DOES = [
  { icon: UsersRound, text: "See your Beeliv-managed workforce and how attendance looks today." },
  { icon: Calendar, text: "Follow schedules and shift coverage across your outlets." },
  { icon: Briefcase, text: "Review candidates Beeliv sends you and request more staff." },
  { icon: ShieldCheck, text: "Keep an eye on compliance and payroll schedule information." },
] as const;

export function StepWelcome({ clientName, team, outlets }: { clientName: string; team: BeelivTeam; outlets: Outlet[] }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3.5 rounded-2xl border border-(--ap-line) p-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-(--ap-tint) text-(--ap-violet)">
          <Building className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <b className="block text-[16px] break-words">{clientName}</b>
          <span className="ap-sm block">
            Invited by {team.name}, {team.role} at Beeliv
          </span>
        </div>
      </div>

      <div>
        <SubHead>Outlets you&apos;ve been given access to</SubHead>
        {outlets.length ? <OutletList outlets={outlets} /> : <p className="ap-bd text-(--ap-muted)">Your Beeliv team hasn&apos;t assigned outlets yet.</p>}
        <p className="ap-sm mt-2">This comes from your invitation. Only Beeliv can change it.</p>
      </div>

      <div>
        <SubHead>What Beeliv Client is for</SubHead>
        <ul className="flex flex-col gap-3">
          {WHAT_IT_DOES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-(--ap-tint) text-(--ap-violet)">
                <Icon className="size-[18px]" aria-hidden="true" />
              </span>
              <span className="ap-bd pt-1.5">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ 2 Details */

/** DEV FIXTURE / TBD: contact options are pending Beeliv's approved channels. */
export const CONTACT_OPTIONS: { value: PreferredContact; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone call" },
  { value: "whatsapp", label: "WhatsApp" },
];

const PHONE_OK = /^\+234 (70|71|80|81|90|91)\d \d{3} \d{4}$/;

export function detailsErrors(d: ClientContactDetails): { fullName?: string; jobTitle?: string; phone?: string } {
  return {
    fullName: d.fullName.trim() ? undefined : "Enter your full name.",
    jobTitle: d.jobTitle.trim() ? undefined : "Enter your job title.",
    phone: PHONE_OK.test(d.phone) ? undefined : "Enter your full 11-digit Nigerian mobile number.",
  };
}

/** Optional profile photo: shows initials until one is chosen. */
function PhotoField({ name, url, onChange }: { name: string; url: string | null; onChange: (url: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function pick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setMsg("Choose an image file (JPG or PNG).");
    if (file.size > 8 * 1024 * 1024) return setMsg("That photo is over 8 MB.");
    try {
      onChange(await readAndResize(file));
      setMsg(null);
    } catch {
      setMsg("We could not read that image.");
    }
  }
  return (
    <div className="flex items-center gap-4">
      <ClientAvatar name={name || "You"} photoUrl={url} size={72} />
      <div className="min-w-0">
        <b className="block text-[15px]">
          Profile photo <span className="font-normal text-(--ap-muted)">· Optional</span>
        </b>
        <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
          <button type="button" onClick={() => setOpen(true)} className={`${BTN} ap-btn-s ap-btn-sm ${FOCUS}`}>
            {url ? "Change photo" : "Upload photo"}
          </button>
          {url ? (
            <button type="button" onClick={() => onChange(null)} className={`ap-hit text-[14px] font-bold text-(--ap-violet) ${FOCUS}`}>
              Remove
            </button>
          ) : null}
        </div>
        <p className="ap-sm mt-1.5" role={msg ? "alert" : undefined}>
          {msg ?? "JPG or PNG, up to 8 MB. Your Beeliv team sees it next to your name."}
        </p>
        <PhotoSourceDialog open={open} onOpenChange={setOpen} onFile={(f) => void pick(f)} currentPhoto={url} />
      </div>
    </div>
  );
}

export function StepDetails({ value, onChange, tried }: { value: ClientContactDetails; onChange: (v: ClientContactDetails) => void; tried: boolean }) {
  const err = tried ? detailsErrors(value) : {};
  const set = <K extends keyof ClientContactDetails>(k: K, v: ClientContactDetails[K]) => onChange({ ...value, [k]: v });
  return (
    <FormGrid>
      <div className="col-span-full">
        <PhotoField name={value.fullName} url={value.avatarUrl ?? null} onChange={(u) => set("avatarUrl", u)} />
      </div>
      <Field label="Full name" htmlFor="setup-name" error={err.fullName}>
        <input id="setup-name" className={INPUT_CLS} autoComplete="name" value={value.fullName} onChange={(e) => set("fullName", e.target.value)} aria-invalid={err.fullName ? true : undefined} aria-describedby={err.fullName ? "setup-name-err" : undefined} />
      </Field>
      <Field label="Job title" htmlFor="setup-title" error={err.jobTitle}>
        <input id="setup-title" className={INPUT_CLS} autoComplete="organization-title" placeholder="e.g. General Manager" value={value.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} aria-invalid={err.jobTitle ? true : undefined} aria-describedby={err.jobTitle ? "setup-title-err" : undefined} />
      </Field>
      <Field label="Phone number" htmlFor="setup-phone" error={err.phone}>
        <PhoneInput id="setup-phone" value={value.phone} onChange={(v) => set("phone", v)} invalid={Boolean(err.phone)} />
      </Field>
      <Field label="Preferred contact method" htmlFor="setup-contact" hint="How you'd like your Beeliv team to reach you.">
        <SelectMenu id="setup-contact" value={value.preferredContact} options={CONTACT_OPTIONS} onChange={(v) => set("preferredContact", v as PreferredContact)} />
      </Field>
    </FormGrid>
  );
}

/* ------------------------------------------------------------ 3 Access */

const CAN_SEE = [
  { icon: UsersRound, label: "Workforce", detail: "Beeliv-managed staff at your outlets." },
  { icon: Clock3, label: "Attendance", detail: "Who is present, late or absent." },
  { icon: Calendar, label: "Schedules", detail: "Shifts and coverage." },
  { icon: Briefcase, label: "Candidates", detail: "People Beeliv submits for your review." },
  { icon: ShieldCheck, label: "Compliance", detail: "Authorised document status." },
  { icon: Wallet, label: "Payroll visibility", detail: "Authorised payroll schedule information." },
  { icon: BarChart3, label: "Analytics", detail: "Summaries built from the same records." },
] as const;

/** Outlets + visible vs restricted. Shared by setup step 3 and Settings > Outlets & access. */
export function AccessSummary({ outlets }: { outlets: Outlet[] }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <SubHead>Your outlets</SubHead>
        <OutletList outlets={outlets} badge="Access" />
      </div>

      <div>
        <SubHead>What you can see</SubHead>
        <ul className="grid grid-cols-1 gap-2.5 min-[641px]:grid-cols-2">
          {CAN_SEE.map(({ icon: Icon, label, detail }) => (
            <li key={label} className="flex min-w-0 items-start gap-3 rounded-xl border border-(--ap-line-2) px-3.5 py-3">
              <Icon className="mt-0.5 size-[18px] shrink-0 text-(--ap-violet)" aria-hidden="true" />
              <span className="min-w-0">
                <b className="block text-[15px]">{label}</b>
                <span className="ap-sm block">{detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <SubHead>What stays restricted</SubHead>
        <div className="flex items-start gap-3 rounded-xl border border-(--ap-line-2) bg-(--ap-tint-soft) px-3.5 py-3">
          <LockKeyhole className="mt-0.5 size-[18px] shrink-0 text-(--ap-muted)" aria-hidden="true" />
          <span className="ap-bd">Sensitive HR information, such as personal identity and banking details and internal HR records, is kept by Beeliv and never shown in Beeliv Client.</span>
        </div>
      </div>
    </div>
  );
}

export function StepAccess({ outlets }: { outlets: Outlet[] }) {
  return (
    <div className="flex flex-col gap-5">
      <AccessSummary outlets={outlets} />
      <Note icon={ShieldCheck}>
        Beeliv controls your access. If you need another outlet or more visibility, ask your Beeliv team from{" "}
        <Link href="/client/support" className="font-bold text-(--ap-violet) underline">
          Support
        </Link>
        .
      </Note>
    </div>
  );
}

/* ------------------------------------------------------- 4 Notifications */

/** DEV FIXTURE / TBD: the notification set and delivery channels are not yet approved by Beeliv. */
export const NOTIFICATION_ROWS: { key: NotificationPrefKey; label: string; detail: string }[] = [
  { key: "candidates", label: "Candidates to review", detail: "When Beeliv sends you candidates for feedback." },
  { key: "requests", label: "Workforce request updates", detail: "When a staff request you made changes status." },
  { key: "attendance", label: "Attendance alerts", detail: "Late arrivals and absences at your outlets." },
  { key: "compliance", label: "Compliance alerts", detail: "Documents that are expiring or outstanding." },
  { key: "payroll", label: "Payroll reminders", detail: "Upcoming payroll schedule dates." },
];

export function StepNotifications({ value, onChange }: { value: NotificationPrefs; onChange: (v: NotificationPrefs) => void }) {
  return (
    <div className="flex flex-col gap-2.5">
      {NOTIFICATION_ROWS.map((r) => (
        <SwitchRow key={r.key} label={r.label} detail={r.detail} checked={value[r.key]} onChange={(on) => onChange({ ...value, [r.key]: on })} />
      ))}
      <p className="ap-sm mt-1">You can change these later.</p>
    </div>
  );
}

/* -------------------------------------------------------- 5 Agreements */

export function StepAgreements({ value, onChange, tried }: { value: AgreementAck[]; onChange: (v: AgreementAck[]) => void; tried: boolean }) {
  const all = value.length > 0 && value.every((a) => a.acknowledged);
  return (
    <div className="flex flex-col gap-4">
      {value.length > 1 ? (
        <button
          type="button"
          role="checkbox"
          aria-checked={all}
          onClick={() => onChange(value.map((x) => ({ ...x, acknowledged: !all })))}
          className={`flex w-full items-center gap-3 rounded-2xl border border-(--ap-line) bg-(--ap-tint-soft) px-4 py-3.5 text-left text-[15px] font-semibold text-(--ap-ink-2) ${FOCUS}`}
        >
          <CheckMark checked={all} />
          I have read and acknowledge all of the agreements below.
        </button>
      ) : null}
      {value.map((a) => {
        const bad = tried && !a.acknowledged;
        return (
          <div key={a.id} data-ap-field className="rounded-2xl border border-(--ap-line) p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--ap-tint) text-(--ap-violet)">
                <FileText className="size-5" aria-hidden="true" />
              </span>
              <b className="min-w-0 text-[16px]">{a.title}</b>
            </div>
            {/* TBD: Beeliv supplies the agreement text. Never invent legal terms here. */}
            <p className="ap-bd mt-3 rounded-xl bg-(--ap-tint-soft) px-3.5 py-3 text-(--ap-muted)">Beeliv will provide the full text of this agreement.</p>
            <button
              type="button"
              role="checkbox"
              aria-checked={a.acknowledged}
              {...invalidAttrs(bad)}
              aria-describedby={bad ? `${a.id}-err` : undefined}
              onClick={() => onChange(value.map((x) => (x.id === a.id ? { ...x, acknowledged: !x.acknowledged } : x)))}
              className={`mt-3 flex w-full items-start gap-3 rounded-xl text-left text-[15px] leading-[1.5] text-(--ap-ink-2) ${FOCUS}`}
            >
              <CheckMark checked={a.acknowledged} />
              {/* TBD wording: pending Beeliv-approved acknowledgement text. */}
              <span>I have read and acknowledge the {a.title}.</span>
            </button>
            <FieldError id={`${a.id}-err`}>{bad ? "Tick this to continue." : undefined}</FieldError>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------ 6 All set */

export function StepDone({ items, firstName, onOpen }: { items: OnboardingItem[]; firstName: string; onOpen: (step: number) => void }) {
  const left = items.filter((i) => !i.done);
  if (left.length) {
    return (
      <div className="flex flex-col gap-4">
        <p className="ap-bd">A few steps are still open. Finish them and your account is ready.</p>
        <ul className="flex flex-col gap-2.5">
          {left.map((i) => (
            <li key={i.id} className="flex items-center gap-3 rounded-2xl border border-(--ap-line-2) p-3">
              <b className="ap-title min-w-0 flex-1">{i.label}</b>
              <button type="button" onClick={() => i.step !== null && onOpen(i.step)} className={`ap-btn ap-btn-p ap-btn-sm shrink-0 px-4 text-white! ${FOCUS}`}>
                Open
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center text-center">
      <SubmittedMark label="Setup complete" plane={false} />
      <p className="ap-bd mt-3 max-w-[44ch]">Thanks, {firstName}. Your account is set up and your outlets are ready to explore.</p>
      <div className="mt-6 flex w-full flex-col gap-2.5 min-[641px]:w-auto min-[641px]:flex-row">
        <Link href="/client" className={`${BTN} ap-btn-p h-12 ${FOCUS}`}>
          Go to dashboard <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <Link href={NEW_REQUEST_HREF} className={`${BTN} ap-btn-s h-12 ${FOCUS}`}>
          <UserPlus className="size-4" aria-hidden="true" /> Request staff
        </Link>
      </div>
      <Link href={setupStepHref(0)} className="ap-hit mt-4 inline-flex text-[13px] font-bold text-(--ap-violet)">
        Review setup again
      </Link>
    </div>
  );
}
