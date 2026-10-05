"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Calendar,
  Check,
  ChevronRight,
  Clock3,
  FileCheck2,
  FolderOpen,
  Layers,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  Video,
} from "@/components/applicant/icons";
import { toast } from "@/components/ui/toast";
import { toggleSavedJob, useSavedJobs } from "@/lib/applicant/saved";
import type { ApplicantJob as Job } from "@/lib/applicant/jobs";
import { heroImage, personaNames, useAvatarState } from "@/lib/applicant/avatar";
import { computeProfileCompleteness, useApplicantStore } from "@/lib/applicant/service";
import { describeApplicationStatus } from "@/lib/applicant/status";
import { formatDate, formatDueLabel, formatTime, weekdayName } from "@/lib/applicant/time";
import { APPLICATION_STAGES, type ApplicantDocument, type Interview } from "@/lib/applicant/types";
import { CountUp } from "./CountUp";
import { StaffTransitionBanner } from "./StaffTransitionBanner";
import { CompanyLogo, Chip, JobCover, SectionHeading, EmptyState } from "./primitives";
import { HeroDeco } from "./HeroDeco";
import { RelativeTime } from "./RelativeTime";
import { documentIcon, documentStatus } from "./document-meta";
import { notificationIcon, notificationTile } from "./notification-meta";
import { TILE_TONE, type TileTone } from "./SectionCard";
import { Reveal, Unveil } from "./motion";
import { AttentionBadge } from "./AttentionBadge";

/** Quick-link icon containers: very pale, so the colour says the category without shouting. */
const STAT_TONE: Record<string, string> = {
  // Soft tints (about 8-15%) with darker icons; bright red is kept for urgency dots only.
  violet: "bg-[#F1E4F6] text-[#70008A]",
  rose: "bg-[#FBE9EF] text-[#A8325E]",
  amber: "bg-[#FDF0D5] text-[#9A6400]",
  champagne: "bg-[#F6EDD2] text-[#8A6A12]",
};

