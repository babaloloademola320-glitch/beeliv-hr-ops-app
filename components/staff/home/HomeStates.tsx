"use client";

import Link from "next/link";
import { Clock3, Mail, Check } from "@/components/applicant/icons";
import { confirmAction } from "@/components/applicant/ConfirmDialog";
import { Reveal, Unveil } from "@/components/applicant/motion";
import { STAFF_ART } from "@/lib/staff/assets";
import { StaffHeroDeco } from "../StaffHeroDeco";
import { HeroCarousel, HeroRotatingText, useHeroRotation } from "../HeroCarousel";
import { StatusGate, type GateTone } from "../StatusGate";
import { ErrorPanel } from "../ErrorPanel";
import { ProgressBar } from "@/components/applicant/primitives";
import { SectionCard } from "@/components/applicant/SectionCard";
import { toast } from "@/components/ui/toast";
import { acknowledgeAgreement } from "@/lib/staff/service";
import { displayName } from "@/lib/staff/format";
import type { AccountStatus, StaffHome } from "@/lib/staff/types";
import { ShieldAlert } from "../icons";
import { withStaffPreloader } from "../StaffPreloader";
import { AssignmentCard } from "./HomeSections";

const sk = "ap-shimmer rounded-2xl";

export function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading your Home">
      <h1 className="sr-only">Home</h1>
      <div className={`${sk} h-[300px] min-[768px]:h-[260px]`} />
      <div className="grid grid-cols-2 gap-3 min-[768px]:grid-cols-4 min-[768px]:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${sk} h-[88px]`} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 min-[1241px]:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5">
          <div className={`${sk} h-[220px]`} />
          <div className={`${sk} h-[200px]`} />
        </div>
        <div className="flex flex-col gap-5">
          <div className={`${sk} h-[260px]`} />
          <div className={`${sk} h-[160px]`} />
        </div>
      </div>
    </div>
  );
}

export function HomeError({ retry }: { retry: () => void }) {
  return (
    <div className="mx-auto max-w-[860px] pt-4 min-[768px]:pt-10">
      <h1 className="sr-only">Home</h1>
      <ErrorPanel title="We couldn't load your Home" retry={retry} />
    </div>
  );
}

const GATE: Partial<Record<AccountStatus, { tone: GateTone; image: string | null; icon: typeof Mail; chip: string; title: string; lead: string; next: string }>> = {
  "invitation-required": {
    tone: "action",
    image: STAFF_ART.gateInvitation,
    icon: Mail,
    chip: "Action needed",
    title: "Your Staff Hub invitation is needed",
    lead: "Beeliv sets up staff accounts by invitation, so your Staff Hub opens once you accept yours.",
    next: "Accept the invitation Beeliv sent to your email, or ask Beeliv to send it again.",
  },
  "invitation-expired": {
    tone: "warn",
    image: STAFF_ART.gateExpired,
    icon: Clock3,
    chip: "Invitation expired",
    title: "This invitation has expired",
    lead: "For your security, invitations only work for a limited time.",
    next: "Ask Beeliv to send you a new invitation, then open the new link.",
  },
  suspended: {
    tone: "critical",
    image: STAFF_ART.gateSuspended,
    icon: ShieldAlert,
    chip: "Account suspended",
    title: "Your staff account is suspended",
    lead: "You can't use Staff Hub right now. Your information is kept safe.",
    next: "Please contact Beeliv to find out more and what happens next.",
  },
  deactivated: {
    tone: "neutral",
    image: STAFF_ART.gateInactive,
    icon: ShieldAlert,
    chip: "Account inactive",
    title: "Your staff account is no longer active",
    lead: "Staff Hub isn't available on this account any more.",
    next: "If you think this is a mistake, please contact Beeliv.",
  },
};

/** Invitation required / expired, suspended, deactivated. */
export function HomeGate({ status }: { status: AccountStatus }) {
  const g = GATE[status];
  if (!g) return null;
  return (
    <StatusGate
      tone={g.tone}
      image={g.image}
      icon={g.icon}
      chip={g.chip}
      title={g.title}
      lead={g.lead}
      next={g.next}
      primary={{ label: "Contact Beeliv", href: "/staff/help" }}
      secondary={{ label: "Go to applicant area", href: "/applicant" }}
    />
  );
}

/** Welcome-hero lines, changing with the pictures. Line 2 is PLACEHOLDER COPY for approval. */
const WELCOME_LINES = [
  "A few things to finish before your Staff Hub is fully ready. It only takes a few minutes.",
  "Welcome to the Beeliv team. We're glad to have you with us.",
];

