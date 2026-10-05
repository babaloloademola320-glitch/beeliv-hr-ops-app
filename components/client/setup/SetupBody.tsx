"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronLeft } from "@/components/applicant/icons";
import { useFlagInvalid } from "@/components/applicant/form-feedback";
import { CHIP } from "@/components/applicant/apply/parts";
import { CARD } from "@/components/applicant/SectionCard";
import { ErrorPanel } from "@/components/staff/ErrorPanel";
import { toast } from "@/components/ui/toast";
import { useClientSession, useOnboarding } from "@/lib/client/hooks";
import { saveOnboarding } from "@/lib/client/service";
import type { AgreementAck, ClientContactDetails, ClientOnboarding, NotificationPrefs, OnboardingItem, OnboardingSave, Outlet } from "@/lib/client/types";
import { detailsErrors, StepAccess, StepAgreements, StepDetails, StepDone, StepNotifications, StepWelcome } from "./SetupSteps";
import { LAST_STEP, SETUP_DESCRIPTIONS, SETUP_STEPS, STEP_ITEM } from "./steps";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ap-violet)";
const BTN = "ap-btn text-[15px] font-semibold";
const SK = "ap-sk-box rounded-2xl";

/**
 * First-time account setup for an invited Client (project lead, 2026-09-30).
 * Same stepper pattern as the Applicant apply flow and the Staff SOP reader:
 * step rail from 1041px, compact progress card below, Previous / Next sticky
 * above the phone bottom nav, every step opens at the top. Progress is saved
 * on each step (saveOnboarding) so reopening resumes where the user left off.
 *
 * NO auth here: accepting the invitation / setting a password / verifying the
 * email is handled by the Client sign-in (TBD), shown as already done.
 */
export function SetupBody() {
  const ob = useOnboarding();
  const session = useClientSession();
  const raw = useSearchParams().get("step");
  const wantStep = raw === null ? null : Number(raw);

  if (ob.status === "loading" || session.status === "loading") return <SetupSkeleton />;
  if (!ob.data || !session.data) {
    return (
      <div className="mx-auto max-w-[860px] pt-4 min-[768px]:pt-10">
        <h1 className="sr-only">Account setup</h1>
        <ErrorPanel title="We couldn't load your account setup" retry={ob.retry} />
      </div>
    );
  }
  const start = wantStep !== null && Number.isInteger(wantStep) && wantStep >= 0 && wantStep <= LAST_STEP ? wantStep : ob.data.status === "complete" ? LAST_STEP : Math.min(ob.data.currentStep, LAST_STEP);
  return <SetupFlow initial={ob.data} start={start} clientName={session.data.clientName} outlets={session.data.outlets} />;
}

