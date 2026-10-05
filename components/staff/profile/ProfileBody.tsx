"use client";

import { useMaskedIds } from "@/lib/applicant/masked-ids";
import { Experience, FieldsForm } from "@/components/applicant/ProfileBody";
import type { EmploymentEntry } from "@/lib/applicant/types";
import { saveProfile, useApplicantStore } from "@/lib/applicant/service";
import { PhotoSourceDialog } from "@/components/shared/PhotoSourceDialog";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { ArrowRight, Briefcase, Camera, Files, IdCard, LockKeyhole, RefreshCw, Settings, ShieldCheck, UserRound } from "@/components/applicant/icons";
import { PhoneInput } from "@/components/applicant/form-fields";
import { useFlagInvalid } from "@/components/applicant/form-feedback";
import { DETAIL_TITLE, Chip, EmptyState } from "@/components/applicant/primitives";
import { IconTile, SectionCard } from "@/components/applicant/SectionCard";
import { Reveal } from "@/components/applicant/motion";
import { toast } from "@/components/ui/toast";
import { readAndResize, setAvatarPhoto, useAvatarState } from "@/lib/applicant/avatar";
import { dayMonth } from "@/lib/staff/format";
import { useCurrentAssignment, useStaffProfile } from "@/lib/staff/hooks";
import { updateStaffContact } from "@/lib/staff/service";
import type { AccountStatus, StaffAssignment, StaffProfile } from "@/lib/staff/types";
import { BookOpen } from "../icons";
import { PageError } from "../records/PageError";
import { StaffAvatar } from "../StaffAvatar";
import { withStaffPreloader } from "../StaffPreloader";
import { ProfileSkeleton } from "./ProfileSkeleton";

/**
 * Staff Profile (brief section 13). Fields are visually split three ways:
 *  - EDITABLE          - you can change it here (violet "Editable" tag)
 *  - MANAGED BY BEELIV - read-only, shown with a lock tag
 *  - SENSITIVE         - NIN / banking: values are NEVER shown in the app,
 *                        only a "held securely by Beeliv" status.
 * Which fields fall in which group is a UI default; the backend/RLS decides
 * the real permissions. Education, employment history and next of kin have
 * no data contract yet (TBD), so they show a neutral "nothing on file" state.
 */

const STATUS_LABEL: Record<AccountStatus, [string, "ok" | "info" | "mute"]> = {
  active: ["Active", "ok"],
  onboarding: ["Setting up", "info"],
  "invitation-required": ["Invitation needed", "mute"],
  "invitation-expired": ["Invitation expired", "mute"],
  suspended: ["Suspended", "mute"],
  deactivated: ["No longer active", "mute"],
};

type Kind = "editable" | "managed";

/** The small tag beside a field label. */
function Tag({ kind }: { kind: Kind }) {
  return kind === "editable" ? (
    <span className="ap-label rounded-full bg-(--ap-tint) px-2 py-0.5 font-bold text-(--ap-violet)">Editable</span>
  ) : (
    <span className="ap-label inline-flex items-center gap-1 rounded-full bg-(--ap-line-2) px-2 py-0.5 font-bold text-(--ap-muted)">
      <LockKeyhole className="size-3" aria-hidden="true" /> Managed by Beeliv
    </span>
  );
}

function Field({ label, value, kind, hint }: { label: string; value: ReactNode; kind: Kind; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt className="ap-label flex flex-wrap items-center gap-2 text-(--ap-muted)">
        {label}
        <Tag kind={kind} />
      </dt>
      <dd className={`ap-sm mt-1.5 rounded-xl border px-3 py-2 font-semibold wrap-anywhere text-(--ap-ink) ${kind === "managed" ? "border-(--ap-line-2) bg-(--ap-tint-soft)" : "border-(--ap-line) bg-white"}`}>
        {value || <span className="font-medium text-(--ap-faint)">Not added</span>}
      </dd>
      {hint ? <p className="ap-label mt-1 text-(--ap-muted)">{hint}</p> : null}
    </div>
  );
}

const GRID = "grid grid-cols-2 gap-x-5 gap-y-4 max-[640px]:grid-cols-1";

/**
 * Profile photo upload. Same account as the Applicant side, so the photo is
 * shared across both (lib/applicant/avatar.ts). PROTOTYPE: kept on this
 * device only; who else can see it (HR/Ops, the assigned outlet) is an RBAC
 * decision for the backend - see docs/architecture/rbac.md (TBD).
 */
