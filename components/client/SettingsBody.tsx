"use client";

import { useEffect, useState } from "react";
import { CircleHelp, Eye, FileText, LockKeyhole, MapPin, Bell, Settings, UserRound, type LucideIcon } from "@/components/applicant/icons";
import { FilterDropdown } from "@/components/applicant/FilterTabs";
import { PageHeading } from "@/components/applicant/primitives";
import { ErrorPanel } from "@/components/staff/ErrorPanel";
import { scrollToSection } from "@/lib/applicant/settings";
import { useClientSession, useOnboarding } from "@/lib/client/hooks";
import { useSignOut } from "./ClientShell";
import { AccessSection, AppearanceSection, HelpSection, NotificationsSection, PrivacySection, ProfileSection, SecuritySection, WorkspaceSection } from "./settings/sections";

/**
 * Client account settings (project lead, 2026-09-30, locked spec). Same pattern
 * as Applicant / Staff Settings: sticky section nav from 768px, a "Jump to"
 * dropdown on phones, then stacked SectionCards. Settings is reached from the
 * profile menu / phone More sheet, not the main sidebar.
 *
 * Profile and Notifications read/write the SAME onboarding store as
 * /client/setup, so both screens agree. There is no Client sign-in yet, so
 * Security actions are clearly-marked previews (they never fake success).
 */

const SECTIONS: [string, string, LucideIcon][] = [
  ["s-profile", "Account & profile", UserRound],
  ["s-security", "Security", LockKeyhole],
  ["s-notif", "Notifications", Bell],
  ["s-workspace", "Workspace", Settings],
  ["s-appearance", "Appearance", Eye],
  ["s-access", "Access & organisation", MapPin],
  ["s-privacy", "Privacy & agreements", FileText],
  ["s-help", "Help & support", CircleHelp],
];

export function SettingsBody() {
  const ob = useOnboarding();
  const session = useClientSession();
  const signOut = useSignOut();
  const [active, setActive] = useState(SECTIONS[0][0]);
  const ready = Boolean(ob.data && session.data);

  // Highlight the section currently in view.
  useEffect(() => {
    if (!ready) return;
    const els = SECTIONS.map(([id]) => document.getElementById(id)).filter((e): e is HTMLElement => Boolean(e));
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "-90px 0px -55% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [ready]);

  const subtitle = "Manage your account, preferences and Client workspace.";
  if (ob.status === "loading" || session.status === "loading") return <SettingsSkeleton />;
  if (!ob.data || !session.data) {
    return (
      <div>
        <PageHeading title="Settings" subtitle={subtitle} />
        <ErrorPanel
          title="We couldn't load your settings"
          retry={() => {
            ob.retry();
            session.retry();
          }}
        />
      </div>
    );
  }
  const s = session.data;
  const o = ob.data;

  const jump = (id: string) => {
    setActive(id);
    scrollToSection(id);
  };
  const glyph = (Icon: LucideIcon) => <Icon className="size-[18px] shrink-0 text-(--ap-violet)" aria-hidden="true" />;
  const cur = SECTIONS.find(([id]) => id === active) ?? SECTIONS[0];

  return (
    <div>
      <PageHeading title="Settings" subtitle={subtitle} />

      <div className="sticky top-[72px] z-30 mb-4 min-[768px]:hidden">
        <FilterDropdown
          label="Settings sections"
          prefix="Jump to"
          options={SECTIONS.map(([id, label, Icon]) => ({ key: id, label, icon: glyph(Icon) }))}
          current={{ key: cur[0], label: cur[1], icon: glyph(cur[2]) }}
          onChange={jump}
        />
      </div>

      <div className="grid grid-cols-[240px_minmax(0,1fr)] items-start gap-5 max-[1040px]:grid-cols-1">
        <nav aria-label="Settings sections" className="ap-card ap-scrollbar-none sticky top-[88px] rounded-[20px] p-2.5 max-[1040px]:static max-[1040px]:flex max-[1040px]:gap-1 max-[1040px]:overflow-x-auto max-[767px]:hidden">
          {SECTIONS.map(([id, label, Icon]) => {
            const on = active === id;
            return (
              <a
                key={id}
                href={`#${id}`}
                aria-current={on ? "true" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  jump(id);
                }}
                className={`flex min-h-[42px] shrink-0 items-center gap-2.5 rounded-[10px] px-3 py-1 text-sm leading-[1.5] ${on ? "bg-(--ap-tint) font-bold text-(--ap-violet)!" : "font-semibold text-(--ap-ink-2)! hover:bg-(--ap-line-2)"} max-[1040px]:whitespace-nowrap`}
              >
                <Icon className="ap-duo size-5 shrink-0" aria-hidden="true" />
                {label}
              </a>
            );
          })}
        </nav>

        <div className="flex min-w-0 flex-col gap-5">
          <ProfileSection details={o.details} session={s} />
          <SecuritySection onSignOut={() => void signOut()} />
          <NotificationsSection prefs={o.notifications} />
          <WorkspaceSection outlets={s.outlets} sessionDefault={s.defaultScope} />
          <AppearanceSection />
          <AccessSection session={s} />
          <PrivacySection agreements={o.agreements} />
          <HelpSection team={s.team} />
        </div>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading settings">
      <h1 className="sr-only">Settings</h1>
      <div className="grid grid-cols-[240px_minmax(0,1fr)] items-start gap-5 max-[1040px]:grid-cols-1">
        <div className="ap-sk-box h-[300px] rounded-[20px] max-[767px]:hidden" />
        <div className="flex flex-col gap-5">
          <div className="ap-sk-box h-[300px] rounded-[20px]" />
          <div className="ap-sk-box h-[260px] rounded-[20px]" />
        </div>
      </div>
    </div>
  );
}