function SetupFlow({ initial, start, clientName, outlets }: { initial: ClientOnboarding; start: number; clientName: string; outlets: Outlet[] }) {
  const [step, setStep] = useState(start);
  const [dir, setDir] = useState<1 | -1>(1);
  const [items, setItems] = useState<OnboardingItem[]>(initial.items);
  const [details, setDetails] = useState<ClientContactDetails>(initial.details);
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial.notifications);
  const [agreements, setAgreements] = useState<AgreementAck[]>(initial.agreements);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const flag = useFlagInvalid(mainRef);

  // Every step opens at the top of the page.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [step]);

  const total = SETUP_STEPS.length;
  const isLast = step === LAST_STEP;
  const allDone = items.every((i) => i.done);
  const itemDone = (i: number) => (i === 0 ? step > 0 : i === LAST_STEP ? allDone : (items.find((x) => x.step === i)?.done ?? false));
  const pct = Math.round(((step + 1) / total) * 100);

  async function save(to: number, completed?: OnboardingSave["completed"]) {
    setBusy(true);
    try {
      const res = await saveOnboarding({ currentStep: to, details, notifications: prefs, agreements, completed });
      setItems(res.items);
      setDir(to >= step ? 1 : -1);
      setTried(false);
      setStep(to);
    } catch {
      toast.add({ title: "We couldn't save that", description: "Please try again.", type: "error" });
    } finally {
      setBusy(false);
    }
  }

  function onNext() {
    if (step === 1 && Object.values(detailsErrors(details)).some(Boolean)) {
      setTried(true);
      flag();
      return;
    }
    if (step === 4 && agreements.some((a) => !a.acknowledged)) {
      setTried(true);
      flag();
      return;
    }
    // A wrong-but-partly-typed phone number marks itself invalid; flag it too.
    if (mainRef.current?.querySelector('[aria-invalid="true"]')) {
      setTried(true);
      flag();
      return;
    }
    void save(step + 1, step >= 1 && step <= 4 ? [STEP_ITEM[step as 1 | 2 | 3 | 4]] : undefined);
  }

  function changePrefs(next: NotificationPrefs) {
    setPrefs(next);
    saveOnboarding({ notifications: next }).catch(() => toast.add({ title: "We couldn't save that", description: "Please try again.", type: "error" }));
  }

  const firstName = details.fullName.trim().split(/\s+/)[0] || "there";

  return (
    <div>
      <Link href="/client" className={`mb-1.5 inline-flex items-center gap-1.5 py-1 text-[14px] font-bold max-[1100px]:min-h-11 max-[1100px]:py-0 ${FOCUS}`}>
        <ChevronLeft className="size-[15px]" aria-hidden="true" />
        Overview
      </Link>

      {/* Phones and tablets: compact progress card */}
      <div className={`${CARD} mb-4 px-4 py-3.5 min-[1041px]:hidden`}>
        <div className="flex items-baseline justify-between gap-3">
          <b className="text-[14px]">
            Step {step + 1} of {total}
          </b>
          <span className="text-[13px] text-(--ap-muted)">{pct}%</span>
        </div>
        <div className="ap-bar mt-2.5" role="progressbar" aria-label="Setup progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <i className="transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex justify-between gap-3 text-[13px] text-(--ap-muted)">
          <span className="min-w-0 truncate">{clientName}</span>
          <span className="shrink-0 text-right">{step < LAST_STEP ? `Next: ${SETUP_STEPS[step + 1]}` : "Finished"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 min-[1041px]:grid-cols-[260px_minmax(0,1fr)]">
        <aside className={`${CARD} sticky top-[88px] hidden p-6 min-[1041px]:block`} aria-label="Setup steps">
          <div className="mb-2.5 border-b border-(--ap-line-2) pb-4">
            <b className="block text-[15px]">Account setup</b>
            <span className="text-[13px] text-(--ap-muted)">{clientName}</span>
          </div>
          <ol className="m-0 flex list-none flex-col p-0">
            {SETUP_STEPS.map((label, i) => {
              const done = itemDone(i);
              const current = i === step;
              return (
                <li key={label}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void save(i)}
                    aria-current={current ? "step" : undefined}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-[10px] border-0 px-2.5 py-2 text-left text-[14px] ${FOCUS} ${current ? "bg-(--ap-tint) font-bold text-(--ap-violet)" : done ? "font-semibold text-(--ap-ink-2) hover:bg-(--ap-line-2)" : "font-semibold text-(--ap-muted) hover:bg-(--ap-line-2)"}`}
                  >
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[13px] font-bold ${done && !current ? "border-(--ap-violet) bg-(--ap-violet) text-white" : current ? "border-(--ap-violet) bg-white text-(--ap-violet)" : "border-(--ap-line) bg-white"}`}>
                      {done && !current ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
                    </span>
                    {label}
                    {done ? <span className="sr-only"> (completed)</span> : null}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="ap-bar mt-4" role="progressbar" aria-label="Setup progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <i className="transition-[width] duration-700" style={{ width: `${pct}%` }} />
          </div>
          <p className="ap-sm mt-3">Your progress is saved as you go.</p>
        </aside>

        <section ref={mainRef} className={`${CARD} p-6 min-[768px]:max-[1100px]:p-[22px] max-[767px]:px-4.5 max-[767px]:py-5`} aria-labelledby="setup-step-title">
          <span className={`${CHIP.mute} mb-2.5`}>Account setup</span>
          <h1 id="setup-step-title" className="ap-serif text-[35px] max-[767px]:text-[30px]">
            {isLast && allDone ? `You're all set, ${firstName}.` : SETUP_STEPS[step]}
          </h1>
          <p className="ap-bd mt-1.5 mb-5.5">{isLast && allDone ? SETUP_DESCRIPTIONS[LAST_STEP] : SETUP_DESCRIPTIONS[step]}</p>

          <div key={step} className={dir > 0 ? "ap-step-fwd" : "ap-step-back"}>
            {step === 0 && <StepWelcome clientName={clientName} team={initial.invitedBy} outlets={outlets} />}
            {step === 1 && <StepDetails value={details} onChange={setDetails} tried={tried} />}
            {step === 2 && <StepAccess outlets={outlets} />}
            {step === 3 && <StepNotifications value={prefs} onChange={changePrefs} />}
            {step === 4 && <StepAgreements value={agreements} onChange={setAgreements} tried={tried} />}
            {step === 5 && <StepDone items={items} firstName={firstName} onOpen={(s) => void save(s)} />}
          </div>

          {!isLast ? (
            <div className="mt-6.5 flex items-center gap-2.5 border-t border-(--ap-line-2) pt-4.5 max-[767px]:fixed max-[767px]:inset-x-0 max-[767px]:bottom-0 max-[767px]:z-[40] max-[767px]:mt-5.5 max-[767px]:bg-white max-[767px]:px-4 max-[767px]:pt-3 max-[767px]:pb-[calc(12px+env(safe-area-inset-bottom,0px))] max-[767px]:shadow-[0_-8px_24px_rgba(17,17,27,.08)] max-[640px]:grid max-[640px]:grid-cols-[auto_minmax(0,1fr)]">
              {step > 0 ? (
                <button type="button" disabled={busy} onClick={() => void save(step - 1)} className={`${BTN} ap-btn-s max-[767px]:h-12 max-[640px]:min-w-0 max-[640px]:px-3.5 ${FOCUS}`}>
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Previous
                </button>
              ) : null}
              <span className="flex-1 max-[767px]:hidden" />
              <button type="button" disabled={busy} onClick={onNext} className={`${BTN} ap-btn-p max-[767px]:h-12 max-[767px]:flex-1 max-[640px]:min-w-0 ${step === 0 ? "max-[640px]:col-span-full" : ""} ${FOCUS}`}>
                {step === 0 ? "Get started" : step === 4 ? "Finish" : "Next"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function SetupSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading account setup">
      <h1 className="sr-only">Account setup</h1>
      <div className={`${SK} mb-4 h-[92px] min-[1041px]:hidden`} />
      <div className="grid grid-cols-1 items-start gap-5 min-[1041px]:grid-cols-[260px_minmax(0,1fr)]">
        <div className={`${SK} hidden h-[400px] min-[1041px]:block`} />
        <div className={`${SK} h-[460px]`} />
      </div>
    </div>
  );
}
