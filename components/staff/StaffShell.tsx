"use client";

/**
 * Staff shell. Mirrors components/applicant/AppShell.tsx (same breakpoints,
 * sidebar + sliding nav pill, top bars, bottom nav + swipeable More sheet,
 * confirm + preloader hosts) with the Staff navigation, promo and data
 * boundary (lib/staff/hooks). Colours come from the `.staff-theme` tokens.
 *
 * Entitlements: /staff shows a friendly "not on your account yet" state when
 * the staff entitlement is false. That is a UI convenience only - real
 * protection is server-side (RLS / route guards) and arrives with the backend.
 */
import { SHOW_PROTOTYPE_CONTROLS } from "@/lib/prototype";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import { Bell, Moon, Sun, BriefcaseBusiness, ChevronDown, LogOut, MapPin, Menu, Search, Settings, UserRound, X } from "@/components/applicant/icons";
import { applyDisplaySettings } from "@/lib/applicant/settings";
import { ConfirmHost, confirmAction } from "@/components/applicant/ConfirmDialog";
import { newsreader } from "@/components/applicant/fonts";
import { MotionRoot, SPRING, SwipeSheet, useIsClient } from "@/components/applicant/motion";
import { SelectMenu } from "@/components/applicant/SelectMenu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PROTOTYPE_MODES, setPrototypeMode, usePrototypeMode } from "@/lib/staff/dev-controls";
import { STAFF_ART } from "@/lib/staff/assets";
import { setStaffDark, useStaffDark } from "@/lib/staff/theme";
import { displayName, timeAgo } from "@/lib/staff/format";
import { markNotificationRead } from "@/lib/staff/service";
import { useTodayAttendance, useCurrentAssignment, useEntitlements, useNavCounts, useNotifications, useStaffProfile } from "@/lib/staff/hooks";
import type { Notification, StaffProfile } from "@/lib/staff/types";
import { BottomNavBar, BottomNavButton, BottomNavLink } from "@/components/applicant/BottomNav";
import { StaffAvatar } from "./StaffAvatar";
import { StatusGate } from "./StatusGate";
import { StaffPreloaderHost } from "./StaffPreloader";
import { StaffThemeFlag } from "./StaffThemeFlag";
import { History } from "./icons";
import { isNavActive, MORE_ROUTES, STAFF_NAV, STAFF_NOTIFICATIONS_HREF, STAFF_SETTINGS } from "./nav";


const THEME = `applicant-shell staff-theme ${newsreader.variable}`;

const NOTE_TILE: Record<Notification["event"], string> = {
  "shift-updated": "bg-(--ap-info-bg) text-(--ap-info)",
  "sop-assigned": "bg-(--ap-tint) text-(--ap-violet)",
  "training-assigned": "bg-(--ap-tint) text-(--ap-violet)",
  "leave-updated": "bg-(--ap-ok-bg) text-(--ap-ok)",
  "document-requested": "bg-(--ap-warn-bg) text-(--ap-warn)",
  "assignment-changed": "bg-(--ap-info-bg) text-(--ap-info)",
  announcement: "bg-(--ap-tint) text-(--ap-violet)",
};

const PILL_ROW = "flex h-10.5 items-center gap-2.5 rounded-[9px] px-2.5 text-sm font-semibold text-(--ap-ink-2) hover:bg-(--ap-line-2)";

