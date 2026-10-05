"use client";

/**
 * Client shell. Mirrors components/staff/StaffShell.tsx (same breakpoints,
 * sidebar + sliding nav pill, top bars, bottom nav + swipeable More sheet,
 * confirm host) with the Client navigation, the OUTLET SWITCHER and the Client
 * data boundary (lib/client/hooks). Colours come from the `.client-theme`
 * tokens (app/client/client.css).
 *
 * Account states (invitation / suspended / no outlets ...) replace the page
 * with a gate. That is a UI convenience only - real protection is server-side
 * (Auth -> Client membership -> outlet scope -> RLS) and arrives with the backend.
 */
import { SHOW_PROTOTYPE_CONTROLS } from "@/lib/prototype";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import { Bell, ChevronDown, LogOut, Menu, Moon, Search, Settings, Sun, UserRound, X } from "@/components/applicant/icons";
import { applyDisplaySettings } from "@/lib/applicant/settings";
import { ConfirmHost, confirmAction } from "@/components/applicant/ConfirmDialog";
import { newsreader } from "@/components/applicant/fonts";
import { MotionRoot, SPRING, SwipeSheet, useIsClient } from "@/components/applicant/motion";
import { SelectMenu } from "@/components/applicant/SelectMenu";
import { BottomNavBar, BottomNavButton, BottomNavLink } from "@/components/applicant/BottomNav";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { outletImage } from "@/lib/client/assets";
import { PROTOTYPE_MODES, setPrototypeMode, usePrototypeMode } from "@/lib/client/dev-controls";
import { displayName, timeAgo } from "@/lib/client/format";
import { useClientSession, useNotifications, useOnboarding, useRecruitmentSummary } from "@/lib/client/hooks";
import { NEW_REQUEST_HREF } from "@/lib/client/links";
import { ALL_SCOPE, scopeLabel, syncSession, useOutletState } from "@/lib/client/outlet";
import { setClientDark, useClientDark } from "@/lib/client/theme";
import type { BeelivTeam, ClientNotification, ClientSession } from "@/lib/client/types";
import { ClientAvatar } from "./ClientAvatar";
import { ClientGate } from "./ClientGate";
import { ClientThemeFlag } from "./ClientThemeFlag";
import { OutletSwitcher } from "./OutletSwitcher";
import { UserPlus } from "./icons";
import { CLIENT_NAV, CLIENT_NOTIFICATIONS_HREF, CLIENT_SETTINGS, isNavActive, MORE_ROUTES } from "./nav";

export const CLIENT_THEME = `applicant-shell client-theme ${newsreader.variable}`;
const THEME = CLIENT_THEME;

