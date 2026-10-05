"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { LockKeyhole, LogOut } from "@/components/applicant/icons";
import { confirmAction } from "@/components/applicant/ConfirmDialog";
import { PageHeading } from "@/components/applicant/primitives";
import { SectionCard } from "@/components/applicant/SectionCard";
import { toast } from "@/components/ui/toast";
import { useStaffProfile } from "@/lib/staff/hooks";
import { setStaffDark, useStaffDark } from "@/lib/staff/theme";
import type { NotificationEvent } from "@/lib/staff/types";

/**
 * Staff Settings. One Talent app, one login: the sign-in email/password
 * belong to the SAME account as the Applicant side, so there is no separate
 * staff credential here. Auth is not wired yet, so account actions confirm
 * honestly instead of pretending to change anything.
 *
 * Notification preferences are DEVICE-LOCAL for now (localStorage) - there is
 * no preferences contract in the data layer yet (TBD); a backend adapter
 * would persist them per person.
 */

const PREF_KEY = "bv-staff-notification-prefs";

/** One switch per event kind from the notification model (brief section 17). */
const PREFS: { key: NotificationEvent; title: string; detail: string }[] = [
  { key: "shift-updated", title: "Shift changes", detail: "When a shift you're on is added, moved or cancelled" },
  { key: "assignment-changed", title: "Assignment changes", detail: "When your outlet, role or supervisor changes" },
  { key: "leave-updated", title: "Leave updates", detail: "When a leave request is approved, declined or changed" },
  { key: "document-requested", title: "Document requests", detail: "When Beeliv asks for a new or updated document" },
  { key: "sop-assigned", title: "New SOPs", detail: "When an SOP is assigned to you" },
  { key: "training-assigned", title: "New training", detail: "When training is assigned to you" },
  { key: "announcement", title: "Announcements", detail: "News from Beeliv, your outlet or the workforce" },
];

type Prefs = Partial<Record<NotificationEvent, boolean>>;

// Tiny external store so SSR (all on) and the browser agree without an effect.
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const readRaw = () => {
  try {
    return localStorage.getItem(PREF_KEY) ?? "{}";
  } catch {
    return "{}";
  }
};
function usePrefs(): Prefs {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "{}");
  return JSON.parse(raw) as Prefs;
}
function setPref(key: NotificationEvent, on: boolean) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify({ ...(JSON.parse(readRaw()) as Prefs), [key]: on }));
  } catch {
    /* storage unavailable: the switch simply doesn't persist */
  }
  listeners.forEach((l) => l());
}

function preview(action: string) {
  toast.add({ title: `${action} isn't connected yet`, description: "This is a preview. No account changes were made." });
}

function Row({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-(--ap-line-2) py-3.5 first:border-t-0 max-[767px]:items-start">
      <div className="min-w-0">
        <b className="block text-base">{title}</b>
        <span className="ap-sm wrap-anywhere">{detail}</span>
      </div>
      {children}
    </div>
  );
}

export function SettingsBody() {
  const dark = useStaffDark();
  const prefs = usePrefs();
  const router = useRouter();
  const { data: profile } = useStaffProfile();

  async function signOut() {
    const ok = await confirmAction({
      tone: "neutral",
      icon: LogOut,
      title: "Sign out of Beeliv?",
      description: "You'll be signed out of your Beeliv account on this device. Sign back in any time.",
      confirmLabel: "Sign out",
      cancelLabel: "Stay signed in",
    });
    // Auth isn't wired yet, so (like the shell's menu) this returns to the public site.
    if (ok) router.push("/");
  }

  return (
    <div>
      <PageHeading title="Settings" subtitle="Manage how Beeliv notifies you and your account." />

      <div className="flex flex-col gap-5">
        <SectionCard id="s-notif" title="Notifications">
          <p className="ap-sm mb-1">Choose which updates appear in your notifications. Saved on this device.</p>
          {PREFS.map((p) => (
            <Row key={p.key} title={p.title} detail={p.detail}>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[p.key] !== false}
                aria-label={p.title}
                onClick={() => setPref(p.key, prefs[p.key] === false)}
                className="ap-switch shrink-0"
              />
            </Row>
          ))}
        </SectionCard>

        <SectionCard id="s-display" title="Display">
          <Row title="Dark mode" detail="Easier on the eyes at night and in dim rooms. Saved on this device.">
            <button
              type="button"
              role="switch"
              aria-checked={dark}
              aria-label="Dark mode"
              onClick={() => setStaffDark(!dark)}
              className="ap-switch shrink-0"
            />
          </Row>
        </SectionCard>

        <SectionCard id="s-acct" title="Account & security">
          <Row title="Sign-in email" detail={profile ? `${profile.email} · shared with your whole Beeliv account` : "Shared with your whole Beeliv account"}>
            <button type="button" onClick={() => preview("Changing your email")} className="ap-btn ap-btn-s ap-btn-sm">Change</button>
          </Row>
          <Row title="Password" detail="One password for everything you do with Beeliv">
            <button type="button" onClick={() => preview("Password reset")} className="ap-btn ap-btn-s ap-btn-sm">Change</button>
          </Row>
        </SectionCard>

        <SectionCard id="s-out" title="Sign out">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="ap-sm flex min-w-0 flex-1 items-start gap-2">
              <LockKeyhole className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Sign out of Beeliv on this device. Your information stays saved.
            </p>
            <button type="button" onClick={signOut} className="ap-btn ap-btn-s max-[640px]:w-full">
              <LogOut className="size-4" aria-hidden="true" /> Sign out
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