export function StaffShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: profile } = useStaffProfile();
  const { data: notes } = useNotifications();
  const { data: counts } = useNavCounts();
  const { data: ent } = useEntitlements();
  const unread = (notes ?? []).filter((n) => !n.read).length;
  const moreActive = MORE_ROUTES.some((href) => isNavActive(pathname, href));
  const title = STAFF_NAV.find((i) => i.href !== "/staff" && isNavActive(pathname, i.href))?.label ?? "";
  const noStaff = ent !== null && !ent.staff;
  useEffect(() => applyDisplaySettings(), []);

  return (
    <MotionRoot>
      <StaffThemeFlag />
      <div className="mx-auto grid min-h-[calc(100vh/var(--ps-zoom,1))] w-full grid-cols-1 min-[768px]:grid-cols-[84px_minmax(0,1fr)] min-[1101px]:grid-cols-[232px_minmax(0,1fr)] min-[1361px]:grid-cols-[248px_minmax(0,1fr)]">
        <Sidebar pathname={pathname} counts={counts ?? {}} profile={profile} />

        <div className="relative min-w-0">
          <DesktopTopbar unread={unread} notes={notes ?? []} profile={profile} />
          <MobileTopbar unread={unread} title={title} profile={profile} />

          <main id="applicant-view" tabIndex={-1} className="relative mx-auto max-w-[1360px] px-[18px] pt-1.5 pb-[116px] max-[380px]:px-3.5 min-[641px]:px-7 min-[768px]:pt-2.5 min-[768px]:pb-[72px] min-[1361px]:px-10 min-[1361px]:pb-20 min-[1600px]:max-w-none">
            {noStaff ? <NoStaffAccess /> : children}
          </main>
        </div>

        {/* DEV-ONLY prototype state, hidden on phones (there it lives in the More sheet). */}
        {SHOW_PROTOTYPE_CONTROLS && (
<div className="fixed right-4 bottom-4 z-[80] hidden items-center rounded-xl bg-(--ap-ink) py-[5px] pr-[5px] pl-3 shadow-[0_10px_30px_rgba(15,11,24,.25)] min-[768px]:flex">
            <ModeSwitcher />
          </div>
        )}

        <MobileBottomNav pathname={pathname} moreActive={moreActive} unread={unread} counts={counts ?? {}} profile={profile} />
        <ConfirmHost />
        <StaffPreloaderHost />
      </div>
    </MotionRoot>
  );
}

function NoStaffAccess() {
  return (
    <StatusGate
      tone="neutral"
      image={STAFF_ART.gateNoAccess}
      icon={BriefcaseBusiness}
      chip="Not active yet"
      title="Staff access isn't on your account yet"
      lead="Your applicant account and history are unchanged."
      next="Staff Hub opens once Beeliv confirms your placement. We'll notify you when it's ready."
      primary={{ label: "Go to applicant area", href: "/applicant" }}
      secondary={{ label: "Contact Beeliv", href: "/staff/help" }}
    />
  );
}

/** DEV ONLY: which fixture scenario to preview. Not a product setting. */
function ModeSwitcher({ compact }: { compact?: boolean }) {
  const mode = usePrototypeMode();
  return (
    <div className={`flex items-center gap-2 text-[13px] font-semibold ${compact ? "text-(--ap-ink-2)" : "text-white/70"}`}>
      {!compact && <span className="text-[12px] font-bold tracking-[0.12em] uppercase opacity-70">Prototype state</span>}
      <SelectMenu
        label="Prototype state"
        value={mode}
        onChange={(v) => setPrototypeMode(v as typeof mode)}
        options={PROTOTYPE_MODES}
        variant={compact ? "compact" : "dark"}
        className={compact ? "h-9! text-[13px]!" : ""}
        placement="top"
        align={compact ? "left" : "right"}
      />
    </div>
  );
}