const PILL_ROW = "flex h-10.5 items-center gap-2.5 rounded-[9px] px-2.5 text-sm font-semibold text-(--ap-ink-2) hover:bg-(--ap-line-2)";

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useClientSession();
  // While first-time setup is unfinished the menu is limited to Overview + Support (the rest is hidden until it is done).
  const { data: onboarding } = useOnboarding();
  const setupLocked = !!onboarding && onboarding.status !== "complete";
  const { data: notes } = useNotifications();
  const { data: rec } = useRecruitmentSummary();
  const outlet = useOutletState();
  const unread = (notes ?? []).filter((n) => !n.read).length;
  const counts: Record<string, number> = { "/client/recruitment": rec?.awaitingFeedback ?? 0 };
  const moreActive = MORE_ROUTES.some((href) => isNavActive(pathname, href));
  const gate = session && session.accountState !== "active" ? session.accountState : null;

  // The session defines which scopes exist; the outlet store follows it.
  useEffect(() => syncSession(session), [session]);
  useEffect(() => applyDisplaySettings(), []);

  return (
    <MotionRoot>
      <ClientThemeFlag />
      <div className="mx-auto grid min-h-[calc(100vh/var(--ps-zoom,1))] w-full grid-cols-1 min-[768px]:grid-cols-[84px_minmax(0,1fr)] min-[1101px]:grid-cols-[232px_minmax(0,1fr)] min-[1361px]:grid-cols-[248px_minmax(0,1fr)]">
        <Sidebar pathname={pathname} counts={counts} session={session} locked={setupLocked} />

        <div className="relative min-w-0">
          <DesktopTopbar unread={unread} notes={notes ?? []} session={session} />
          <MobileTopbar unread={unread} />

          <main id="applicant-view" tabIndex={-1} className="relative mx-auto max-w-[1360px] px-[18px] pt-3 pb-[116px] max-[380px]:px-3.5 min-[641px]:px-7 min-[768px]:pt-5 min-[768px]:pb-[72px] min-[1361px]:px-10 min-[1361px]:pb-20 min-[1600px]:max-w-none">
            {gate ? <ClientGate state={gate} /> : children}
          </main>
        </div>

        {/* DEV-ONLY prototype state, hidden on phones (there it lives in the More sheet). */}
        {SHOW_PROTOTYPE_CONTROLS && (
<div className="fixed right-4 bottom-4 z-[80] hidden items-center rounded-xl bg-(--ap-ink) py-[5px] pr-[5px] pl-3 shadow-[0_10px_30px_rgba(15,11,24,.25)] min-[768px]:flex">
            <ModeSwitcher />
          </div>
        )}

        {!pathname.startsWith("/client/setup") && !setupLocked && <MobileBottomNav pathname={pathname} moreActive={moreActive} unread={unread} counts={counts} session={session} outletName={scopeLabel(outlet.scope, outlet)} />}
        <ConfirmHost />
      </div>
    </MotionRoot>
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

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

const NAV_ITEM = "ap-navitem relative flex min-h-[44px] items-center gap-3 rounded-xl border border-transparent px-3 py-2 [@media(max-height:760px)_and_(min-width:1101px)]:min-h-[40px] min-[768px]:max-[1100px]:min-h-[52px] min-[768px]:max-[1100px]:justify-center min-[768px]:max-[1100px]:p-0";

function Sidebar({ pathname, counts, session, locked }: { pathname: string; counts: Record<string, number>; session: ClientSession | null; locked: boolean }) {
  const outlet = useOutletState();
  const current = outlet.outlets.find((o) => o.id === outlet.scope) ?? outlet.outlets[0];

  return (
    <aside
      style={{ viewTransitionName: "ap-sidebar" }}
      className="ap-sidebar sticky top-0 hidden h-[calc(100vh/var(--ps-zoom,1))] flex-col overflow-x-hidden overflow-y-auto [scrollbar-color:rgba(255,255,255,.2)_transparent] [scrollbar-width:thin] *:shrink-0 px-3.5 pt-5 pb-3 text-white min-[768px]:flex min-[768px]:max-[1100px]:px-3"
      aria-label="Client navigation"
    >
      <Link href="/client" aria-label="Beeliv Client home" className="flex items-center justify-between gap-2 px-3 pb-4 min-[768px]:max-[1100px]:justify-center min-[768px]:max-[1100px]:px-0">
        <Image src="/images/beeliv-logo-white.png" alt="Beeliv Hospitality" width={1295} height={1214} priority className="h-[54px] w-auto [@media(max-height:760px)_and_(min-width:1101px)]:h-[46px] min-[768px]:max-[1100px]:h-auto min-[768px]:max-[1100px]:w-[58px]" />
      </Link>

      <nav className="flex flex-col gap-0.5" aria-label="Client sections">
        {(locked ? CLIENT_NAV.filter((i) => i.href === "/client" || i.href === "/client/support") : CLIENT_NAV).map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          const count = counts[item.href] ?? 0;
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={NAV_ITEM}>
              {active ? <motion.span layoutId="client-nav-pill" transition={SPRING} className="ap-nav-pill absolute -inset-px rounded-xl" aria-hidden="true" /> : null}
              <Icon className="relative size-[21px] shrink-0" aria-hidden="true" />
              <span className="relative flex-1 min-[768px]:max-[1100px]:sr-only">{item.label}</span>
              {count > 0 ? (
                <span className="relative inline-flex h-5 min-w-[22px] items-center justify-center rounded-full bg-[rgba(255,255,255,.9)] px-1.5 text-[13px] font-bold text-(--client-wine) min-[768px]:max-[1100px]:absolute min-[768px]:max-[1100px]:top-1.5 min-[768px]:max-[1100px]:right-2 min-[768px]:max-[1100px]:h-[18px] min-[768px]:max-[1100px]:min-w-[18px] min-[768px]:max-[1100px]:px-1 min-[768px]:max-[1100px]:text-[10px]">
                  <span className="sr-only">{count} awaiting you: </span>
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
        <hr className="mx-2 my-2.5 border-0 border-t border-white/12 min-[768px]:max-[1100px]:mx-1" />
        <SidebarDarkToggle />
      </nav>

      <div className="mt-4 flex flex-col gap-3 min-[768px]:max-[1100px]:hidden">
        {/* Request staff: opens the Workforce Request flow - it never publishes a vacancy. */}
        {!locked && (
          <div className="client-side-card rounded-2xl p-3.5">
            <b className="ap-serif block text-[18px] leading-tight text-white">Need a staff boost?</b>
            <p className="mt-1 text-[13px] leading-[1.45] text-white/70 [@media(max-height:900px)_and_(min-width:1101px)]:hidden">Tell Beeliv what your team needs. We&apos;ll take it from there.</p>
            <Link href={NEW_REQUEST_HREF} className="ap-btn ap-btn-sm mt-2.5 w-full bg-[#8a3d68] text-white! hover:bg-[#9a4a77]">
              <UserPlus className="size-4" aria-hidden="true" /> Request staff
            </Link>
          </div>
        )}

        {/* Your Beeliv Team: a real person, not a promo card. Phone / email are TBD until Beeliv approves them. */}
        {session ? <TeamBlock team={session.team} /> : null}

        {/* Selected outlet photo card (hidden on short screens). */}
        {current ? (
          <div className="relative h-[92px] overflow-hidden rounded-2xl [@media(max-height:900px)_and_(min-width:1101px)]:hidden">
            <Image src={outletImage(outlet.scope === ALL_SCOPE ? outlet.outlets[0] : current)} alt="" fill sizes="240px" className="object-cover" />
            <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,23,26,.1),rgba(28,23,26,.85))]" aria-hidden="true" />
            <span className="absolute inset-x-3 bottom-2.5 leading-tight">
              <b className="block truncate text-[15px] text-white">{outlet.scope === ALL_SCOPE ? outlet.clientName : current.name}</b>
              <span className="block truncate text-[12px] text-white/75">{outlet.scope === ALL_SCOPE ? `${outlet.outlets.length} outlets` : current.location}</span>
            </span>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function TeamBlock({ team }: { team: BeelivTeam }) {
  return (
    <section className="client-side-card rounded-2xl p-3.5" aria-label="Your Beeliv team">
      <b className="block text-[11px] font-bold tracking-[.16em] text-[#c9a97f] uppercase">Your Beeliv Team</b>
      <div className="mt-2.5 flex items-center gap-2.5">
        <ClientAvatar name={team.name} size={34} className="bg-white/12! text-white!" />
        <span className="min-w-0 leading-tight">
          <b className="block truncate text-[14px] text-white">{team.name}</b>
          <span className="block truncate text-[12px] text-white/65">{team.role}</span>
        </span>
      </div>
      <Link href="/client/support" className="ap-btn ap-btn-sm mt-2.5 w-full border-white/20 bg-transparent text-white! hover:bg-white/8">
        Contact Beeliv
      </Link>
    </section>
  );
}

/** Sidebar dark-mode switch (desktop); icon-only button on the collapsed tablet rail. */
function SidebarDarkToggle() {
  const dark = useClientDark();
  return (
    <button type="button" role="switch" aria-checked={dark} aria-label="Dark mode" onClick={() => setClientDark(!dark)} className={`${NAV_ITEM} w-full text-left`}>
      {dark ? <Sun className="relative size-[21px] shrink-0" aria-hidden="true" /> : <Moon className="relative size-[21px] shrink-0" aria-hidden="true" />}
      <span className="relative flex-1 min-[768px]:max-[1100px]:sr-only">Dark mode</span>
      <span aria-hidden="true" data-on={dark ? "" : undefined} className="ap-switch ap-switch-sm pointer-events-none min-[768px]:max-[1100px]:hidden" />
    </button>
  );
}

/** Phone "More" sheet row with a switch. */
function DarkModeRow() {
  const dark = useClientDark();
  return (
    <div className="flex h-13 items-center gap-3 rounded-[9px] px-2 text-[16px] font-semibold text-(--ap-ink-2)">
      <Moon className="size-[19px]" aria-hidden="true" />
      <span className="flex-1">Dark mode</span>
      <button type="button" role="switch" aria-checked={dark} aria-label="Dark mode" onClick={() => setClientDark(!dark)} className="ap-switch shrink-0" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Top bars                                                            */
/* ------------------------------------------------------------------ */

/** "Go to" box: jumps to a Client section. It searches navigation only - there is no data search yet. */
function SearchBox() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const all = [...CLIENT_NAV, CLIENT_SETTINGS];
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
      className="relative flex h-11 max-w-[420px] min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-(--ap-line) bg-white px-3.5 text-(--ap-muted)"
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
        placeholder="Go to Workforce, Attendance, Analytics..."
        autoComplete="off"
        className="w-full min-w-0 border-0 bg-transparent text-sm text-(--ap-ink) outline-none placeholder:text-(--ap-muted)"
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

function NotificationsPopover({ unread, notes }: { unread: number; notes: ClientNotification[] }) {
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
          <Link href={CLIENT_NOTIFICATIONS_HREF} onClick={() => setOpen(false)} className="text-[13px] font-bold text-(--ap-violet)">
            View all
          </Link>
        </div>
        {items.length === 0 ? (
          <p className="py-2 text-sm text-(--ap-muted)">You&apos;re all caught up.</p>
        ) : (
          <div className="flex flex-col">
            {items.map((n, i) => (
              <Link key={n.id} href={n.href} onClick={() => setOpen(false)} className={`flex gap-3 py-3 ${i > 0 ? "border-t border-(--ap-line-2)" : ""}`}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--ap-tint) text-(--ap-violet)">
                  <Bell className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <b className={`block text-base ${n.read ? "font-semibold" : ""}`}>{n.title}</b>
                  <span className="text-sm text-(--ap-muted)">{n.message}</span>
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

/** Sign out, after confirming. Auth isn't wired yet, so this returns to the public site. */
export function useSignOut() {
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

function ProfileMenu({ session }: { session: ClientSession | null }) {
  const [open, setOpen] = useState(false);
  const signOut = useSignOut();
  const full = session ? `${session.user.firstName} ${session.user.lastName}` : "";
  const short = session ? displayName(session.user) : "Client";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-12 items-center gap-2.5 rounded-xl py-0 pr-2.5 pl-1 hover:bg-(--ap-line-2)" aria-label="Account menu">
        <ClientAvatar name={full || "Client"} photoUrl={session?.user.avatarUrl} />
        <span className="hidden flex-col text-left leading-tight min-[1101px]:flex">
          <b className="text-sm">{short}</b>
          <span className="max-w-[150px] truncate text-[13px] text-(--ap-muted)">{session?.clientName ?? "Client"}</span>
        </span>
        <ChevronDown className="size-4 text-(--ap-muted)" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className={`${THEME} w-64 bg-white! p-2`}>
        <div className="p-2.5 leading-tight">
          <b className="block text-(--ap-ink)">{full}</b>
          <span className="text-[13px] text-(--ap-muted)">{session?.clientName}</span>
        </div>
        <hr className="my-1.5 border-(--ap-line-2)" />
        <Link href="/client/settings" onClick={() => setOpen(false)} className={PILL_ROW}>
          <Settings className="size-4" aria-hidden="true" />
          Account &amp; settings
        </Link>
        <Link href="/client/support" onClick={() => setOpen(false)} className={PILL_ROW}>
          <UserRound className="size-4" aria-hidden="true" />
          Your Beeliv team
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

function DesktopTopbar({ unread, notes, session }: { unread: number; notes: ClientNotification[]; session: ClientSession | null }) {
  return (
    <header style={{ viewTransitionName: "ap-topbar" }} className="sticky top-0 z-20 hidden h-[72px] items-center gap-4 border-b border-(--ap-line) bg-white/92 px-7 backdrop-blur-md min-[768px]:flex min-[1361px]:px-10">
      <SearchBox />
      <div className="ml-auto flex items-center gap-2">
        <OutletSwitcher theme={THEME} />
        <NotificationsPopover unread={unread} notes={notes} />
        <ProfileMenu session={session} />
      </div>
    </header>
  );
}

function MobileTopbar({ unread }: { unread: number }) {
  return (
    <header style={{ viewTransitionName: "ap-mtopbar" }} className="sticky top-0 z-20 flex h-[72px] items-center gap-2 border-b border-(--ap-line) bg-white/95 px-4 backdrop-blur-md min-[768px]:hidden">
      <Link href="/client" aria-label="Beeliv Client home" className="shrink-0">
        {/* Full-colour logo; the white logo swaps in for dark mode (client.css). */}
        <Image src="/images/beeliv-logo-full-colour.png" alt="Beeliv Hospitality" width={197} height={207} priority className="client-logo-light h-[54px] w-auto" />
        <Image src="/images/beeliv-logo-white.png" alt="" aria-hidden="true" width={1295} height={1214} className="client-logo-dark hidden h-[54px] w-auto" />
      </Link>
      <div className="ml-auto flex min-w-0 items-center gap-1">
        <OutletSwitcher compact theme={THEME} />
        <Link href={CLIENT_NOTIFICATIONS_HREF} className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-(--ap-ink-2)" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
          <BellDot unread={unread} size="size-6" />
        </Link>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Phone bottom nav + More sheet                                       */
/* ------------------------------------------------------------------ */

function MobileBottomNav({ pathname, moreActive, unread, counts, session, outletName }: { pathname: string; moreActive: boolean; unread: number; counts: Record<string, number>; session: ClientSession | null; outletName: string }) {
  // Sheet open state is tied to the page it was opened on: any navigation closes it.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = useCallback((v: boolean) => setOpenAt(v ? pathname : null), [pathname]);
  const closeMore = useCallback(() => setOpenAt(null), []);
  const signOut = useSignOut();
  const primary = CLIENT_NAV.filter((i) => i.mobilePrimary);
  const moreItems = [...CLIENT_NAV.filter((i) => !i.mobilePrimary), CLIENT_SETTINGS];
  const moreCount = moreItems.reduce((n, i) => n + (counts[i.href] ?? 0), 0);

  return (
    <>
      <BottomNavBar label="Client navigation">
        {primary.map((item, i) => (
          <BottomNavLink key={item.href} href={item.href} icon={item.icon} label={item.short ?? item.label} active={isNavActive(pathname, item.href)} center={i === 2} quiet={i === 2} pillId="client-bnav-pill" />
        ))}
        <BottomNavButton onClick={() => setOpen(true)} icon={Menu} label="More" active={moreActive} dot={moreCount + unread > 0} pillId="client-bnav-pill" />
      </BottomNavBar>

      <MoreSheet open={open} onClose={closeMore}>
        <div className="mb-3.5 rounded-[18px] bg-[image:var(--ap-gradient)] p-4 text-white">
          <b className="ap-serif block text-xl leading-tight">Need a staff boost?</b>
          <p className="mt-1.5 text-[13px] leading-normal text-white/75">Tell Beeliv what your team needs.</p>
          <Link href={NEW_REQUEST_HREF} onClick={() => setOpen(false)} className="ap-btn mt-3 w-full bg-[rgba(255,255,255,.95)] text-(--client-wine)! hover:bg-white">
            <UserPlus className="size-4" aria-hidden="true" /> Request staff
          </Link>
        </div>
        <div className="flex flex-col">
          {session ? (
            <div className="px-2 pb-2 leading-tight">
              <b className="block">{displayName(session.user)}</b>
              <span className="text-[13px] text-(--ap-muted)">{outletName || session.clientName}</span>
            </div>
          ) : null}
          {/* Dark mode, easy to find on phones (also in Settings > Display). */}
          <DarkModeRow />
          {moreItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex h-13 items-center gap-3 rounded-[9px] px-2 text-[16px] font-semibold text-(--ap-ink-2)">
              <item.icon className="size-[19px]" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
            </Link>
          ))}
          <hr className="my-1.5 border-(--ap-line-2)" />
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

/** Phone "More" menu as a swipe-to-close bottom sheet (same behaviour as the Applicant / Staff shells). */
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
          style={{ background: "rgba(20,12,16,.5)" }}
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
