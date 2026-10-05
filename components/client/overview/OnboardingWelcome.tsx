"use client";

import Link from "next/link";
import { ArrowRight, Check } from "@/components/applicant/icons";
import { Reveal } from "@/components/applicant/motion";
import { ProgressBar } from "@/components/applicant/primitives";
import { SectionCard } from "@/components/applicant/SectionCard";
import { displayName } from "@/lib/client/format";
import { useClientSession, useOnboarding } from "@/lib/client/hooks";
import { SETUP_HREF, setupStepHref } from "../setup/steps";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ap-violet)";

/**
 * New-client onboarding on Overview (mirrors Staff's HomeOnboarding): a welcome
 * hero with setup progress and a "Finish setting up" checklist that links into
 * the right /client/setup step. Shown ABOVE the normal Overview while setup is
 * incomplete; renders nothing once it is complete (or while loading / failed,
 * so it can never block the page).
 */
export function OnboardingWelcome() {
  const { data: ob } = useOnboarding();
  const { data: session } = useClientSession();
  if (!ob || ob.status === "complete") return null;

  const done = ob.items.filter((i) => i.done).length;
  const pct = Math.round((done / ob.items.length) * 100);
  const name = session ? displayName(session.user) : "";
  const resume = ob.status === "in-progress" ? "Continue setup" : "Start setup";

  return (
    <div className="flex flex-col gap-5">
      <Reveal
        as="section"
        aria-labelledby="onboarding-h"
        className="relative isolate overflow-hidden rounded-[22px] border border-(--ap-line) bg-[linear-gradient(100deg,#FFFFFF,var(--ap-tint-soft)_55%,var(--ap-tint))] px-5 py-6 min-[768px]:rounded-3xl min-[768px]:px-8 min-[768px]:py-8"
      >
        <div className="ap-eb mb-2">Welcome to Beeliv</div>
        <h2 id="onboarding-h" className="ap-serif text-[36px] leading-[1.05] max-[380px]:text-[32px] min-[768px]:text-[48px]">
          Welcome to Beeliv{name ? `, ${name}` : ""}.
        </h2>
        <p className="ap-bd mt-2 max-w-[52ch]">
          {session?.clientName ? `${session.clientName} is ready to go. ` : ""}A few quick steps finish setting up your account. It only takes a few minutes.
        </p>
        <div className="mt-4 max-w-[420px]">
          <div className="ap-label mb-1.5 flex justify-between text-(--ap-muted)">
            <span>Setup progress</span>
            <span>
              {done} of {ob.items.length}
            </span>
          </div>
          <ProgressBar percent={pct} label="Setup progress" />
        </div>
        <Link href={SETUP_HREF} className={`ap-btn ap-btn-p mt-5 h-12 px-5 text-[15px] font-semibold text-white! max-[480px]:w-full ${FOCUS}`}>
          {resume}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </Reveal>

      <SectionCard title="Finish setting up" aside>
        <ul className="flex flex-col gap-3">
          {ob.items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 rounded-2xl border border-(--ap-line-2) p-3">
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${i.done ? "bg-(--ap-ok-bg) text-(--ap-ok)" : "border-2 border-(--ap-tint-2) text-transparent"}`}>
                <Check className="size-4" strokeWidth={2.4} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <b className="ap-title block">{i.label}</b>
                <span className="ap-label block text-(--ap-muted)">{i.detail}</span>
              </div>
              {i.done ? (
                <span className="ap-label font-bold text-(--ap-ok)">Done</span>
              ) : (
                <Link href={i.step !== null ? setupStepHref(i.step) : SETUP_HREF} className={`ap-btn ap-btn-p ap-btn-sm shrink-0 px-4 text-white! ${FOCUS}`}>
                  Start
                </Link>
              )}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