function PhotoControl({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const [open, setOpen] = useState(false);
  // The photo from the application journey is the one shown (shared store); only "Change photo" is offered here.
  const { photo } = useAvatarState();

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.add({ title: "Choose an image file", type: "error" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.add({ title: "That photo is over 8 MB", type: "error" });
      return;
    }
    try {
      setAvatarPhoto(await readAndResize(file));
      toast.add({ title: "Profile photo updated", type: "success" });
    } catch {
      toast.add({ title: "We couldn't read that image", type: "error" });
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <div className="relative">
        <StaffAvatar name={name} photoUrl={photo ?? avatarUrl} size={96} />
        <button
          type="button"
          title="Change photo"
          onClick={() => setOpen(true)}
          className="absolute right-[-4px] bottom-0 flex size-[38px] cursor-pointer items-center justify-center rounded-full border-[3px] border-white bg-(--ap-violet) text-white shadow-[0_4px_10px_rgba(37,0,68,0.25)] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ap-violet)"
        >
          <Camera className="size-[18px]" aria-hidden="true" />
          <span className="sr-only">Change photo</span>
        </button>
        <PhotoSourceDialog open={open} onOpenChange={setOpen} onFile={(f) => void onPhoto(f)} currentPhoto={photo ?? avatarUrl ?? null} />
      </div>
    </div>
  );
}

export function ProfileBody() {
  const { data: staffProfile, status, retry } = useStaffProfile();
  // One Talent person: contact details given in the application fill in whatever the Staff record does not hold yet.
  const talent = useApplicantStore().profile;
  const masked = useMaskedIds();
  const profile = staffProfile ? { ...staffProfile, preferredName: staffProfile.preferredName !== null ? staffProfile.preferredName : talent.preferredName || null, phone: staffProfile.phone !== null ? staffProfile.phone : talent.phone || null } : staffProfile;
  if (status === "loading") return <ProfileSkeleton />;
  if (status === "error" || !profile) return <PageError title="Profile" what="your profile" retry={retry} />;

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const [statusText, statusTone] = STATUS_LABEL[profile.accountStatus];

  return (
    <div className="flex flex-col gap-5">
      <Reveal as="section" className="mt-3 flex flex-wrap items-center gap-4 rounded-[22px] border border-(--ap-line) bg-[linear-gradient(100deg,#FFFFFF,var(--ap-tint-soft)_55%,var(--ap-tint))] p-5 min-[768px]:gap-6 min-[768px]:p-8">
        <PhotoControl name={fullName} avatarUrl={profile.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="ap-eb">Profile</div>
          <h1 className={`${DETAIL_TITLE} wrap-anywhere`}>{profile.preferredName || fullName}</h1>
          <p className="ap-bd mt-1">{profile.roleLabel}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Chip tone={statusTone}>{statusText}</Chip>
            <Chip tone="violet">{profile.staffId}</Chip>
          </div>
        </div>
      </Reveal>

      {/* Legend: what the three field styles mean. */}
      <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0" aria-label="How fields are marked">
        <li className="ap-sm flex items-center gap-2"><Tag kind="editable" /> You can change this</li>
        <li className="ap-sm flex items-center gap-2"><Tag kind="managed" /> Only Beeliv can change this</li>
        <li className="ap-sm flex items-center gap-2">
          <span className="ap-label inline-flex items-center gap-1 rounded-full bg-(--ap-info-bg) px-2 py-0.5 font-bold text-(--ap-info)"><ShieldCheck className="size-3" aria-hidden="true" /> Held securely</span>
          Only part of the number is shown
        </li>
      </ul>

      <div className="flex flex-col gap-5 min-[1241px]:grid min-[1241px]:grid-cols-[minmax(0,1fr)_380px] min-[1241px]:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <PersonalCard profile={profile} fullName={fullName} />
          <AssignmentCard />
          <EmploymentCard items={talent.employmentHistory} />
          <EmptySection icon={BookOpen} title="Education" text="Nothing is on file here yet." />
          <NextOfKinCard contact={talent.emergencyContact} />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <SensitiveCard title="Identity" icon={IdCard} rows={[["National Identification Number (NIN)", masked.nin || "Not provided yet"]]} />
          <SensitiveCard title="Banking / payroll" icon={ShieldCheck} rows={[["Bank account number", masked.account || "Not provided yet"]]} />
          <SectionCard title="Agreements & consents" aside>
            <p className="ap-sm">Agreements you accept are recorded against your account. Review or respond to them in Documents.</p>
            <Link href="/staff/documents" className="ap-btn ap-btn-s ap-btn-sm mt-3">
              <Files className="size-4" aria-hidden="true" /> Open Documents
            </Link>
          </SectionCard>
          <SectionCard title="Account" aside>
            <dl className="m-0 grid grid-cols-1 gap-4">
              <Field label="Beeliv staff ID" value={profile.staffId} kind="managed" />
              <Field label="Sign-in email" value={profile.email} kind="managed" hint="Shared across your Beeliv account. Change it in Settings." />
            </dl>
            <Link href="/staff/settings" className="ap-btn ap-btn-s ap-btn-sm mt-4">
              <Settings className="size-4" aria-hidden="true" /> Account &amp; security
            </Link>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

/* ---------- Personal & Contact (the editable section) ---------- */

const PHONE_OK = /^\+234 \d{3} \d{3} \d{4}$/;

function PersonalCard({ profile, fullName }: { profile: StaffProfile; fullName: string }) {
  const [editing, setEditing] = useState(false);
  return (
    <SectionCard
      title="Personal & contact"
      action={
        editing ? undefined : (
          <button type="button" onClick={() => setEditing(true)} className="ap-btn ap-btn-s ap-btn-sm">
            Edit
          </button>
        )
      }
    >
      {editing ? (
        <PersonalForm profile={profile} onDone={() => setEditing(false)} />
      ) : (
        <dl className={`m-0 ${GRID}`}>
          <Field label="Full name" value={fullName} kind="managed" />
          <Field label="Preferred name" value={profile.preferredName} kind="editable" />
          <Field label="Phone" value={profile.phone} kind="editable" />
          <Field label="Email" value={profile.email} kind="managed" />
        </dl>
      )}
    </SectionCard>
  );
}

function PersonalForm({ profile, onDone }: { profile: StaffProfile; onDone: () => void }) {
  const [preferred, setPreferred] = useState(profile.preferredName ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const flag = useFlagInvalid(formRef);
  // Empty is allowed; a partly typed number is not.
  const valid = phone === "" || PHONE_OK.test(phone);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!valid) {
      setTried(true);
      flag();
      return;
    }
    setBusy(true);
    try {
      // An empty box is a real choice (no preferred name / no phone), not "fall back to the application". The application profile is the same person, so it is updated too.
      await withStaffPreloader("save", async () => {
        await updateStaffContact({ preferredName: preferred.trim(), phone });
        await saveProfile({ preferredName: preferred.trim(), phone });
      });
      toast.add({ title: "Profile updated", type: "success" });
      onDone();
    } catch {
      toast.add({ title: "We couldn't save your changes", description: "Please try again.", type: "error" });
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={save} noValidate>
      <div className={GRID}>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="sp-preferred" className="text-sm font-semibold text-(--ap-ink-2)">Preferred name</label>
          <input id="sp-preferred" className="ap-input" value={preferred} maxLength={40} onChange={(e) => setPreferred(e.target.value)} placeholder="How you'd like to be greeted" />
        </div>
        <div data-ap-field className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="sp-phone" className="text-sm font-semibold text-(--ap-ink-2)">Phone</label>
          <PhoneInput id="sp-phone" value={phone} onChange={setPhone} invalid={tried && !valid} />
        </div>
      </div>
      <p className="mt-3 text-[13px] text-(--ap-muted)">Your legal name and sign-in email are managed by Beeliv and can&apos;t be changed here.</p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <button type="submit" disabled={busy} className="ap-btn ap-btn-p ap-btn-sm">Save</button>
        <button type="button" onClick={onDone} disabled={busy} className="ap-btn ap-btn-s ap-btn-sm">Cancel</button>
      </div>
    </form>
  );
}

/* ---------- Employment / assignment (read-only, from the current assignment) ---------- */

function AssignmentCard() {
  const { data: a, status, retry } = useCurrentAssignment();
  return (
    <SectionCard title="Employment & assignment" action={a ? <Link href="/staff/assignment" className="ap-hit inline-flex items-center gap-1.5 text-[13px] font-bold whitespace-nowrap text-(--ap-violet)">View details <ArrowRight className="size-3.5" aria-hidden="true" /></Link> : undefined}>
      {status === "loading" ? (
        <div className="ap-shimmer h-[120px] rounded-2xl" aria-busy="true" />
      ) : status === "error" ? (
        <EmptyState icon={RefreshCw} title="We couldn't load your assignment" description="Try again in a moment." action={<button type="button" onClick={retry} className="ap-btn ap-btn-s ap-btn-sm">Try again</button>} />
      ) : !a ? (
        <EmptyState icon={Briefcase} title="No assignment yet" description="When Beeliv confirms where you'll work, it appears here." />
      ) : (
        <AssignmentFields a={a} />
      )}
    </SectionCard>
  );
}

function AssignmentFields({ a }: { a: StaffAssignment }) {
  return (
    <dl className={`m-0 ${GRID}`}>
      <Field label="Client" value={a.client.name} kind="managed" />
      <Field label="Outlet" value={a.outlet.name} kind="managed" />
      <Field label="Role" value={a.role} kind="managed" />
      <Field label="Department" value={a.department} kind="managed" />
      <Field label="Start date" value={`${dayMonth(a.startDate)} ${a.startDate.slice(0, 4)}`} kind="managed" />
    </dl>
  );
}

/* ---------- Employment history and next of kin (same person as the application; edited here) ---------- */

function EmploymentCard({ items }: { items: EmploymentEntry[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <SectionCard title="Employment history">
      <Experience
        items={items}
        adding={adding}
        onStartAdd={() => setAdding(true)}
        onCancelAdd={() => setAdding(false)}
        onSave={async (list) => {
          await saveProfile({ employmentHistory: list });
          setAdding(false);
          toast.add({ title: "Employment history updated", type: "success" });
        }}
      />
    </SectionCard>
  );
}

function NextOfKinCard({ contact }: { contact: { name: string; relationship: string; phone: string } }) {
  const [editing, setEditing] = useState(false);
  const empty = !contact.name;
  return (
    <SectionCard
      title="Next of kin"
      action={
        editing ? undefined : (
          <button type="button" onClick={() => setEditing(true)} className="ap-btn ap-btn-s ap-btn-sm">
            {empty ? "Add" : "Edit"}
          </button>
        )
      }
    >
      {editing ? (
        <FieldsForm
          narrow
          fields={[
            { key: "name", label: "Name", value: contact.name },
            { key: "relationship", label: "Relationship", value: contact.relationship },
            { key: "phone", label: "Phone", value: contact.phone, kind: "phone" },
          ]}
          onCancel={() => setEditing(false)}
          onSave={async (v) => {
            await saveProfile({ emergencyContact: { ...contact, ...v } });
            setEditing(false);
            toast.add({ title: "Next of kin updated", type: "success" });
          }}
        />
      ) : empty ? (
        <EmptyState icon={UserRound} title="No next of kin on file" description="Your next of kin details will appear here once they are added." />
      ) : (
        <dl className={`m-0 ${GRID}`}>
          <Field label="Name" value={contact.name} kind="editable" />
          <Field label="Relationship" value={contact.relationship} kind="editable" />
          <Field label="Phone" value={contact.phone} kind="editable" />
        </dl>
      )}
    </SectionCard>
  );
}

/* ---------- Sections without data yet ---------- */

function EmptySection({ icon, title, text }: { icon: typeof UserRound; title: string; text: string }) {
  return (
    <SectionCard title={title}>
      <div className="flex items-center gap-3">
        <IconTile icon={icon} />
        <p className="ap-sm">{text}</p>
      </div>
    </SectionCard>
  );
}

/* ---------- Sensitive (status only, never values) ---------- */

function SensitiveCard({ title, icon, rows }: { title: string; icon: typeof UserRound; rows: [string, string][] }) {
  return (
    <SectionCard title={title} aside>
      <div className="flex flex-col gap-3">
        {rows.map(([label, status]) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-(--ap-line) bg-(--ap-tint-soft) p-3.5">
            <IconTile icon={icon} tone="v" />
            <div className="min-w-0">
              <span className="ap-label block text-(--ap-muted)">{label}</span>
              <b className="ap-sm block tracking-[.04em] text-(--ap-ink) tabular-nums">{status}</b>
            </div>
          </div>
        ))}
      </div>
      <p className="ap-sm mt-3">Only part of this number is shown, for your security. To update it, contact Beeliv from <Link href="/staff/help" className="font-bold text-(--ap-violet)">Help &amp; support</Link>.</p>
    </SectionCard>
  );
}