function Sidebar({ pathname, counts, profile }: { pathname: string; counts: Record<string, number>; profile: StaffProfile | null }) {
  const main = STAFF_NAV.filter((i) => !i.secondary);
  const secondary = STAFF_NAV.filter((i) => i.secondary);
  const renderItem = (item: (typeof STAFF_NAV)[number]) => {
    const active = isNavActive(pathname, item.href);
    const Icon = item.icon;
    const count = counts[item.href] ?? 0;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className="ap-navitem relative flex min-h-[44px] items-center gap-3 rounded-xl border border-transparent px-3 py-2 [@media(max-height:760px)_and_(min-width:1101px)]:min-h-[40px] min-[768px]:max-[1100px]:min-h-[52px] min-[768px]:max-[1100px]:justify-center min-[768px]:max-[1100px]:p-0"
      >
        {active ? <motion.span layoutId="staff-nav-pill" transition={SPRING} className="ap-nav-pill absolute -inset-px rounded-xl" aria-hidden="true" /> : null}
        <Icon className="relative size-[21px] shrink-0" aria-hidden="true" />
        <span className="relative flex-1 min-[768px]:max-[1100px]:sr-only">{item.label}</span>
        {count > 0 ? (
          <span className="relative inline-flex h-5 min-w-[22px] items-center justify-center rounded-full bg-[rgba(255,255,255,.92)] px-1.5 text-[13px] font-bold text-(--ap-violet) min-[768px]:max-[1100px]:absolute min-[768px]:max-[1100px]:top-1.5 min-[768px]:max-[1100px]:right-2 min-[768px]:max-[1100px]:h-[18px] min-[768px]:max-[1100px]:min-w-[18px] min-[768px]:max-[1100px]:px-1 min-[768px]:max-[1100px]:text-[10px]">
            <span className="sr-only">{count} pending: </span>
            {count}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <aside
      style={{ viewTransitionName: "ap-sidebar" }}
      className="ap-sidebar sticky top-0 hidden h-[calc(100vh/var(--ps-zoom,1))] flex-col overflow-x-hidden overflow-y-auto [scrollbar-color:rgba(255,255,255,.2)_transparent] [scrollbar-width:thin] *:shrink-0 px-3.5 pt-5 pb-3 text-white min-[768px]:flex min-[768px]:max-[1100px]:px-3"
      aria-label="Staff navigation"
    >
      <Link href="/staff" aria-label="Beeliv Staff home" className="flex items-center justify-between gap-2 px-3 pb-4 min-[768px]:max-[1100px]:justify-center min-[768px]:max-[1100px]:px-0">
        <Image src="/images/beeliv-logo-white.png" alt="Beeliv Hospitality" width={1295} height={1214} priority className="h-[54px] w-auto [@media(max-height:760px)_and_(min-width:1101px)]:h-[46px] min-[768px]:max-[1100px]:h-auto min-[768px]:max-[1100px]:w-[58px]" />
      </Link>

      <nav className="flex flex-col gap-0.5" aria-label="Staff sections">
        {main.map(renderItem)}
        {secondary.map((item) => (
          <Fragment key={item.href}>
            <hr className="mx-2 my-2.5 border-0 border-t border-white/12 min-[768px]:max-[1100px]:mx-1" />
            {renderItem(item)}
          </Fragment>
        ))}
        <SidebarDarkToggle />
      </nav>

      {/* Promo card with an image room (STAFF_ART.promoCutout: concierge bell). */}
      <div className="ap-promo mt-4 min-[768px]:max-[1100px]:hidden">
        <div className="relative z-10 p-4 pb-0">
          <b className="ap-serif block text-[19px] leading-[1.15] text-white">Grow your hospitality career with Beeliv</b>
          <p className="mt-1.5 text-[13px] leading-[1.45] text-white/72 [@media(max-height:900px)_and_(min-width:1101px)]:hidden">Access training, resources and new opportunities across our partner outlets.</p>
        </div>
        <div className="relative h-[124px] [@media(max-height:900px)_and_(min-width:1101px)]:h-[104px]" aria-hidden="true">
          <span className="absolute bottom-[-56px] left-1/2 z-[1] size-[190px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_42%,rgba(201,164,92,.5),rgba(201,164,92,.16)_45%,rgba(105,84,200,0)_70%)]" />
          <Image src={STAFF_ART.promoCutout} alt="" width={1100} height={733} sizes="200px" className="ap-rise absolute bottom-2 left-1/2 z-[2] h-auto w-[90%] max-w-none -translate-x-1/2 drop-shadow-[0_14px_16px_rgba(0,0,0,.38)] [@media(max-height:900px)_and_(min-width:1101px)]:w-[80%]" />
        </div>
      </div>

      {/* User block */}
      {profile ? (
        <Link href="/staff/profile" className="mt-3 flex items-center gap-2.5 rounded-xl px-2 py-2 text-white hover:bg-white/7 min-[768px]:max-[1100px]:hidden">
          <StaffAvatar name={`${profile.firstName} ${profile.lastName}`} photoUrl={profile.avatarUrl} size={36} />
          <span className="min-w-0 flex-1 leading-tight">
            <b className="block truncate text-[14px]">{profile.firstName} {profile.lastName}</b>
            <span className="block truncate text-[12px] text-white/62">{profile.roleLabel}</span>
          </span>
          <span className="text-white/62" aria-hidden="true">···</span>
        </Link>
      ) : null}
    </aside>
  );
}

/** "Go to" box: jumps to a Staff section. It searches navigation only - there is no data search yet. */
function SearchBox() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const all = [...STAFF_NAV, STAFF_SETTINGS];
  const q = value.trim().toLowerCase();
  const results = q ? all.filter((i) => i.label.toLowerCase().includes(q)) : [];

  function go(href: string) {
    setValue("");
    setFocused(false);
    router.push(href);
  }
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (results[0]) go(results[0].href);
  }
  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className="relative flex h-11 max-w-[460px] flex-1 items-center gap-2.5 rounded-xl border border-(--ap-line) bg-white px-3.5 text-(--ap-muted)"
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      <Search className="size-4.5 shrink-0" aria-hidden="true" />
      <input
        type="search"
        aria-label="Go to a section"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search schedules, SOPs, documents..."
        autoComplete="off"
        className="w-full border-0 bg-transparent text-sm text-(--ap-ink) outline-none placeholder:text-(--ap-muted)"
      />
      {focused && q ? (
        <div className="absolute top-[calc(100%+6px)] left-0 z-30 w-full rounded-xl border border-(--ap-line) bg-white p-1.5 shadow-(--ap-shadow)">
          {results.length === 0 ? (
            <p className="px-2.5 py-2 text-sm text-(--ap-muted)">No matching section.</p>
          ) : (
            results.map((r) => (
              <button key={r.href} type="button" onClick={() => go(r.href)} className="flex h-10.5 w-full items-center gap-2.5 rounded-[9px] px-2.5 text-left text-sm font-semibold text-(--ap-ink-2) hover:bg-(--ap-line-2)">
                <r.icon className="size-4" aria-hidden="true" />
                {r.label}
              </button>
            ))
          )}
        </div>
      ) : null}
    </form>
  );
}

