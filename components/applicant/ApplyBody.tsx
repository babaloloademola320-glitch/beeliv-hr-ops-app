"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, ChevronLeft, CircleAlert, CloudUpload } from "@/components/applicant/icons";
import type { ApplicantJob as Job } from "@/lib/applicant/jobs";
import { toast } from "@/components/ui/toast";
import { APPLY_STEPS, APPLY_STEP_DESCRIPTIONS } from "@/lib/applicant/reference-data";
import {
  attachExistingDocument,
  getDraftForVacancy,
  getOrCreateDraft,
  getProfile,
  listApplications,
  saveApplicationStep,
  saveProfile,
  submitApplication,
  useApplicantStore,
} from "@/lib/applicant/service";
import { readScreeningAnswers, screeningQuestionsFor } from "@/lib/applicant/screening";
import type { ApplyFormData } from "@/lib/applicant/types";
import { JobThumb } from "./primitives";
import { useFlagInvalid } from "./form-feedback";
import { useRelativeTime } from "./RelativeTime";
import { BTN, CHIP, LINK_CLS, STROKE } from "./apply/parts";
import { StepPersonal, type PersonalProfileFields } from "./apply/StepPersonal";
import { StepExperience } from "./apply/StepExperience";
import { StepSkills } from "./apply/StepSkills";
import { REUSABLE_DOCS, StepDocuments, findReusableDoc } from "./apply/StepDocuments";
import { StepScreening } from "./apply/StepScreening";
import { StepReview, joinAnd, missingRequired } from "./apply/StepReview";
import { ApplyBlocked, ApplySuccess } from "./apply/ApplyStates";
import { withPreloader } from "./Preloader";

/**
 * Apply workspace — the wireframe's applyPage() (beeliv-website/applicant/
 * index.html): desktop `.wk` grid (260px sticky `.wk-side` stepper + `.wk-main`),
 * `.mstep` progress card at ≤1040px, sticky `.wk-foot`.
 *
 * Front-loaded per direct project-lead instruction (2026-09-28): employment
 * history, CV/photo/ID-file/cert uploads and screening questions are all
 * captured in the initial Draft Application. Guarantor, references and
 * medical documents are NOT asked here — they are later pre-employment
 * documents. No NIN number or banking field exists anywhere in this flow.
 *
 * All reads/writes go through lib/applicant/service.ts (mock adapter).
 */

/** Wireframe savedPing(): "Saving…" for 700ms after the last change, then "Saved just now". */
const AUTOSAVE_MS = 700;

const CARD = "ap-card rounded-[20px] max-[767px]:rounded-[18px]";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ap-violet)";

/** ApplyFormData keys that are also profile fields ("Changes here also update your profile"). */
const PROFILE_FORM_KEYS = ["fullName", "preferredName", "phone", "whatsapp", "email"] as const;

type Init =
  | { kind: "loading" }
  | { kind: "blocked"; reason: "closed" | "applied"; applicationId?: string }
  | { kind: "ready"; applicationId: string };

function locationFrom(address: string, state: string): string {
  const area = address.split(",").map((s) => s.trim()).filter(Boolean).pop() ?? "";
  return [area, state].filter(Boolean).join(", ");
}

