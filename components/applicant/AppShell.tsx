"use client";

import { SHOW_PROTOTYPE_CONTROLS } from "@/lib/prototype";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { applyDisplaySettings } from "@/lib/applicant/settings";
import {
  Bell,
  ChevronDown,
  LogOut,
  Search,
  Menu,
  UserRound,
  ArrowUpLeft,
  Settings,
  House,
  CircleHelp,
  BriefcaseBusiness,
  X,
} from "@/components/applicant/icons";
import { ConfirmHost, confirmAction } from "./ConfirmDialog";
import { PreloaderHost, withPreloader, type PreloadKind } from "./Preloader";
import { getApplicantJobs } from "@/lib/applicant/jobs";
import { notificationIcon } from "./notification-meta";
import { resetStaffHubSetup } from "@/lib/applicant/staff-access";
import { MotionRoot, SPRING, SwipeSheet, useIsClient } from "./motion";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import { newsreader } from "./fonts";
import { SelectMenu } from "./SelectMenu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { personaNames, promoImage, useAvatarState } from "@/lib/applicant/avatar";
import { getProfile, setMode, unreadNotificationsCount, useApplicantStore } from "@/lib/applicant/service";
import type { PrototypeMode } from "@/lib/applicant/types";
import { isNavActive, MORE_ROUTES, NAV_ITEMS } from "./nav";
import { Avatar } from "./primitives";
import { BottomNavBar, BottomNavButton, BottomNavLink } from "./BottomNav";
import { AccountSheet } from "./AccountMenu";
import { RelativeTime } from "./RelativeTime";
import { AttentionBadge } from "./AttentionBadge";

const ICON_TONE: Record<string, string> = {
  ok: "bg-(--ap-tint) text-(--ap-violet)",
  warn: "bg-(--ap-tint) text-(--ap-violet)",
  info: "bg-(--ap-tint) text-(--ap-violet)",
  violet: "bg-(--ap-tint) text-(--ap-violet)",
};

/** Step-by-step forms keep the phone screen free for the form and its own Back/Continue buttons: no bottom tab bar on mobile. */
const FOCUSED_FLOW = /^\/applicant\/(apply|profile\/edit|jobs\/[^/]+|applications\/[^/]+(\/(documentation|offer))?)(\/|$)/;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const store = useApplicantStore();
  const unread = unreadNotificationsCount(store.notifications);
  const moreActive = MORE_ROUTES.some((href) => isNavActive(pathname, href));
  // Re-apply saved Larger text / Reduce motion on every page load, not just on Settings.
  useEffect(() => applyDisplaySettings(), []);
  // Entry preloader: the auth forms tag the redirect with from=signup|login
  // (+ job=<id> when the person came from a job). Read it once, strip it from
  // the URL, and show the matching words while the account loads.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const from = sp.get("from");
    if (from !== "signup" && from !== "login") return;
    const jobId = sp.get("job");
    sp.delete("from");
    const qs = sp.toString();
    window.history.replaceState(window.history.state, "", window.location.pathname + (qs ? `?${qs}` : ""));
    void (async () => {
      const [profile, jobs] = await Promise.all([getProfile(), jobId ? getApplicantJobs() : Promise.resolve([])]);
      const job = jobId ? jobs.find((j) => j.id === jobId) : undefined;
      const kind: PreloadKind = from === "signup" ? (job ? "signup-job" : "signup") : job ? "login-job" : "login";
      await withPreloader(kind, { name: profile.preferredName || undefined, role: job?.role, company: job?.company, startAt: 2 }, () => undefined);
    })();
  }, []);

  return (
    <MotionRoot>
    <div className="mx-auto grid min-h-[calc(100vh/var(--ps-zoom,1))] w-full grid-cols-1 min-[768px]:grid-cols-[84px_minmax(0,1fr)] min-[1101px]:grid-cols-[232px_minmax(0,1fr)] min-[1361px]:grid-cols-[248px_minmax(0,1fr)]">
      <Sidebar pathname={pathname} unread={unread} />

      <div className="relative min-w-0">
        <DesktopTopbar unread={unread} />
        <MobileTopbar unread={unread} title={NAV_ITEMS.find((i) => i.href !== "/applicant" && isNavActive(pathname, i.href))?.label ?? ""} />

        <main id="applicant-view" tabIndex={-1} className="relative mx-auto max-w-[1360px] px-[18px] pt-1.5 pb-[116px] max-[380px]:px-3.5 min-[641px]:px-7 min-[768px]:pt-2.5 min-[768px]:pb-[72px] min-[1361px]:px-10 min-[1361px]:pb-20 min-[1600px]:max-w-none">
          {children}
        </main>
      </div>

      {/* Wireframe .proto: floating prototype-state control. In the full sidebar it lives in the footer;
          the icon rail hides that footer, so it floats here instead (hidden <=767px, where it's in the More sheet). */}
      {SHOW_PROTOTYPE_CONTROLS && (
<div className="fixed right-4 bottom-4 z-[80] hidden items-center rounded-xl bg-(--ap-ink) py-[5px] pr-[5px] pl-3 shadow-[0_10px_30px_rgba(17,17,27,.25)] min-[768px]:flex">
          <ModeSwitcher mode={store.mode} />
        </div>
      )}

      {!FOCUSED_FLOW.test(pathname) && <MobileBottomNav pathname={pathname} moreActive={moreActive} unread={unread} />}
      <ConfirmHost />
      <PreloaderHost />
    </div>
    </MotionRoot>
  );
}