/** `size` lets the phone top bar match the bottom-nav icons (24px). */
function BellDot({ unread, size = "size-[19px]" }: { unread: number; size?: string }) {
  return (
    <>
      <Bell className={`${size} ${unread > 0 ? "ap-ring" : ""}`} aria-hidden="true" />
      {unread > 0 ? (
        <span className="ap-dot-pop absolute top-1.5 right-1 inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#f43f5e] px-1 text-[11px] leading-none font-bold text-white shadow-[0_0_0_2px_#fff]">
          <span className="sr-only">{unread} unread</span>
          <span aria-hidden="true">{unread}</span>
        </span>
      ) : null}
    </>
  );
}

function NotificationsPopover({ unread, notes }: { unread: number; notes: Notification[] }) {
  const [open, setOpen] = useState(false);
  const items = notes.slice(0, 3);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="relative inline-flex size-11 items-center justify-center rounded-xl text-(--ap-ink-2) hover:bg-(--ap-line-2)" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
        <BellDot unread={unread} />
      </PopoverTrigger>
      <PopoverContent align="end" className={`${THEME} w-[360px] bg-white! p-4`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="ap-serif text-[17px]">Notifications</h2>
          <Link href={STAFF_NOTIFICATIONS_HREF} onClick={() => setOpen(false)} className="text-[13px] font-bold text-(--ap-violet)">
            View all
          </Link>
        </div>
        {items.length === 0 ? (
          <p className="py-2 text-sm text-(--ap-muted)">You&apos;re all caught up.</p>
        ) : (
          <div className="flex flex-col">
            {items.map((n, i) => (
              <Link
                key={n.id}
                href={n.destination.href}
                onClick={() => {
                  setOpen(false);
                  if (!n.read) void markNotificationRead(n.id);
                }}
                className={`flex gap-3 py-3 ${i > 0 ? "border-t border-(--ap-line-2)" : ""}`}
              >
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${NOTE_TILE[n.event]}`}>
                  <Bell className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <b className={`block text-base ${n.read ? "font-semibold" : ""}`}>{n.title}</b>
                  <span className="text-sm text-(--ap-muted)">{n.message}</span>
                  <span className="mt-0.5 block text-[13px] font-bold text-(--ap-violet)">{n.destination.label}</span>
                </span>
                <span className="shrink-0 text-[13px] text-(--ap-faint)">{timeAgo(n.createdAt)}</span>
              </Link>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function OutletChip() {
  const { data: a } = useCurrentAssignment();
  if (!a) {
    return <span className="hidden h-11 items-center gap-2 rounded-xl border border-dashed border-(--ap-line) px-3 text-sm text-(--ap-muted) min-[1101px]:inline-flex">No assignment</span>;
  }
  return (
    <Popover>
      <PopoverTrigger className="hidden h-11 items-center gap-2 rounded-xl border border-(--ap-line) bg-white px-3 text-sm font-semibold text-(--ap-ink) hover:bg-(--ap-line-2) min-[1101px]:inline-flex" aria-label={`Outlet: ${a.client.name}`}>
        <MapPin className="size-4 text-(--ap-violet)" aria-hidden="true" />
        {a.client.name}
        <ChevronDown className="size-4 text-(--ap-muted)" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className={`${THEME} w-72 bg-white! p-4`}>
        <b className="block">{a.outlet.name}</b>
        <span className="text-[13px] text-(--ap-muted)">{a.outlet.location} - {a.role}</span>
        <Link href="/staff/assignment" className="mt-3 inline-flex text-[13px] font-bold text-(--ap-violet)">
          View assignment
        </Link>
      </PopoverContent>
    </Popover>
  );
}

/** Sign out, after confirming. Auth isn't wired yet, so this returns to the public site. */
function useSignOut() {
  const router = useRouter();
  return async () => {
    const ok = await confirmAction({
      tone: "neutral",
      icon: LogOut,
      title: "Sign out of Beeliv?",
      description: "You'll be signed out of your Beeliv account on this device. Sign back in any time.",
      confirmLabel: "Sign out",
      cancelLabel: "Stay signed in",
    });
    if (ok) router.push("/");
  };
}

function ProfileMenu({ profile }: { profile: StaffProfile | null }) {
  const [open, setOpen] = useState(false);
  const signOut = useSignOut();
  const full = profile ? `${profile.firstName} ${profile.lastName}` : "";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-12 items-center gap-2.5 rounded-xl py-0 pr-2.5 pl-1 hover:bg-(--ap-line-2)" aria-label="Account menu">
        <StaffAvatar name={full || "Staff"} photoUrl={profile?.avatarUrl} />
        <span className="hidden flex-col text-left leading-tight min-[1101px]:flex">
          <b className="text-sm">{profile ? displayName(profile) + " " + profile.lastName : "Staff"}</b>
          <span className="text-[13px] text-(--ap-muted)">Staff</span>
        </span>
        <ChevronDown className="size-4 text-(--ap-muted)" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className={`${THEME} w-64 bg-white! p-2`}>
        <div className="p-2.5 leading-tight">
          <b className="block">{full}</b>
          <span className="text-[13px] text-(--ap-muted)">{profile?.staffId}</span>
        </div>
        <hr className="my-1.5 border-(--ap-line-2)" />
        <Link href="/staff" onClick={() => setOpen(false)} aria-current="page" className="flex h-10.5 items-center gap-2.5 rounded-[9px] bg-(--ap-tint) px-2.5 text-sm font-bold text-(--ap-violet)">
          <BriefcaseBusiness className="size-4" aria-hidden="true" />
          Staff Hub
        </Link>
        <hr className="my-1.5 border-(--ap-line-2)" />
        <Link href="/staff/application-history" onClick={() => setOpen(false)} className={PILL_ROW}>
          <History className="size-4" aria-hidden="true" />
          Application history
        </Link>
        <Link href="/staff/profile" onClick={() => setOpen(false)} className={PILL_ROW}>
          <UserRound className="size-4" aria-hidden="true" />
          Account
        </Link>
        <Link href="/staff/settings" onClick={() => setOpen(false)} className={PILL_ROW}>
          <Settings className="size-4" aria-hidden="true" />
          Settings
        </Link>
        <hr className="my-1.5 border-(--ap-line-2)" />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            void signOut();
          }}
          className={`${PILL_ROW} w-full text-left`}
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </button>
      </PopoverContent>
    </Popover>
  );
}

/** Sidebar dark-mode switch (desktop); icon-only button on the collapsed tablet rail. */
function SidebarDarkToggle() {
  const dark = useStaffDark();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      onClick={() => setStaffDark(!dark)}
      className="ap-navitem relative flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left [@media(max-height:760px)_and_(min-width:1101px)]:min-h-[40px] min-[768px]:max-[1100px]:min-h-[52px] min-[768px]:max-[1100px]:justify-center min-[768px]:max-[1100px]:p-0"
    >
      {dark ? <Sun className="relative size-[21px] shrink-0" aria-hidden="true" /> : <Moon className="relative size-[21px] shrink-0" aria-hidden="true" />}
      <span className="relative flex-1 min-[768px]:max-[1100px]:sr-only">Dark mode</span>
      <span aria-hidden="true" data-on={dark ? "" : undefined} className="ap-switch ap-switch-sm pointer-events-none min-[768px]:max-[1100px]:hidden" />
    </button>
  );
}

/** Phone "More" sheet row with a switch. */
function DarkModeRow() {
  const dark = useStaffDark();
  return (
    <div className="flex h-13 items-center gap-3 rounded-[9px] px-2 text-[16px] font-semibold text-(--ap-ink-2)">
      <Moon className="size-[19px]" aria-hidden="true" />
      <span className="flex-1">Dark mode</span>
      <button type="button" role="switch" aria-checked={dark} aria-label="Dark mode" onClick={() => setStaffDark(!dark)} className="ap-switch shrink-0" />
    </div>
  );
}

function DesktopTopbar({ unread, notes, profile }: { unread: number; notes: Notification[]; profile: StaffProfile | null }) {
  return (
    <header style={{ viewTransitionName: "ap-topbar" }} className="sticky top-0 z-20 hidden h-[72px] items-center gap-4 border-b border-(--ap-line) bg-white/92 px-7 backdrop-blur-md min-[768px]:flex min-[1361px]:px-10">
      <SearchBox />
      <div className="ml-auto flex items-center gap-2">
        <NotificationsPopover unread={unread} notes={notes} />
        <OutletChip />
        <ProfileMenu profile={profile} />
      </div>
    </header>
  );
}

function MobileTopbar({ unread, title, profile }: { unread: number; title: string; profile: StaffProfile | null }) {
  return (
    <header style={{ viewTransitionName: "ap-mtopbar" }} className="sticky top-0 z-20 flex h-[72px] items-center gap-2 border-b border-(--ap-line) bg-white/95 px-4 backdrop-blur-md min-[768px]:hidden">
      <Link href="/staff" aria-label="Beeliv Staff home">
        {/* Full-colour logo; the white logo swaps in for dark mode (staff.css). */}
        <Image src="/images/beeliv-logo-full-colour.png" alt="Beeliv Hospitality" width={197} height={207} priority className="staff-logo-light h-[54px] w-auto" />
        <Image src="/images/beeliv-logo-white.png" alt="" aria-hidden="true" width={1295} height={1214} className="staff-logo-dark hidden h-[54px] w-auto" />
      </Link>
      {title ? <span className="ml-1.5 text-[17px] font-bold text-(--ap-ink)">{title}</span> : null}
      <div className="ml-auto flex items-center gap-1">
        <Link href={STAFF_NOTIFICATIONS_HREF} className="relative inline-flex size-11 items-center justify-center rounded-xl text-(--ap-ink-2)" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
          <BellDot unread={unread} size="size-6" />
        </Link>
        <Link href="/staff/profile" aria-label="Profile" className="inline-flex size-11 items-center justify-center rounded-xl">
          <StaffAvatar name={profile ? `${profile.firstName} ${profile.lastName}` : "Staff"} photoUrl={profile?.avatarUrl} size={28} />
        </Link>
      </div>
    </header>
  );
}

function MobileBottomNav({ pathname, moreActive, unread, counts, profile }: { pathname: string; moreActive: boolean; unread: number; counts: Record<string, number>; profile: StaffProfile | null }) {
  // Sheet open state is tied to the page it was opened on: any navigation closes it.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = useCallback((v: boolean) => setOpenAt(v ? pathname : null), [pathname]);
  const closeMore = useCallback(() => setOpenAt(null), []);
  const signOut = useSignOut();
  const primary = STAFF_NAV.filter((i) => i.mobilePrimary);
  const moreItems = [...STAFF_NAV.filter((i) => !i.mobilePrimary && !i.secondary), STAFF_SETTINGS, ...STAFF_NAV.filter((i) => i.secondary)];
  const moreCount = moreItems.reduce((n, i) => n + (counts[i.href] ?? 0), 0);
  // Attendance (centre) glows only when there's something to do right now.
  const today = useTodayAttendance().data;
  const attendanceActionable = today?.state === "ready" || today?.state === "checked-in" || today?.state === "attention";

  return (
    <>
      <BottomNavBar label="Staff navigation">
        {primary.map((item, i) => (
          <BottomNavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.short ?? item.label}
            active={isNavActive(pathname, item.href)}
            center={i === 2}
            quiet={i === 2 && !attendanceActionable}
            pillId="staff-bnav-pill"
          />
        ))}
        <BottomNavButton onClick={() => setOpen(true)} icon={Menu} label="More" active={moreActive} dot={moreCount + unread > 0} pillId="staff-bnav-pill" />
      </BottomNavBar>

      <MoreSheet open={open} onClose={closeMore}>
        <div className="relative mb-3.5 grid grid-cols-[minmax(0,1fr)_120px] items-end gap-1.5 overflow-hidden rounded-[18px] bg-[image:var(--ap-gradient)] pt-4 pl-4 text-white">
          <div className="pb-4">
            <b className="ap-serif block text-xl leading-tight">Grow your hospitality career with Beeliv</b>
            <p className="mt-1.5 text-[13px] leading-normal text-white/72">Training, resources and new opportunities.</p>
          </div>
          <div className="relative h-[140px]" aria-hidden="true">
            <span className="absolute bottom-[-50px] left-1/2 size-[160px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_42%,rgba(201,164,92,.5),rgba(201,164,92,.15)_45%,transparent_70%)]" />
            <Image src={STAFF_ART.promoCutout} alt="" width={1100} height={733} sizes="130px" className="absolute bottom-3 left-1/2 h-auto w-[124px] max-w-none -translate-x-1/2 drop-shadow-[0_12px_14px_rgba(0,0,0,.35)]" />
          </div>
        </div>
        <div className="flex flex-col">
          {profile ? (
            <div className="px-2 pb-2 leading-tight">
              <b className="block">{profile.firstName} {profile.lastName}</b>
              <span className="text-[13px] text-(--ap-muted)">{profile.staffId}</span>
            </div>
          ) : null}
          {/* Dark mode, easy to find on phones (also in Settings > Display). */}
          <DarkModeRow />
          {moreItems.map((item) => {
            const n = counts[item.href] ?? 0;
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex h-13 items-center gap-3 rounded-[9px] px-2 text-[16px] font-semibold text-(--ap-ink-2)">
                <item.icon className="size-[19px]" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {n > 0 ? <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--ap-tint) px-1.5 text-[13px] font-bold text-(--ap-violet)">{n}</span> : null}
              </Link>
            );
          })}
          <hr className="my-1.5 border-(--ap-line-2)" />
          <Link href="/staff/application-history" onClick={() => setOpen(false)} className="flex h-13 items-center gap-3 rounded-[9px] px-2 text-[16px] font-semibold text-(--ap-ink-2)">
            <History className="size-[19px]" aria-hidden="true" />
            Application history
          </Link>
          <button type="button" onClick={() => { setOpen(false); void signOut(); }} className="flex h-13 w-full items-center gap-3 rounded-[9px] px-2 text-left text-[16px] font-semibold text-(--ap-ink-2)">
            <LogOut className="size-[19px]" aria-hidden="true" />
            Sign out
          </button>
          {SHOW_PROTOTYPE_CONTROLS && (
<div className="mt-1 border-t border-(--ap-line-2) pt-3">
              <ModeSwitcher compact />
            </div>
          )}
        </div>
      </MoreSheet>
    </>
  );
}

/** Phone "More" menu as a swipe-to-close bottom sheet (same behaviour as the Applicant shell). */
function MoreSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const isClient = useIsClient();
  const titleId = useId();
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const r = requestAnimationFrame(() => body.current?.querySelector<HTMLElement>("a,button")?.focus());
    return () => {
      cancelAnimationFrame(r);
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!isClient) return null;
  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="more-sheet"
          className={`${THEME} fixed inset-0 z-[110] flex items-end min-[768px]:hidden`}
          style={{ background: "rgba(15,11,24,.45)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <SwipeSheet
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClose={onClose}
            className="max-h-[92dvh] overflow-y-auto overscroll-contain px-4 pb-[calc(20px+env(safe-area-inset-bottom,0px))]"
            header={
              <div className="mt-2.5 mb-3 flex items-center justify-between gap-3">
                <b id={titleId} className="ap-serif text-[22px]">
                  More
                </b>
                <button type="button" onClick={onClose} aria-label="Close" className="flex size-10 items-center justify-center rounded-full bg-(--ap-line-2) text-(--ap-ink-2)">
                  <X className="size-[18px]" aria-hidden="true" />
                </button>
              </div>
            }
          >
            <div ref={body}>{children}</div>
          </SwipeSheet>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