export function ApplyBody({ job }: { job: Job }) {
  // Must be the first hook: its effect hydrates the mock store from
  // localStorage, and effects run in declaration order, so the draft
  // lookup below always sees hydrated data.
  const store = useApplicantStore();
  const router = useRouter();

  const [init, setInit] = useState<Init>({ kind: "loading" });
  const [step, setStep] = useState(0);
  // Direction of the last step change, for the slide-in (1 = Next, -1 = Back).
  const [dir, setDir] = useState<1 | -1>(1);
  const [form, setForm] = useState<ApplyFormData | null>(null);
  const [personal, setPersonalState] = useState<PersonalProfileFields | null>(null);
  const [ack, setAck] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  // Set by a Submit press with something missing: fields then show what is wrong.
  const [tried, setTried] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const [savedAt, setSavedAt] = useState<string>(() => new Date().toISOString());
  // This vacancy's own screening questions (lib/applicant/screening.ts).
  const questions = useMemo(() => screeningQuestionsFor(job), [job]);

  const startedFor = useRef<string | null>(null);
  const pending = useRef<{ form: ApplyFormData | null; personal: PersonalProfileFields | null; profileDirty: boolean }>({
    form: null,
    personal: null,
    profileDirty: false,
  });
  const timer = useRef<number | undefined>(undefined);

  // Draft continuity: resolves the SAME draft for this vacancy if one exists
  // (never a duplicate). The ref guard keeps React StrictMode's dev-only
  // double effect from firing the toast twice.
  useEffect(() => {
    if (startedFor.current === job.id) return;
    startedFor.current = job.id;
    (async () => {
      const [apps, profile] = await Promise.all([listApplications(), getProfile()]);
      const existing = getDraftForVacancy(job.id);
      const submittedApp = apps.find((a) => a.vacancyId === job.id && a.lifecycle !== "draft");
      if (submittedApp) {
        setInit({ kind: "blocked", reason: "applied", applicationId: submittedApp.id });
        return;
      }
      if (job.closed) {
        setInit({ kind: "blocked", reason: "closed" });
        return;
      }
      const draft = await getOrCreateDraft(job.id, {
        role: job.role,
        company: job.company,
        location: job.location,
        employmentType: job.employmentType,
      });
      setForm(draft.form);
      setPersonalState({
        applicantId: profile.applicantId,
        dateOfBirth: profile.dateOfBirth,
        address: profile.address,
        state: profile.state,
        lga: profile.lga,
      });
      // Wireframe: a resumed draft opens at step 2 (index 1); a new one at step 1.
      setStep(existing ? 1 : 0);
      setSavedAt(draft.updatedAt);
      setInit({ kind: "ready", applicationId: draft.id });
      toast.add({
        title: existing ? "Resuming your saved application" : `Draft started for ${job.role}. Your profile details are already filled in.`,
      });
    })();
  }, [job]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Every step (including the first one, once the draft has loaded) starts at
  // the top of the page. Without this, phones kept the scroll position from
  // the job page when the Personal details step appeared (project lead).
  const ready = init.kind === "ready";
  useEffect(() => {
    if (ready) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [ready, step]);

  const flag = useFlagInvalid(mainRef);

  const applicationId = init.kind === "ready" ? init.applicationId : null;
  const savedLabel = useRelativeTime(savedAt);

  async function flush(atStep: number = step) {
    window.clearTimeout(timer.current);
    const p = pending.current;
    pending.current = { form: null, personal: null, profileDirty: false };
    if (!applicationId) return;
    const f = p.form ?? form;
    if (f) await saveApplicationStep(applicationId, atStep, f);
    if (p.profileDirty && f) {
      const per = p.personal ?? personal;
      await saveProfile({
        fullName: f.fullName,
        preferredName: f.preferredName,
        phone: f.phone,
        whatsapp: f.whatsapp,
        email: f.email,
        ...(per ? { dateOfBirth: per.dateOfBirth, address: per.address, state: per.state, lga: per.lga } : {}),
      });
    }
    setSaving(false);
    setSavedAt(new Date().toISOString());
  }

  function scheduleSave() {
    setSaving(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), AUTOSAVE_MS);
  }

  function updateForm(next: ApplyFormData, touchesProfile = false) {
    setForm(next);
    pending.current.form = next;
    if (touchesProfile) pending.current.profileDirty = true;
    scheduleSave();
  }

  function set<K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) {
    if (!form) return;
    updateForm({ ...form, [key]: value }, (PROFILE_FORM_KEYS as readonly string[]).includes(key));
  }

  function setPersonal<K extends keyof PersonalProfileFields>(key: K, value: PersonalProfileFields[K]) {
    if (!personal) return;
    // Build on the latest pending value, not the render's `personal`: picking a state calls this twice in a row
    // (state, then clearing a mismatched LGA) and the second call must not undo the first.
    const next = { ...(pending.current.personal ?? personal), [key]: value };
    setPersonalState(next);
    pending.current.personal = next;
    pending.current.profileDirty = true;
    scheduleSave();
  }

  function setScreeningAnswer(id: string, value: string | string[]) {
    if (!form) return;
    updateForm({ ...form, screeningAnswers: { ...readScreeningAnswers(form, questions), [id]: value } });
  }

  function toggleSector(s: string) {
    if (!form) return;
    updateForm({ ...form, sectors: form.sectors.includes(s) ? form.sectors.filter((x) => x !== s) : [...form.sectors, s] });
  }

  function toggleSkill(category: string, skill: string) {
    if (!form) return;
    const current = form.skills[category] ?? [];
    const next = current.includes(skill) ? current.filter((x) => x !== skill) : [...current, skill];
    updateForm({ ...form, skills: { ...form.skills, [category]: next } });
  }

  async function goTo(next: number) {
    await flush(step);
    setDir(next >= step ? 1 : -1);
    setStep(next);
  }

  async function saveAndExit() {
    await flush(step);
    toast.add({ title: "Draft saved. Continue any time from My Applications." });
    router.push("/applicant/applications");
  }

  const reusable = REUSABLE_DOCS.map((d) => ({ ...d, doc: findReusableDoc(store.documents, d.name) })).filter((d) => d.doc);
  // BEELIV-RECRUITMENT-SPEC §5: CV, passport photograph and valid ID are
  // "Required to apply" (only these three; everything else stays optional).
  const missingDocs = REUSABLE_DOCS.filter((d) => !reusable.some((r) => r.name === d.name));

  /** Continue: stay put and flag any field that already shows itself as invalid (e.g. a wrong phone number). */
  function onContinue() {
    if (mainRef.current?.querySelector('[aria-invalid="true"]')) {
      flag();
      return;
    }
    void goTo(step + 1);
  }

  /** From a warning line: jump to the step that holds the problem, then flag it there. */
  async function fixAt(target: number) {
    setTried(true);
    await goTo(target);
    flag();
  }

  async function onSubmit() {
    if (!applicationId || !form) return;
    if (!ack || missingDocs.length > 0 || missingRequired(form, questions).length > 0) {
      setTried(true);
      flag();
      return;
    }
    await withPreloader("submit-application", { role: job.role, company: job.company }, async () => {
      await flush(step);
      // "Use existing ✓": the stored CV / photo / ID file are attached to this
      // application rather than re-uploaded.
      for (const d of reusable) if (d.doc) await attachExistingDocument(d.doc.id, applicationId);
      await submitApplication(applicationId);
    });
    setSubmitted(true);
    window.scrollTo(0, 0);
  }

  /* ---------------------------------------------------------------- render */

  if (submitted && applicationId) return <ApplySuccess job={job} applicationId={applicationId} />;
  if (init.kind === "blocked") return <ApplyBlocked job={job} reason={init.reason} applicationId={init.applicationId} />;
  if (init.kind === "loading" || !form || !personal || !applicationId) return <ApplySkeleton />;

  const total = APPLY_STEPS.length;
  const isLast = step === total - 1;
  const missing = missingRequired(form, questions);
  const canSubmit = ack && missing.length === 0 && missingDocs.length === 0;
  const missingDocsLabel = joinWords(missingDocs.map((d) => d.short));
  const sidePct = Math.max(Math.round((step / total) * 100), 8);
  const savedText = saving ? "Saving…" : `Saved ${savedLabel.charAt(0).toLowerCase()}${savedLabel.slice(1)}`;
  const description = step === 4 ? `${job.company} asked these questions for this role.` : APPLY_STEP_DESCRIPTIONS[step];
  const reusedLabel = reusable.map((d) => d.short).join(", ");

  const saved = (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-(--ap-muted)" aria-live="polite">
      <CloudUpload className="size-[15px] shrink-0 text-(--ap-ok)" strokeWidth={STROKE} aria-hidden="true" />
      <span>{savedText}</span>
    </span>
  );

  return (
    <div>
      {/* `.crumb` */}
      <Link href="/applicant/applications" className={`mb-1.5 inline-flex items-center gap-1.5 py-1 text-[14px] font-bold max-[1100px]:min-h-11 max-[1100px]:py-0 ${FOCUS}`}>
        <ChevronLeft className="size-[15px]" strokeWidth={STROKE} aria-hidden="true" />
        My Applications
      </Link>

      {/* `.mstep` — phones & tablets (≤1040px) */}
      <div className={`${CARD} mb-4 px-4 py-3.5 min-[1041px]:hidden`}>
        <div className="flex items-baseline justify-between gap-3">
          <b className="text-[14px]">
            Step {step + 1} of {total}
          </b>
          {saved}
        </div>
        <div
          className="ap-bar mt-2.5"
          role="progressbar"
          aria-label="Application progress"
          aria-valuenow={Math.round(((step + 1) / total) * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <i className="transition-[width] duration-700" style={{ width: `${Math.round(((step + 1) / total) * 100)}%` }} />
        </div>
        <div className="mt-2 flex justify-between gap-3 text-[13px] text-(--ap-muted)">
          <span>
            {job.role} · {job.company}
          </span>
          <span className="text-right">Next: {APPLY_STEPS[step + 1] ?? "Submit"}</span>
        </div>
      </div>

      {/* `.wk` */}
      <div className="grid grid-cols-1 items-start gap-5 min-[1041px]:grid-cols-[260px_minmax(0,1fr)]">
        {/* `.wk-side` */}
        <aside className={`${CARD} sticky top-[88px] hidden p-6 min-[1041px]:block`} aria-label="Application steps">
          <div className="mb-2.5 flex items-center gap-3 border-b border-(--ap-line-2) pb-4">
            <JobThumb image={job.image} department={job.department} size={46} radius={12} />
            <div className="min-w-0">
              <b className="block text-[15px]">{job.role}</b>
              <span className="text-[13px] text-(--ap-muted)">
                {job.company} · {job.location}
              </span>
            </div>
          </div>
          <ol className="m-0 flex list-none flex-col p-0">
            {APPLY_STEPS.map((label, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => void goTo(i)}
                    aria-current={current ? "step" : undefined}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-[10px] border-0 px-2.5 py-2 text-left text-[14px] ${FOCUS} ${
                      current
                        ? "bg-(--ap-tint) font-bold text-(--ap-violet)"
                        : done
                          ? "font-semibold text-(--ap-ink-2) hover:bg-(--ap-line-2)"
                          : "font-semibold text-(--ap-muted) hover:bg-(--ap-line-2)"
                    }`}
                  >
                    <span
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[13px] font-bold ${
                        done
                          ? "border-(--ap-violet) bg-(--ap-violet) text-white"
                          : current
                            ? "border-(--ap-violet) bg-white text-(--ap-violet)"
                            : "border-[#cfc8d8] bg-white"
                      }`}
                    >
                      {done ? <Check className="size-3.5" strokeWidth={STROKE} aria-hidden="true" /> : i + 1}
                    </span>
                    {label}
                    {done ? <span className="sr-only"> (completed)</span> : null}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="ap-bar mt-4" role="progressbar" aria-label="Application progress" aria-valuenow={sidePct} aria-valuemin={0} aria-valuemax={100}>
            <i className="transition-[width] duration-700" style={{ width: `${sidePct}%` }} />
          </div>
          <div className="mt-3.5">{saved}</div>
        </aside>

        {/* `.wk-main` */}
        <section ref={mainRef} className={`${CARD} p-6 min-[768px]:max-[1100px]:p-[22px] max-[767px]:px-4.5 max-[767px]:py-5`} aria-labelledby="ap-step-title">
          <span className={`${CHIP.mute} mb-2.5`}>Draft</span>
          <h1 id="ap-step-title" className="ap-serif text-[35px] max-[767px]:text-[30px]">
            {APPLY_STEPS[step]}
          </h1>
          <p className="ap-bd mt-1.5 mb-5.5">{description}</p>

          <div key={step} className={dir > 0 ? "ap-step-fwd" : "ap-step-back"}>
          {step === 0 && <StepPersonal form={form} set={set} personal={personal} setPersonal={setPersonal} />}
          {step === 1 && <StepExperience form={form} set={set} toggleSector={toggleSector} />}
          {step === 2 && <StepSkills form={form} toggleSkill={toggleSkill} />}
          {step === 3 && <StepDocuments applicationId={applicationId} form={form} set={set} showErrors={tried} />}
          {step === 4 && <StepScreening questions={questions} answers={readScreeningAnswers(form, questions)} onAnswer={setScreeningAnswer} missing={tried ? missing : []} />}
          {step === 5 && (
            <StepReview
              form={form}
              questions={questions}
              ack={ack}
              setAck={setAck}
              showErrors={tried}
              onEdit={(s) => void goTo(s)}
              summary={{
                name: form.fullName,
                phone: form.phone,
                email: form.email,
                // personal.state is now state of ORIGIN, not residence — don't present it as the applicant's location.
                location: locationFrom(personal.address, ""),
                reusedDocs: reusedLabel ? reusedLabel.charAt(0).toUpperCase() + reusedLabel.slice(1) : "",
                company: job.company,
              }}
            />
          )}
          </div>

          {isLast && missing.length > 0 ? (
            // `.warnline`
            <p data-ap-invalid={tried ? true : undefined} className="mt-4.5 flex items-start gap-2 rounded-xl bg-(--ap-warn-bg) px-3.5 py-3 text-[14px] text-(--ap-warn)" role="status">
              <CircleAlert className="mt-px size-4.5 shrink-0" strokeWidth={STROKE} aria-hidden="true" />
              <span>
                Answer screening question{missing.length > 1 ? "s" : ""} {joinAnd(missing)} before submitting.{" "}
                <button type="button" className={`${LINK_CLS} !min-h-0`} onClick={() => void fixAt(4)}>
                  Go to question
                </button>
              </span>
            </p>
          ) : null}

          {isLast && missingDocs.length > 0 ? (
            // `.warnline` — the three "Required to apply" documents (spec §5)
            <p data-ap-invalid={tried ? true : undefined} className="mt-4.5 flex items-start gap-2 rounded-xl bg-(--ap-warn-bg) px-3.5 py-3 text-[14px] text-(--ap-warn)" role="status">
              <CircleAlert className="mt-px size-4.5 shrink-0" strokeWidth={STROKE} aria-hidden="true" />
              <span>
                Upload your {missingDocsLabel} before submitting.{" "}
                <button type="button" className={`${LINK_CLS} !min-h-0`} onClick={() => void fixAt(3)}>
                  Go to documents
                </button>
              </span>
            </p>
          ) : null}

          <div className="h-20 min-[768px]:hidden" aria-hidden="true" />
          {/* `.wk-foot` — floats above the bottom edge on phones (no bottom nav on this flow) */}
          <div className="mt-6.5 flex items-center gap-2.5 border-t border-(--ap-line-2) pt-4.5 max-[767px]:fixed max-[767px]:inset-x-3 max-[767px]:bottom-[calc(12px+env(safe-area-inset-bottom,0px))] max-[767px]:z-[40] max-[767px]:mt-0 max-[767px]:rounded-[20px] max-[767px]:border max-[767px]:border-(--ap-line) max-[767px]:bg-white max-[767px]:p-2.5 max-[767px]:shadow-[0_12px_32px_rgba(37,0,68,.22)] max-[640px]:grid max-[640px]:grid-cols-[auto_minmax(0,1fr)]">
            {step > 0 ? (
              <button type="button" onClick={() => void goTo(step - 1)} className={`${BTN} ap-btn-s max-[767px]:h-12 max-[640px]:min-w-0 max-[640px]:px-3.5 ${FOCUS}`}>
                <ChevronLeft className="size-4" strokeWidth={STROKE} aria-hidden="true" />
                Back
              </button>
            ) : null}
            <span className="flex-1 max-[767px]:hidden" />
            <button
              type="button"
              onClick={() => void saveAndExit()}
              className={`${BTN} bg-[#f1eff3] text-(--ap-ink) hover:bg-[#e8e4ed] max-[767px]:hidden ${FOCUS}`}
            >
              Save &amp; exit
            </button>
            {isLast ? (
              <button
                type="button"
                onClick={() => void onSubmit()}
                aria-describedby={!canSubmit ? "ap-submit-hint" : undefined}
                className={`${BTN} ap-btn-p max-[767px]:h-12 max-[767px]:flex-1 max-[640px]:min-w-0 ${step === 0 ? "max-[640px]:col-span-full" : ""} ${FOCUS}`}
              >
                <span className="max-[767px]:hidden">Submit application</span>
                <span className="min-[768px]:hidden">Submit</span>
                <ArrowRight className="size-4" strokeWidth={STROKE} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onContinue}
                className={`${BTN} ap-btn-p max-[767px]:h-12 max-[767px]:flex-1 max-[640px]:min-w-0 ${step === 0 ? "max-[640px]:col-span-full" : ""} ${FOCUS}`}
              >
                Continue
                <ArrowRight className="size-4" strokeWidth={STROKE} aria-hidden="true" />
              </button>
            )}
          </div>
          {isLast && !canSubmit ? (
            <span id="ap-submit-hint" className="sr-only">
              {missingDocs.length ? `Upload your ${missingDocsLabel}. ` : ""}
              {missing.length ? "Answer the required screening questions and tick the confirmation to submit." : "Tick the confirmation to submit."}
            </span>
          ) : null}
        </section>
      </div>
    </div>
  );
}

/** ["CV", "passport photo", "valid ID"] -> "CV, passport photo and valid ID". */
function joinWords(words: string[]): string {
  return words.length > 1 ? `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}` : (words[0] ?? "");
}

/** Layout-shaped placeholder while the mock store hydrates and the draft resolves. */
function ApplySkeleton() {
  const bar = "ap-shimmer rounded-lg";
  return (
    <div aria-busy="true" aria-label="Loading your application">
      <div className={`${bar} mb-3 h-5 w-36`} />
      <div className="grid grid-cols-1 items-start gap-5 min-[1041px]:grid-cols-[260px_minmax(0,1fr)]">
        <div className={`${CARD} hidden h-[440px] p-6 min-[1041px]:block`}>
          <div className={`${bar} h-12`} />
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`${bar} mt-4 h-8`} />
          ))}
        </div>
        <div className={`${CARD} p-6`}>
          <div className={`${bar} h-7 w-16`} />
          <div className={`${bar} mt-3 h-9 w-2/3`} />
          <div className={`${bar} mt-3 h-5 w-1/2`} />
          <div className="mt-6 grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={`${bar} h-12`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