/**
 * The wireframe's own prototype-state control (`.proto` select /
 * `data-mode`): "Active applicant" shows the example content in mock-db.ts's
 * ACTIVE_SEED; "New applicant" shows the genuine empty state (NEW_SEED).
 * Kept visibly labelled as a prototype control, not a real product setting.
 */
export function ModeSwitcher({ mode, compact }: { mode: PrototypeMode; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-[13px] font-semibold ${compact ? "text-(--ap-ink-2)" : "text-white/70"}`}>
      {!compact && <span className="text-[12px] font-bold tracking-[0.12em] uppercase opacity-70">Prototype state</span>}
      <SelectMenu
        label="Prototype state"
        value={mode}
        onChange={async (v) => {
          if (v === mode) return;
          const ok = await confirmAction({
            tone: "caution",
            title: v === "new" ? "Switch to a new applicant?" : v === "placed" ? "Switch to a selected applicant?" : "Switch to the active applicant?",
            description: "This prototype control previews the dashboard in a different state.",
            points: [
              "Demo applications, documents and profile edits on this device are reset.",
              "Nothing is sent to Beeliv. This only changes what you see here.",
            ],
            confirmLabel: "Switch and reset",
          });
          if (ok) {
            resetStaffHubSetup();
            setMode(v as PrototypeMode);
          }
        }}
        options={[
          { value: "active", label: "Active applicant" },
          { value: "new", label: "New applicant" },
          { value: "placed", label: "Selected applicant (offer)" },
        ]}
        variant={compact ? "compact" : "dark"}
        className={compact ? "h-9! text-[13px]!" : ""}
        placement="top"
        align={compact ? "left" : "right"}
      />
    </div>
  );
}

function Sidebar({ pathname, unread }: { pathname: string; unread: number }) {
  const { gender } = useAvatarState();
  return (
    <aside
      style={{ viewTransitionName: "ap-sidebar" }}
      className="ap-sidebar sticky top-0 hidden h-[calc(100vh/var(--ps-zoom,1))] flex-col overflow-x-hidden overflow-y-auto [scrollbar-color:rgba(255,255,255,.2)_transparent] [scrollbar-width:thin] *:shrink-0 px-3.5 pt-6 pb-4 text-white min-[768px]:flex min-[768px]:max-[1100px]:px-3 min-[768px]:max-[1100px]:pt-5"
      aria-label="Applicant navigation"
    >
      <div className="flex items-center justify-between gap-2 px-3 pb-4 min-[768px]:max-[1100px]:justify-center min-[768px]:max-[1100px]:px-0">
        <Image src="/images/beeliv-logo-white.png" alt="Beeliv Hospitality" width={1295} height={1214} priority className="h-[54px] w-auto [@media(max-height:760px)_and_(min-width:1101px)]:h-[46px] min-[768px]:max-[1100px]:h-auto min-[768px]:max-[1100px]:w-[58px]" />
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Fragment key={item.href}>
            {item.href === "/applicant/notifications" ? <hr className="mx-2 my-2.5 border-0 border-t border-white/12 min-[768px]:max-[1100px]:mx-1" /> : null}
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="ap-navitem relative flex min-h-[44px] items-center gap-3 rounded-xl border border-transparent px-3 py-2 [@media(max-height:760px)_and_(min-width:1101px)]:min-h-[40px] min-[768px]:max-[1100px]:min-h-[52px] min-[768px]:max-[1100px]:justify-center min-[768px]:max-[1100px]:p-0"
            >
              {active ? (
                <motion.span layoutId="ap-nav-pill" transition={SPRING} className="ap-nav-pill absolute -inset-px rounded-xl" aria-hidden="true" />
              ) : null}
              <Icon className="relative size-[21px] shrink-0" aria-hidden="true" />
              <span className="relative flex-1 min-[768px]:max-[1100px]:sr-only">{item.label}</span>
              {item.href === "/applicant/notifications" && unread > 0 ? (
                <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded-full bg-white px-1.5 text-[13px] font-bold text-(--ap-violet) min-[768px]:max-[1100px]:absolute min-[768px]:max-[1100px]:top-1.5 min-[768px]:max-[1100px]:right-2 min-[768px]:max-[1100px]:h-[18px] min-[768px]:max-[1100px]:min-w-[18px] min-[768px]:max-[1100px]:px-1 min-[768px]:max-[1100px]:text-[10px]">
                  {unread}
                </span>
              ) : null}
            </Link>
            </Fragment>
          );
        })}
      </nav>

      {/* Promo card, compact like the Staff sidebar: title, short copy, button, cutout. */}
      <div className="ap-promo mt-4 min-[768px]:max-[1100px]:hidden">
        <div className="relative z-10 p-4 pb-0">
          <b className="ap-serif block text-[19px] leading-[1.15] text-white">Build your hospitality career with Beeliv</b>
          <p className="mt-1.5 text-[13px] leading-[1.45] text-white/72 [@media(max-height:900px)_and_(min-width:1101px)]:hidden">
            Explore opportunities, learn and grow with leading hospitality brands.
          </p>
        </div>
        {/* Cutout fills only its own room, so it never overlaps the title above. */}
        <div className="ap-promo-cut relative mt-2 h-[132px] [@media(max-height:900px)_and_(min-width:1101px)]:h-[112px]" aria-hidden="true">
          <span className="absolute bottom-[-56px] left-1/2 z-[1] size-[190px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_42%,rgba(201,164,92,.5),rgba(201,164,92,.16)_45%,rgba(138,10,163,0)_70%)]" />
          <Image src={promoImage(gender)} alt="" width={260} height={300} className="ap-rise absolute bottom-0 left-1/2 z-[2] h-full w-auto max-w-none -translate-x-[46%] drop-shadow-[0_14px_16px_rgba(0,0,0,.38)]" />
        </div>
      </div>

      {/* User block (as in the Staff sidebar) */}
      <Link href="/applicant/profile" className="mt-3 flex items-center gap-2.5 rounded-xl px-2 py-2 text-white hover:bg-white/7 min-[768px]:max-[1100px]:hidden">
        <Avatar size={36} />
        <span className="min-w-0 flex-1 leading-tight">
          <b className="block truncate text-[14px]">{personaNames(gender).full}</b>
          <span className="block truncate text-[12px] text-white/62">Applicant</span>
        </span>
        <span className="text-white/62" aria-hidden="true">···</span>
      </Link>

      <div className="mt-1 flex flex-col gap-3 min-[768px]:max-[1100px]:hidden">
        <Link
          href="/"
          className="flex h-10 items-center gap-2.5 rounded-[10px] px-3 text-[13px] font-semibold text-white/62 hover:bg-white/7 hover:text-white"
        >
          <ArrowUpLeft className="size-4" aria-hidden="true" />
          Back to Beeliv website
        </Link>
      </div>
    </aside>
  );
}

function SearchBox() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/applicant/jobs?q=${encodeURIComponent(q)}` : "/applicant/jobs");
  }

  return (
    <form onSubmit={onSubmit} className="flex h-11 max-w-[460px] flex-1 items-center gap-2.5 rounded-xl border border-(--ap-line) bg-white px-3.5 text-(--ap-muted)">
      <Search className="size-4.5 shrink-0" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search for jobs, locations or keywords..."
        autoComplete="off"
        className="w-full border-0 bg-transparent text-sm text-(--ap-ink) outline-none placeholder:text-(--ap-muted)"
      />
    </form>
  );
}