export function OverviewBody({ jobs }: { jobs: Job[] }) {
  const store = useApplicantStore();
  const { profile, applications, interviews, documents, notifications } = store;
  const completeness = computeProfileCompleteness(profile, documents);
  const profileDone = completeness.percent >= 100;

  const submitted = applications.filter((a) => a.lifecycle !== "draft");
  const drafts = applications.filter((a) => a.lifecycle === "draft");
  // "Current application": the submitted one that most needs attention (has a next action), else the most recently updated.
  const current =
    submitted.find((a) => a.next) ??
    [...submitted].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] ??
    null;
  const recentApplications = [...submitted].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3);
  const upcomingInterview = interviews.find((v) => v.status === "scheduled") ?? null;
  const unread = notifications.filter((n) => n.unread).length;
  const pendingDocs = documents.filter((d) => d.category === "pre-employment" && d.status === "action-required").length;
  const { gender } = useAvatarState();
  const who = personaNames(gender);
  // Actions the applicant owes (excludes "attend interview", which is shown separately).
  const actionsDue = submitted.filter((a) => a.next && a.next.href !== "/applicant/interviews").length;
  const nextSteps: { label: string; href: string; icon: typeof Upload }[] = [
    ...documents
      .filter((d) => d.category === "pre-employment" && d.status === "action-required")
      .map((d) => ({ label: `Upload ${d.name.charAt(0).toLowerCase()}${d.name.slice(1)}`, href: "/applicant/documents", icon: Upload })),
    ...completeness.missing.map((m) => ({ label: m, href: "/applicant/profile", icon: UserRound })),
  ].slice(0, 3);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning," : hour < 17 ? "Good afternoon," : "Good evening,";

  const nextDue =
    current?.next?.href === "/applicant/documents"
      ? (documents
          .filter((d) => d.forApplicationId === current.id && d.status === "action-required" && d.due)
          .map((d) => d.due as string)
          .sort()[0] ?? null)
      : null;
  const pendingDue = documents
    .filter((d) => d.status === "action-required" && d.due)
    .map((d) => d.due as string)
    .sort()[0];
  const saved = useSavedJobs();
  const recommended = jobs.filter((j) => !j.closed).slice(0, 3);
  function onSave(jobId: string) {
    const now = toggleSavedJob(jobId);
    toast.add({ title: now ? "Saved to your jobs" : "Removed from saved jobs" });
  }

  const stats = [
    {
      icon: Layers,
      tone: "violet",
      value: applications.length,
      label: "Applications",
      short: "Apps",
      href: "/applicant/applications",
      sub: applications.length ? `${submitted.filter((a) => a.lifecycle === "submitted").length} active · ${drafts.length} draft` : "Start your first",
    },
    {
      icon: Calendar,
      tone: "rose",
      value: interviews.filter((v) => v.status === "scheduled").length,
      label: "Interview scheduled",
      short: "Interview",
      href: "/applicant/interviews",
      sub: upcomingInterview?.scheduledAt
        ? `${new Date(upcomingInterview.scheduledAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).replace("Sept", "Sep")} · ${new Date(upcomingInterview.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
        : "None yet",
    },
    {
      icon: FileCheck2,
      tone: "amber",
      value: pendingDocs,
      label: "Documents pending",
      short: "Docs",
      href: "/applicant/documents",
      sub: pendingDocs ? (pendingDue ? `Due ${new Date(pendingDue).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).replace("Sept", "Sep")}` : "Action required") : applications.length ? "All sent" : "Nothing needed",
    },
    {
      icon: Bell,
      tone: "champagne",
      value: unread,
      label: "New notifications",
      short: "Alerts",
      href: "/applicant/notifications",
      sub: unread ? `${notifications.filter((n) => n.unread && n.link).length} need action` : "All caught up",
    },
  ] as const;

  const careerCard = (
    <>
          {/* Career profile: what is done and what is left, with one clear button. */}
          <Reveal as="section" className="ap-card p-5.5 min-[768px]:max-[1240px]:col-span-2">
            <SectionHeading title="Career profile" moreHref="/applicant/profile" moreLabel="Open" />
            <div className="mb-3 flex items-center justify-between text-sm">
              <b className="text-(--ap-violet)">{completeness.percent}% complete</b>
            </div>
            <span className="mb-4 block h-2 overflow-hidden rounded-full bg-(--ap-line)" aria-hidden="true">
              <i className="block h-full rounded-full bg-[linear-gradient(90deg,#70008A,#A21CC0)]" style={{ width: `${Math.max(4, completeness.percent)}%` }} />
            </span>
            <ul className="mb-4 flex flex-col gap-2.5">
              {completeness.items.map((it) => (
                <li key={it.label} className="flex items-center gap-2.5 text-[14px]">
                  <span className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 ${it.done ? "border-(--ap-violet) bg-(--ap-violet) text-white" : "border-(--ap-line) bg-white"}`}>
                    {it.done ? <Check className="size-2.5" strokeWidth={3} /> : null}
                  </span>
                  <span className={it.done ? "text-(--ap-ink)" : "text-(--ap-muted)"}>{it.label}</span>
                </li>
              ))}
            </ul>
            {completeness.percent < 100 ? (
              <Link href="/applicant/profile" className="ap-btn ap-btn-p w-full">
                Complete profile <ArrowRight className="size-4" />
              </Link>
            ) : null}
          </Reveal>

    </>
  );
  const stepsCard = (
    <>
          {/* Next step suggestions: quiet list built from real gaps (pending documents first, then profile items). */}
          {nextSteps.length ? (
            <Reveal as="section" className="ap-card p-5.5 min-[768px]:max-[1240px]:col-span-2">
              <SectionHeading title="Next step suggestions" />
              <ul className="flex flex-col">
                {nextSteps.map((n, i) => (
                  <li key={n.label} className={i > 0 ? "border-t border-(--ap-line-2)" : ""}>
                    <Link href={n.href} className="group flex items-center gap-3 py-3 text-(--ap-ink)!">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-[#F5EAF8] text-[#70008A]">
                        <n.icon className="size-[17px]" />
                      </span>
                      <span className="min-w-0 flex-1 text-base font-semibold">{n.label}</span>
                      <ChevronRight className="size-4 shrink-0 text-[#96909A] group-hover:text-[#70008A]" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}

          

    </>
  );

  return (
    <div className="flex flex-col gap-5 min-[768px]:gap-6">
      {/* Hero — wireframe hero(): DECO background, cut3d disc + ring, profile card. The cutout is
          sized to the hero's own height so it always stays inside the rounded frame (desktop + mobile). */}
      <Reveal as="section" className="relative isolate grid grid-cols-[minmax(0,1fr)_118px] items-end gap-x-2 overflow-hidden rounded-[22px] border border-[#EFE6F3] bg-[linear-gradient(100deg,#FFFFFF,#F7F0FA_55%,#F1E7F6)] px-4 pt-4 min-[641px]:grid-cols-[minmax(0,1fr)_170px] min-[768px]:grid-cols-[minmax(0,1fr)_250px] min-[768px]:gap-x-5 min-[768px]:rounded-3xl min-[768px]:px-6 min-[768px]:pt-2 min-[1241px]:grid-cols-[minmax(0,1fr)_280px_minmax(300px,360px)] min-[1241px]:pr-[22px] min-[1241px]:pl-[26px] min-[1241px]:pt-0">
        <HeroDeco />

        <div className="relative z-[2] self-center pb-5 min-[768px]:py-6.5">
          <div className="ap-eb mb-2">{greeting}</div>
          <h1 className="ap-serif -mt-0.5 text-[46px] leading-[0.95] text-(--ap-ink) max-[767px]:text-[36px] min-[768px]:text-[54px]">
            {applications.length ? `${who.first}.` : profile.preferredName ? `${profile.preferredName}.` : `${who.first}.`}
          </h1>
          <p className="mt-2.5 max-w-[34ch] text-[16px] leading-[1.65] text-(--ap-ink-2) min-[768px]:text-[17px]">
            {applications.length === 0 ? (
              "Let's find your first role. Applying takes about 10 minutes."
            ) : actionsDue || upcomingInterview ? (
              <>
                You have{" "}
                {actionsDue ? (
                  <b className="font-semibold text-(--ap-violet)">
                    {actionsDue} action{actionsDue === 1 ? "" : "s"} due this week
                  </b>
                ) : null}
                {actionsDue && upcomingInterview?.scheduledAt ? " and an " : upcomingInterview?.scheduledAt ? "an " : null}
                {upcomingInterview?.scheduledAt ? (
                  <b className="font-semibold text-(--ap-violet)">interview on {weekdayName(upcomingInterview.scheduledAt)}</b>
                ) : null}
                .
              </>
            ) : (
              "You're all caught up — nothing needs your attention right now."
            )}
          </p>
        </div>

        <div className="relative z-[1] col-start-2 row-start-1 min-h-[168px] self-stretch min-[768px]:min-h-[236px]">
          <div className="absolute inset-x-0 top-2 bottom-0">
            <div className="absolute bottom-0 left-1/2 h-full w-max -translate-x-1/2 max-[767px]:[mask-image:linear-gradient(to_right,transparent_0,#000_22%)]">
              <span className="absolute bottom-[-18%] left-1/2 z-0 aspect-square w-[84%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_38%,#FFFFFF_0,#F6EEFA_42%,#E6D2F0_68%,rgba(230,210,240,0)_70%)]" />
              <span className="absolute bottom-[-6%] left-1/2 z-[1] aspect-square w-[98%] -translate-x-1/2 rounded-full border-[1.5px] border-[rgba(138,10,163,.14)]" />
              <Unveil className="relative z-[2] h-full">
                <Image
                  src={heroImage(gender)}
                  alt="Beeliv hospitality professional holding a tablet"
                  width={560}
                  height={640}
                  priority
                  className="ap-float h-full w-auto max-w-none drop-shadow-[0_22px_22px_rgba(37,0,68,.26)]"
                />
              </Unveil>
            </div>
          </div>
        </div>

        {/* Dark action card, same treatment as the Staff Home attendance card. */}
        <div className="ap-dark-card relative z-[3] col-span-full mb-4 self-center rounded-[18px] p-4 shadow-(--ap-shadow) min-[768px]:mb-5 min-[768px]:p-5 min-[1241px]:col-span-1 min-[1241px]:col-start-3 min-[1241px]:row-start-1 min-[1241px]:mb-0">
          <div className="flex items-start gap-3">
            {/* Progress ring (design reference): gold arc = percent complete. */}
            <span className="relative flex size-[52px] shrink-0 items-center justify-center" aria-hidden="true">
              <svg viewBox="0 0 52 52" className="absolute inset-0 size-full -rotate-90">
                <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="4" />
                <circle cx="26" cy="26" r="22" fill="none" stroke="#f4d58d" strokeWidth="4" strokeLinecap="round" pathLength={100} strokeDasharray={`${completeness.percent} 100`} />
              </svg>
              {profileDone ? <Check className="size-6 text-[#f4d58d]" strokeWidth={2.6} /> : <UserRound className="size-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-bold tracking-[.14em] text-white/62 uppercase">{profileDone ? "Profile" : "Profile completion"}</div>
              <b className="block text-[19px] leading-tight">
                {profileDone ? (
                  "Profile complete"
                ) : (
                  <>
                    <CountUp value={completeness.percent} />% complete
                  </>
                )}
              </b>
              <p className="ap-sm mt-0.5 text-white/78 max-[767px]:hidden">
                {profileDone ? "Everything is in place. Keep your availability and documents up to date." : completeness.summary}
              </p>
            </div>
          </div>
          {profileDone ? null : <span
            className="mt-3.5 block h-1.5 overflow-hidden rounded-full bg-white/18"
            role="progressbar"
            aria-label="Profile completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completeness.percent}
          >
            <i className="ap-fill block h-full rounded-full bg-[#f4d58d]" style={{ width: `${Math.max(4, completeness.percent)}%` }} />
          </span>}
          <Link href="/applicant/profile" className="ap-btn ap-btn-bright mt-3.5 h-12 w-full">
            {profileDone ? "View profile" : applications.length === 0 ? "Set up profile" : "Finish profile"} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </Reveal>

      {/* Applicant → staff transition (offer, onboarding, Staff Hub) */}
      <StaffTransitionBanner />

      {/* Summary tiles, directly under the hero like the Staff Home "today" row. */}
      <Reveal as="section" className="grid grid-cols-2 gap-3 min-[768px]:grid-cols-4 min-[768px]:gap-4" aria-label="Summary">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            // Quiet navigation tile: white, hairline lavender border, no shadow; on hover the border turns violet and it lifts 1px.
            className="group flex min-w-0 items-center gap-3 rounded-[18px] border border-[rgba(83,25,95,.12)] bg-white p-3.5 text-left text-(--ap-ink)! transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-px hover:border-[rgba(112,0,138,.4)] hover:shadow-[0_6px_18px_rgba(70,0,90,.07)] min-[768px]:p-4 max-[420px]:flex-col max-[420px]:items-start max-[420px]:gap-2 min-[768px]:max-[1100px]:flex-col min-[768px]:max-[1100px]:items-start"
          >
            <span className={`relative flex size-11 shrink-0 items-center justify-center rounded-[14px] ${STAT_TONE[s.tone]}`}>
              <s.icon className="size-5" />
              {s.tone !== "violet" && s.value > 0 ? <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-[#E5484D]" aria-hidden="true" /> : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="ap-label block text-(--ap-muted)">{s.label}</span>
              <b className="ap-title block tabular-nums">
                <CountUp value={s.value} />
              </b>
              <span className="ap-label block text-(--ap-muted)">{s.sub}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-[#96909A] transition-colors group-hover:text-[#70008A] max-[420px]:hidden min-[768px]:max-[1100px]:hidden" aria-hidden="true" />
          </Link>
        ))}
      </Reveal>

      {/* Mobile quick actions (wireframe .qa, phones only) */}
      <div className="ap-scrollbar-none -mx-[18px] px-[18px] max-[380px]:-mx-3.5 max-[380px]:px-3.5 flex gap-2 overflow-x-auto pb-1 min-[768px]:hidden" role="group" aria-label="Quick actions">
        {(applications.length
          ? [
              { icon: Upload, label: "Upload document", href: "/applicant/documents" },
              { icon: Video, label: "Interview", href: "/applicant/interviews" },
              { icon: Search, label: "Find jobs", href: "/applicant/jobs" },
              { icon: FolderOpen, label: "Documents", href: "/applicant/documents" },
            ]
          : [
              { icon: Search, label: "Find jobs", href: "/applicant/jobs" },
              { icon: UserRound, label: "Complete profile", href: "/applicant/profile" },
            ]
        ).map((q) => (
          <Link
            key={q.label}
            href={q.href}
            // Same chip as the Staff Home quick actions (project lead): brand tint fill, brand text + icon.
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-(--ap-tint-2) bg-(--ap-tint) px-3.5 text-sm font-bold text-(--ap-violet)! [&_svg]:text-(--ap-violet)"
          >
            <q.icon className="size-[17px]" />
            {q.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 min-[768px]:gap-5 min-[1241px]:grid-cols-[minmax(0,1fr)_420px] min-[1241px]:items-start min-[1600px]:grid-cols-[minmax(0,1fr)_460px]">
        <div className="flex min-w-0 flex-col gap-4 min-[768px]:gap-5">
          {/* Next action: its own dark card (design reference), folder art on the left, round arrow on the right. */}
          {current?.next ? (
            <Reveal as="section" className="relative overflow-hidden rounded-[22px] bg-[linear-gradient(105deg,#2A0B47,#53125F_55%,#70008A)] shadow-[0_14px_34px_rgba(42,11,71,.22)]" aria-label="Next action">
              <Link href={current.next.href} className="group flex items-center gap-3 p-4 text-white! min-[768px]:gap-5 min-[768px]:p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/applicant/next-action-folder.webp" alt="" aria-hidden="true" className="pointer-events-none h-[84px] w-auto shrink-0 min-[768px]:h-[132px]" />
                <span className="min-w-0 flex-1">
                  <small className="flex flex-wrap items-center gap-2 text-[12px] font-bold tracking-[.12em] text-[#E3CC8F] uppercase">
                    Next action
                    {nextDue ? (
                      <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-white/15 px-2 text-xs font-bold tracking-normal text-white normal-case">
                        <Clock3 className="size-3" />
                        {formatDueLabel(nextDue)}
                      </span>
                    ) : null}
                  </small>
                  <b className="mt-1 block text-[18px] leading-tight text-white min-[768px]:text-[24px]">{current.next.label}</b>
                  <span className="mt-1 block text-[13px] leading-snug text-white/80 max-[767px]:hidden min-[768px]:text-[14px]">
                    {current.next.href === "/applicant/documents" ? "Required to move you to approval. Takes about 2 minutes." : current.next.detail}
                  </span>
                </span>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-(--ap-violet) shadow-[0_4px_12px_rgba(0,0,0,.2)] transition-transform duration-200 group-hover:translate-x-0.5 min-[768px]:size-12" aria-label={current.next.ctaLabel}>
                  <ArrowRight className="size-5" />
                </span>
              </Link>
            </Reveal>
          ) : null}

          {/* Phones: interview card sits in the main column (wireframe m-only ivCard) */}
          <div className="min-[768px]:hidden">
            <InterviewCard interview={upcomingInterview} />
          </div>

          {/* Recommended opportunities (wireframe jobMini) */}
          <Reveal as="section" className="ap-card p-4 min-[768px]:p-5.5">
            <SectionHeading title="Recommended opportunities" moreHref="/applicant/jobs" moreLabel="View all jobs" />
            {/* Same card as the public home page's job section (components/public/JobsTeaser.tsx):
                cover photo + white bookmark, bold role, company, pill chips, "View Role →". */}
            <div className="ap-scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 min-[641px]:mx-0 min-[641px]:grid min-[641px]:grid-cols-2 min-[641px]:gap-4 min-[641px]:overflow-visible min-[641px]:px-0 min-[641px]:pb-0 min-[900px]:grid-cols-3 min-[641px]:max-[899px]:[&>*:nth-child(3)]:hidden">
              {recommended.map((job) => {
                const isSaved = saved.includes(job.id);
                return (
                  <article
                    key={job.id}
                    className="flex flex-[0_0_78%] snap-start flex-col overflow-hidden rounded-[18px] border border-(--ap-line) bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(37,0,68,.10)] min-[641px]:flex-none"
                  >
                    <div className="relative">
                      <JobCover image={job.image} department={job.department} className="h-[150px] w-full" />
                      <button
                        type="button"
                        onClick={() => onSave(job.id)}
                        aria-pressed={isSaved}
                        aria-label={`${isSaved ? "Unsave" : "Save"} ${job.role}`}
                        className={`absolute top-2.5 right-2.5 flex size-9 items-center justify-center rounded-[10px] bg-white shadow-[0_2px_8px_rgba(17,17,27,.12)] ${isSaved ? "text-(--ap-violet) [&_path]:fill-current" : "text-(--ap-ink)"}`}
                      >
                        <Bookmark key={isSaved ? "on" : "off"} className={`size-[18px] ${isSaved ? "ap-bump" : ""}`} strokeWidth={1.7} />
                      </button>
                    </div>
                    <div className="flex grow flex-col gap-2 p-[18px] pb-5">
                      <Link href={`/applicant/jobs/${job.id}`} className="text-[18px] leading-[1.25] font-bold text-(--ap-ink)!">
                        {job.role}
                      </Link>
                      <span className="text-sm text-(--ap-muted)">{job.company}</span>
                      {job.match ? (
                        <span className={`inline-flex h-6 w-max items-center gap-1 rounded-full px-2 text-xs font-bold ${job.match === "Strong match" ? "bg-(--ap-ok-bg) text-(--ap-ok)" : "bg-(--ap-tint) text-(--ap-violet)"}`}>
                          <Sparkles className="size-3" />
                          {job.match}
                        </span>
                      ) : null}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(91,8,123,.06)] px-2.5 py-1 text-xs text-(--ap-muted)">
                          <MapPin className="size-[13px]" strokeWidth={1.7} />
                          {job.location}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(91,8,123,.06)] px-2.5 py-1 text-xs text-(--ap-muted)">
                          <Clock3 className="size-[13px]" strokeWidth={1.7} />
                          {job.employmentType}
                        </span>
                      </div>
                      <Link
                        href={`/applicant/jobs/${job.id}`}
                        className="mt-auto w-max border-b border-current pt-2.5 pb-[3px] text-[15px] font-bold text-(--ap-violet)!"
                      >
                        View Role →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </Reveal>

          {/* Your applications: one journey row per application (design reference). Dots are the 8 locked recruitment stages. */}
          <Reveal as="section" className="ap-card p-4 min-[768px]:p-5.5">
            <SectionHeading title="Your applications" moreHref={recentApplications.length ? "/applicant/applications" : undefined} moreLabel="View all applications" />
            <p className="ap-sm -mt-1 mb-4">Track the progress of all your job applications in one place.</p>
            {recentApplications.length === 0 ? (
              <EmptyState
                icon={BriefcaseBusiness}
                title="No applications yet"
                description="Find a role that matches your experience and start your application. Your progress saves as you go."
                action={
                  <Link href="/applicant/jobs" className="ap-btn ap-btn-p ap-btn-sm mt-1.5">
                    Browse jobs <ArrowRight className="size-4" />
                  </Link>
                }
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {recentApplications.map((a) => {
                  const { label, tone } = describeApplicationStatus(a);
                  const due = a.id === current?.id && nextDue ? formatDueLabel(nextDue) : null;
                  return (
                    <li key={a.id} className="rounded-[16px] border border-(--ap-line) bg-white p-3.5 min-[768px]:p-4">
                      <div className="flex flex-wrap items-start gap-3">
                        <CompanyLogo name={a.company} size={48} />
                        <div className="min-w-0 flex-1">
                          <b className="block text-[16px]">{a.company}</b>
                          <span className="ap-sm block">{a.role}</span>
                          <span className="ap-sm flex items-center gap-1">
                            <MapPin className="size-[13px]" strokeWidth={1.7} />
                            {a.location}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1 max-[420px]:w-full max-[420px]:flex-row max-[420px]:items-center max-[420px]:justify-between">
                          <Chip tone={tone} icon={Clock3}>
                            {label}
                          </Chip>
                          <span className="ap-label text-(--ap-muted)">{due ?? (a.submittedAt ? `Applied ${formatDate(a.submittedAt)}` : "")}</span>
                        </div>
                      </div>

                      {/* Journey: filled = done, ringed = current, grey = ahead. */}
                      <ol className="mt-4 flex items-center" aria-label={`Stage ${a.stage + 1} of ${APPLICATION_STAGES.length}: ${APPLICATION_STAGES[a.stage]}`}>
                        {APPLICATION_STAGES.map((st, i) => (
                          <li key={st} className="flex flex-1 items-center last:flex-none" title={st}>
                            <span
                              className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                                i < a.stage
                                  ? "border-(--ap-violet) bg-(--ap-violet) text-white"
                                  : i === a.stage
                                    ? "border-(--ap-violet) bg-white shadow-[0_0_0_4px_rgba(112,0,138,.14)]"
                                    : "border-(--ap-line) bg-white"
                              }`}
                            >
                              {i < a.stage ? <Check className="size-2.5" strokeWidth={3} /> : i === a.stage ? <i className="size-1.5 rounded-full bg-(--ap-violet)" /> : null}
                            </span>
                            {i < APPLICATION_STAGES.length - 1 ? <span className={`h-0.5 flex-1 ${i < a.stage ? "bg-(--ap-violet)" : "bg-(--ap-line)"}`} /> : null}
                          </li>
                        ))}
                      </ol>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="ap-sm">
                          Stage {a.stage + 1} of {APPLICATION_STAGES.length} · <b className="text-(--ap-violet)">{APPLICATION_STAGES[a.stage]}</b>
                        </span>
                        <Link href={`/applicant/applications/${a.id}`} className="ap-btn ap-btn-p ap-btn-sm">
                          View <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Reveal>

          {/* New applicants have no applications yet, so the next-steps card moves here to keep the two columns even. */}
          {applications.length === 0 ? <div className="hidden flex-col gap-4 min-[768px]:flex min-[768px]:gap-5">{stepsCard}</div> : null}
        </div>

        {/* Aside (tablet/desktop) */}
        <div className="hidden gap-5 min-[768px]:grid min-[768px]:grid-cols-2 min-[1241px]:flex min-[1241px]:flex-col">
          <InterviewCard interview={upcomingInterview} />

          {careerCard}
          {applications.length === 0 ? null : stepsCard}
          <Reveal as="section" className="ap-card p-5.5 min-[768px]:max-[1240px]:col-span-2">
            <SectionHeading title="Recent notifications" moreHref="/applicant/notifications" />
            {notifications.length === 0 ? (
              <EmptyState icon={Bell} title="No notifications yet" description="Updates about your applications, interviews and documents will show up here." />
            ) : (
              <div className="flex flex-col">
                {notifications.slice(0, applications.length === 0 ? 3 : 2).map((n, i) => {
                  const Icon = notificationIcon(n);
                  return (
                    <div key={n.id} className={`flex gap-3 py-3 ${i > 0 ? "border-t border-(--ap-line-2)" : "pt-0"}`}>
                      {notificationTile(n) === "a" ? (
                        <AttentionBadge className="mt-1 size-8" />
                      ) : (
                        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${NOTIF_TONE[notificationTile(n)]}`}>
                          <Icon className="size-[18px]" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1 leading-[1.4]">
                        <b className="block text-base">{n.title}</b>
                        <span className="text-sm text-(--ap-muted)">{n.detail}</span>
                      </div>
                      <RelativeTime iso={n.createdAt} className="shrink-0 text-[13px] whitespace-nowrap text-(--ap-faint)" />
                    </div>
                  );
                })}
              </div>
            )}
          </Reveal>

          {/* Job alert: the working alert is set up on the Jobs page. Illustration is desktop only (project lead). */}
          <Reveal as="section" className="relative overflow-hidden rounded-[20px] border border-[#E6D6F0] bg-[linear-gradient(160deg,#FBF6FD,#F3E8F8)] p-5.5 min-[768px]:max-[1240px]:col-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/applicant/job-alert-illustration.webp" alt="" aria-hidden="true" className="pointer-events-none absolute -right-4 -bottom-3 hidden h-[130px] w-auto min-[1101px]:block" />
            <div className="relative min-[1101px]:max-w-[62%]">
              <b className="block text-[18px]">Set job alerts</b>
              <p className="ap-sm mt-1 mb-3.5">Be the first to know when new roles match your preferences.</p>
              <Link href="/applicant/jobs" className="ap-btn ap-btn-p ap-btn-sm">
                Create job alert <ArrowRight className="size-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Phones: documents card after the grid (wireframe) */}
      <div className="min-[768px]:hidden">
        <DocumentsCard documents={documents} />
      </div>
    </div>
  );
}

/** Per-kind glyph/tone come from ./notification-meta (same as the Notifications page); this maps its tile tone to the round badge colours. */
const NOTIF_TONE: Record<TileTone, string> = TILE_TONE;

/** Wireframe ivCard(): "Interview with <company>" / "<role> position". */
function InterviewCard({ interview }: { interview: Interview | null }) {
  const [role, company] = (interview?.applicationLabel ?? "").split(" · ");
  return (
    <Reveal as="section" className="ap-card p-4 min-[768px]:p-5.5">
      <SectionHeading title="Upcoming interview" moreHref={interview ? "/applicant/interviews" : undefined} />
      {interview?.scheduledAt ? (
        <div className="rounded-[14px] border border-(--ap-line) p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-(--ap-tint) text-(--ap-violet)">
              <Calendar className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <b className="block text-base">Interview with {company || "Beeliv"}</b>
              <span className="text-[13px] text-(--ap-muted)">{role} position</span>
            </div>
            <Chip tone="violet">
              <RelativeTime iso={interview.scheduledAt} mode="future" />
            </Chip>
          </div>
          <dl className="mt-3.5 mb-3.5 grid grid-cols-[70px_minmax(0,1fr)] gap-x-3 gap-y-2 border-t border-(--ap-line-2) pt-3.5 text-sm">
            <dt className="text-(--ap-muted)">Date</dt>
            <dd className="font-semibold">
              {new Date(interview.scheduledAt).toLocaleDateString("en-GB", { weekday: "short" })}, {formatDate(interview.scheduledAt)}
            </dd>
            <dt className="text-(--ap-muted)">Time</dt>
            <dd className="font-semibold">{formatTime(interview.scheduledAt)} (WAT)</dd>
            <dt className="text-(--ap-muted)">Mode</dt>
            <dd className="font-semibold">{/google meet/i.test(interview.mode ?? "") ? "Virtual (Google Meet)" : interview.mode}</dd>
          </dl>
          <Link href="/applicant/interviews" className="ap-btn ap-btn-l w-full">
            <Video className="size-4" />
            Join interview
          </Link>
        </div>
      ) : (
        <EmptyState icon={Calendar} title="Nothing scheduled" description="When an interview is scheduled, you'll find the date, time and link here." />
      )}
    </Reveal>
  );
}

/** Wireframe docsCard(): the outstanding request first, then the verified/pending ID documents. */
function DocumentsCard({ documents }: { documents: ApplicantDocument[] }) {
  const rows = [
    ...documents.filter((d) => d.category === "pre-employment" && d.status === "action-required").slice(0, 1),
    ...documents.filter((d) => d.category === "application" && d.name !== "CV"),
  ].slice(0, 4);
  return (
    <Reveal as="section" className="ap-card p-4 min-[768px]:p-5.5">
      <SectionHeading title="Required documents" moreHref={rows.length ? "/applicant/documents" : undefined} />
      {rows.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No documents yet" description="Documents you add to an application appear here. You only upload each one once." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((d) => {
            const ok = d.status === "verified";
            const Icon = documentIcon(d);
            const status = documentStatus(d);
            return (
              <Link key={d.id} href="/applicant/documents" className="flex items-center gap-3 rounded-xl border border-(--ap-line) bg-white px-3.5 py-3 text-(--ap-ink)! hover:border-[#DCCFE6]">
                <Icon className="size-5 text-(--ap-ink-2)" />
                <b className="flex-1 text-sm font-semibold">{d.name}</b>
                <Chip tone={status.tone} icon={ok ? ShieldCheck : Clock3}>
                  {status.label}
                </Chip>
                <ChevronRight className="size-[18px] text-(--ap-faint)" />
              </Link>
            );
          })}
        </div>
      )}
    </Reveal>
  );
}