/** New staff: finish setup (agreements, missing information). */
export function HomeOnboarding({ home }: { home: StaffHome }) {
  const items = home.onboarding ?? [];
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  const slide = useHeroRotation(STAFF_ART.heroCutouts.length);

  async function accept(id: string, title: string) {
    const ok = await confirmAction({ tone: "neutral", title: `Accept "${title}"?`, description: "Your acceptance is recorded against your Beeliv account.", acknowledge: "I have read and accept this agreement.", confirmLabel: "Accept" });
    if (!ok) return;
    try {
      await withStaffPreloader("accept-agreement", () => acknowledgeAgreement(id));
      toast.add({ title: "Agreement accepted", type: "success" });
    } catch {
      toast.add({ title: "We couldn't record that", description: "Please try again.", type: "error" });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Welcome hero with a CUTOUT image room (STAFF_ART.heroCutouts, auto-rotating), same build as the Home hero. */}
      <Reveal
        as="section"
        className="relative isolate grid grid-cols-[minmax(0,1fr)_150px] items-end gap-x-2 max-[380px]:grid-cols-[minmax(0,1fr)_132px] overflow-hidden rounded-[22px] border border-(--ap-line) bg-[linear-gradient(100deg,#FFFFFF,var(--ap-tint-soft)_55%,var(--ap-tint))] px-4 pt-4 min-[641px]:grid-cols-[minmax(0,1fr)_170px] min-[768px]:grid-cols-[minmax(0,1fr)_260px] min-[768px]:gap-x-5 min-[768px]:rounded-3xl min-[768px]:px-8 min-[768px]:pt-2"
      >
        <StaffHeroDeco />
        <div className="relative z-[2] self-center pb-5 min-[768px]:py-8">
          <div className="ap-eb mb-2">Welcome to Beeliv</div>
          <h1 className="ap-serif text-[40px] leading-[1] max-[380px]:text-[34px] min-[768px]:text-[54px]">{displayName(home.profile)}.</h1>
          <HeroRotatingText lines={WELCOME_LINES} index={slide} className="ap-bd mt-2 max-w-[46ch]" />
          <div className="mt-4 max-w-[420px]">
            <div className="ap-label mb-1.5 flex justify-between text-(--ap-muted)"><span>Setup progress</span><span>{done} of {items.length}</span></div>
            <ProgressBar percent={pct} label="Setup progress" />
          </div>
        </div>
        <div className="relative z-[1] min-h-[190px] self-stretch min-[768px]:min-h-[250px]">
          <div className="absolute inset-x-0 top-2 bottom-0">
            <div className="absolute inset-0">
              <span className="absolute bottom-[-18%] left-1/2 z-0 aspect-square w-[84%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_38%,#FFFFFF_0,#F1EEFA_42%,#DDD6F3_68%,rgba(221,214,243,0)_70%)]" />
              <span className="absolute bottom-[-6%] left-1/2 z-[1] aspect-square w-[98%] -translate-x-1/2 rounded-full border-[1.5px] border-[rgba(105,84,200,.18)]" />
              <Unveil className="absolute inset-0 z-[2]">
                <div className="ap-float absolute inset-0">
                  <HeroCarousel images={STAFF_ART.heroCutouts} index={slide} alt="Beeliv hospitality team member" priority phoneShift={STAFF_ART.heroPhoneShift} />
                </div>
              </Unveil>
            </div>
          </div>
        </div>
      </Reveal>
      <div className="grid grid-cols-1 gap-5 min-[1241px]:grid-cols-[minmax(0,1fr)_380px] min-[1241px]:items-start">
        <SectionCard title="Finish setting up" aside>
          <ul className="flex flex-col gap-3">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 rounded-2xl border border-(--ap-line-2) p-3">
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${i.done ? "bg-(--ap-ok-bg) text-(--ap-ok)" : "border-2 border-(--ap-tint-2) text-transparent"}`}>
                  <Check className="size-4" strokeWidth={2.4} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <b className="ap-title block">{i.label}</b>
                  {i.agreement ? <span className="ap-label block text-(--ap-muted)">{i.agreement.summary}</span> : null}
                </div>
                {i.done ? (
                  <span className="ap-label font-bold text-(--ap-ok)">Done</span>
                ) : i.agreement ? (
                  <button type="button" onClick={() => accept(i.agreement!.id, i.agreement!.title)} className="ap-btn ap-btn-p ap-btn-sm shrink-0 px-4 text-white!">Review</button>
                ) : (
                  <Link href={i.href ?? "/staff"} className="ap-btn ap-btn-p ap-btn-sm shrink-0 px-4 text-white!">Start</Link>
                )}
              </li>
            ))}
          </ul>
        </SectionCard>
        <AssignmentCard a={home.assignment} className="" />
      </div>
    </div>
  );
}