function NotificationsPopover({ unread }: { unread: number }) {
  const store = useApplicantStore();
  const items = store.notifications.slice(0, 3);
  return (
    <Popover>
      <PopoverTrigger className="relative inline-flex size-11 items-center justify-center rounded-xl text-(--ap-ink-2) hover:bg-(--ap-line-2)" aria-label="Notifications">
        <Bell className={`size-[19px] ${unread > 0 ? "ap-ring" : ""}`} aria-hidden="true" />
        {unread > 0 ? (
          <span className="ap-dot-pop absolute top-1.5 right-1 inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#f43f5e] px-1 text-[11px] leading-none font-bold text-white shadow-[0_0_0_2px_#f5eef9]">
            <span className="sr-only">{unread} unread</span>
            <span aria-hidden="true">{unread > 99 ? "99+" : unread}</span>
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className={`applicant-shell ${newsreader.variable} w-85 bg-white! p-4`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="ap-serif text-[17px]">Notifications</h2>
          <Link href="/applicant/notifications" className="text-[13px] font-bold text-(--ap-violet)">
            View all
          </Link>
        </div>
        {items.length === 0 ? (
          <p className="py-2 text-sm text-(--ap-muted)">You&apos;re all caught up.</p>
        ) : (
          <div className="flex flex-col">
            {items.map((n, i) => {
              const Icon = notificationIcon(n);
              return (
                <div key={n.id} className={`flex gap-3 py-3 ${i > 0 ? "border-t border-(--ap-line-2)" : ""}`}>
                  {n.tone === "warn" ? (
                    <AttentionBadge className="mt-1 size-8" />
                  ) : (
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${ICON_TONE[n.tone]}`}>
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <b className="block text-base">{n.title}</b>
                    <span className="text-sm text-(--ap-muted)">{n.detail}</span>
                  </div>
                  <RelativeTime iso={n.createdAt} className="shrink-0 text-[13px] text-(--ap-faint)" />
                </div>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Log out, after confirming. Auth isn't wired yet, so "logging out" returns to the public site. */
export function useLogout() {
  const router = useRouter();
  return async () => {
    const ok = await confirmAction({
      tone: "neutral",
      icon: LogOut,
      title: "Log out of Beeliv?",
      description: "Your profile and draft applications stay saved. Sign back in any time to pick up where you left off.",
      confirmLabel: "Log out",
      cancelLabel: "Stay signed in",
    });
    if (ok) router.push("/");
  };
}

function ProfileMenu() {
  const { gender } = useAvatarState();
  const who = personaNames(gender);
  const staff = useApplicantStore().profile.staffEntitlement.granted;
  const [open, setOpen] = useState(false);
  const logout = useLogout();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-12 items-center gap-2.5 rounded-xl py-0 pr-2.5 pl-1 hover:bg-(--ap-line-2)">
        <Avatar />
        <span className="hidden flex-col text-left leading-tight min-[1101px]:flex">
          <b className="text-sm">{who.full}</b>
          <span className="text-[13px] text-(--ap-muted)">Applicant</span>
        </span>
        <ChevronDown className="size-4 text-(--ap-muted)" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className={`applicant-shell ${newsreader.variable} w-60 bg-white! p-2`}>
        <div className="p-2.5 leading-tight">
          <b className="block">{who.full}</b>
          <span className="text-[13px] text-(--ap-muted)">{who.email}</span>
        </div>
        <hr className="my-1.5 border-(--ap-line-2)" />
        <Link href="/applicant/profile" className="flex h-10.5 items-center gap-2.5 rounded-[9px] px-2.5 text-sm font-semibold text-(--ap-ink-2) hover:bg-(--ap-line-2)">
          <UserRound className="size-4" aria-hidden="true" />
          Profile
        </Link>
        <Link href="/applicant/settings" className="flex h-10.5 items-center gap-2.5 rounded-[9px] px-2.5 text-sm font-semibold text-(--ap-ink-2) hover:bg-(--ap-line-2)">
          <Settings className="size-4" aria-hidden="true" />
          Settings
        </Link>
        {staff ? (
          <Link href="/applicant/staff-access" className="flex h-10.5 items-center gap-2.5 rounded-[9px] px-2.5 text-sm font-bold text-(--ap-violet) hover:bg-(--ap-tint)">
            <BriefcaseBusiness className="size-4" aria-hidden="true" />
            Staff Hub
          </Link>
        ) : null}
        <Link href="/applicant/help" className="flex h-10.5 items-center gap-2.5 rounded-[9px] px-2.5 text-sm font-semibold text-(--ap-ink-2) hover:bg-(--ap-line-2)">
          <CircleHelp className="size-4" aria-hidden="true" />
          Help & support
        </Link>
        <Link href="/" className="flex h-10.5 items-center gap-2.5 rounded-[9px] px-2.5 text-sm font-semibold text-(--ap-ink-2) hover:bg-(--ap-line-2)">
          <ArrowUpLeft className="size-4" aria-hidden="true" />
          Back to Beeliv website
        </Link>
        <hr className="my-1.5 border-(--ap-line-2)" />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            logout();
          }}
          className="flex h-10.5 w-full items-center gap-2.5 rounded-[9px] px-2.5 text-left text-sm font-semibold text-(--ap-ink-2) hover:bg-(--ap-line-2)"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Log out
        </button>
      </PopoverContent>
    </Popover>
  );
}

function DesktopTopbar({ unread }: { unread: number }) {
  return (
    <header style={{ viewTransitionName: "ap-topbar" }} className="sticky top-0 z-20 hidden h-[72px] items-center gap-4 border-b border-(--ap-line) bg-white/92 px-7 backdrop-blur-md min-[768px]:flex min-[1361px]:px-10">
      <SearchBox />
      <div className="ml-auto flex items-center gap-2">
        <NotificationsPopover unread={unread} />
        <ProfileMenu />
      </div>
    </header>
  );
}

function MobileTopbar({ unread, title }: { unread: number; title: string }) {
  return (
    <header style={{ viewTransitionName: "ap-mtopbar" }} className="sticky top-0 z-20 flex h-[72px] items-center gap-2 border-b border-(--ap-line) bg-white/95 px-4 backdrop-blur-md min-[768px]:hidden">
      <Image src="/images/beeliv-logo-full-colour.png" alt="Beeliv Hospitality" width={197} height={207} priority className="h-[54px] w-auto" />
      {title ? <span className="ml-1.5 text-[17px] font-bold text-(--ap-ink)">{title}</span> : null}
      <div className="ml-auto flex items-center gap-1">
        <Link href="/applicant/notifications" className="relative inline-flex size-11 items-center justify-center rounded-xl text-(--ap-ink-2)" aria-label="Notifications">
          <Bell className={`size-6 ${unread > 0 ? "ap-ring" : ""}`} aria-hidden="true" />
          {unread > 0 ? (
            <span className="ap-dot-pop absolute top-1.5 right-1 inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#f43f5e] px-1 text-[11px] leading-none font-bold text-white shadow-[0_0_0_2px_#fff]">
            <span className="sr-only">{unread} unread</span>
            <span aria-hidden="true">{unread > 99 ? "99+" : unread}</span>
          </span>
          ) : null}
        </Link>
        <Link href="/applicant/profile" aria-label="Profile" className="inline-flex size-11 items-center justify-center rounded-xl">
          <Avatar size={28} />
        </Link>
      </div>
    </header>
  );
}

/** Slides the bottom bar away while the page is scrolled down and brings it back on scroll up. */
function useHideOnScroll(enabled: boolean): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 60) {
        setHidden(false);
        last = y;
        return;
      }
      if (Math.abs(y - last) < 8) return;
      setHidden(y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      setHidden(false);
    };
  }, [enabled]);
  return enabled && hidden;
}

function MobileBottomNav({ pathname, moreActive, unread }: { pathname: string; moreActive: boolean; unread: number }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = NAV_ITEMS.filter((item) => item.mobilePrimary);
  // The Jobs list is a long scroll: the bar gets out of the way going down and returns going up.
  const hidden = useHideOnScroll(pathname === "/applicant/jobs");

  return (
    <BottomNavBar label="Applicant navigation" hidden={hidden}>
      {primary.map((item, i) => {
        const active = isNavActive(pathname, item.href);
        const Icon = item.href === "/applicant" ? House : item.icon;
        const label = item.label === "Overview" ? "Home" : item.label === "Find Jobs" ? "Jobs" : item.label === "My Applications" ? "Applied" : "Alerts";
        return (
          <BottomNavLink
            key={item.href}
            href={item.href}
            icon={Icon}
            label={label}
            active={active}
            center={i === 2}
            dot={item.href === "/applicant/notifications" && unread > 0}
            pillId="ap-bnav-pill"
          />
        );
      })}
      <BottomNavButton onClick={() => setMoreOpen(true)} icon={Menu} label="More" active={moreActive} pillId="ap-bnav-pill" />
      <AccountSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </BottomNavBar>
  );
}

/**
 * Phone "More" menu as a Motion bottom sheet: slides up, swipe the handle or
 * title down to close (or tap outside / Esc). Focus moves in on open and
 * returns to the More button on close; page scroll is locked meanwhile.
 */
export function MoreSheet({ open, onClose, title = "More", children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
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
          className={`applicant-shell ${newsreader.variable} fixed inset-0 z-[110] flex items-end min-[768px]:hidden`}
          style={{ background: "rgba(17,17,27,.45)" }}
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
                  {title}
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
