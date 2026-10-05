"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ChevronLeft, FileText } from "@/components/applicant/icons";
import { confirmAction } from "@/components/applicant/ConfirmDialog";
import { Chip, DETAIL_TITLE, EmptyState, ProgressBar } from "@/components/applicant/primitives";
import { CARD, SectionCard } from "@/components/applicant/SectionCard";
import { toast } from "@/components/ui/toast";
import { dayMonth, dueLabel } from "@/lib/staff/format";
import { useSOPs, useTraining } from "@/lib/staff/hooks";
import { acknowledgeSOP, completeSOP, completeTraining, startTraining } from "@/lib/staff/service";
import { BookOpen, CircleCheck } from "../icons";
import { ImageRoom } from "../ImageRoom";
import { PageError, SK } from "../leave/states";
import { byPriority, toEntries, type LearningEntry } from "./learning";
import { SopReader } from "./SopReader";

const BACK = "ap-hit inline-flex items-center gap-1.5 text-[13px] font-bold text-(--ap-violet) hover:text-(--ap-plum)";

export function SopDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <h1 className="sr-only">SOPs & Training</h1>
      <div className={`${SK} mb-4 h-5 w-40`} />
      <div className={`${SK} h-[150px]`} />
      <div className="mt-5 grid grid-cols-1 gap-5 min-[1241px]:grid-cols-[minmax(0,1fr)_340px]">
        <div className={`${SK} h-[300px]`} />
        <div className={`${SK} h-[220px]`} />
      </div>
    </div>
  );
}

/** One SOP or training assignment: purpose, content room, progress and its action. */
export function SopDetailBody({ id }: { id: string }) {
  const sops = useSOPs();
  const training = useTraining();

  if (sops.status === "loading" || training.status === "loading") return <SopDetailSkeleton />;
  const back = (
    <Link href="/staff/sops-training" className={`${BACK} mb-4 mt-3`}>
      <ChevronLeft className="size-4" aria-hidden="true" /> SOPs &amp; Training
    </Link>
  );
  if (sops.status === "error" || training.status === "error") {
    return (
      <>
        <h1 className="sr-only">SOPs &amp; Training</h1>
        {back}
        <PageError what="this item" retry={() => { sops.retry(); training.retry(); }} />
      </>
    );
  }

  const entries = toEntries(sops.data ?? [], training.data ?? []);
  const entry = entries.find((e) => e.id === id);
  if (!entry) {
    return (
      <>
        <h1 className="sr-only">SOPs &amp; Training</h1>
        {back}
        <div className={CARD}>
          <EmptyState icon={BookOpen} title="We can't find that item" description="It may have been archived or reassigned. Go back to see what is assigned to you." action={<Link href="/staff/sops-training" className="ap-btn ap-btn-s ap-btn-sm mt-1.5">Back to list</Link>} />
        </div>
      </>
    );
  }

  // SOPs open in the stepped reader; training keeps the simple detail below.
  const assignment = entry.kind === "sop" ? sops.data?.find((s) => s.id === id) : undefined;
  if (assignment) {
    const next = entries.filter((e) => e.kind === "sop" && e.status !== "completed" && e.id !== id).sort(byPriority)[0] ?? null;
    return <SopReader key={id} a={assignment} next={next} />;
  }

  const statusChip = entry.status === "completed" ? <Chip tone="ok">Completed</Chip> : entry.status === "in-progress" ? <Chip tone="info">In progress</Chip> : <Chip tone="violet">Assigned</Chip>;
  const facts: [string, string][] = [
    ["Category", entry.category],
    [entry.kind === "sop" ? "Version" : "Format", entry.meta],
    ...(entry.department ? ([["Department", entry.department]] as [string, string][]) : []),
    ["Assigned", dayMonth(entry.assignedAt) + " " + entry.assignedAt.slice(0, 4)],
  ];

  return (
    <>
      {back}
      <header className={`${CARD} mb-5`}>
        <div className="mb-3 flex flex-wrap gap-2">
          <Chip tone="violet">{entry.kind === "sop" ? "SOP" : "Training"}</Chip>
          {statusChip}
          {entry.required ? <Chip tone="warn">Required</Chip> : null}
        </div>
        <h1 className={DETAIL_TITLE}>{entry.title}</h1>
        <dl className="mt-4 grid grid-cols-2 gap-3 min-[768px]:grid-cols-4">
          {facts.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="ap-label text-(--ap-muted)">{k}</dt>
              <dd className="ap-sm mt-1 rounded-xl border border-(--ap-line) bg-(--ap-tint-soft) px-3 py-2 font-semibold break-words text-(--ap-ink)">{v}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="flex flex-col gap-5 min-[1241px]:grid min-[1241px]:grid-cols-[minmax(0,1fr)_340px] min-[1241px]:items-start">
        <div className="flex min-w-0 flex-col gap-5 max-[1240px]:order-2">
          <SectionCard title="Purpose">
            <p className="ap-bd">{entry.description}</p>
          </SectionCard>
          <SectionCard title="Content">
            {/* Room for the published document / video: the backend supplies no content yet. */}
            <ImageRoom src={null} icon={FileText} className="h-[160px] w-full rounded-2xl" iconClassName="size-10" />
            <p className="ap-sm mt-3 text-(--ap-muted)">The full {entry.kind === "sop" ? "SOP document" : "training material"} opens here once Beeliv publishes it.</p>
          </SectionCard>
        </div>
        <ActionCard entry={entry} className="max-[1240px]:order-1" />
      </div>
    </>
  );
}

/** Progress plus the one action that fits the item's state. Whether it is allowed is the backend's call. */
function ActionCard({ entry, className }: { entry: LearningEntry; className: string }) {
  const [busy, setBusy] = useState(false);
  const done = entry.status === "completed";

  async function run(work: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await work();
      toast.add({ title: success, type: "success" });
    } catch {
      toast.add({ title: "We couldn't save that", description: "Please try again.", type: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function acknowledge() {
    const ok = await confirmAction({
      tone: "neutral",
      title: `Acknowledge "${entry.title}"?`,
      description: "Your acknowledgement is recorded against your Beeliv account.",
      acknowledge: "I have read and understood this SOP.",
      confirmLabel: "Acknowledge",
    });
    if (ok) await run(() => acknowledgeSOP(entry.id), "SOP acknowledged");
  }

  async function complete() {
    const ok = await confirmAction({ tone: "neutral", title: `Mark "${entry.title}" as complete?`, confirmLabel: "Mark complete" });
    if (ok) await run(() => completeTraining(entry.id), "Training completed");
  }

  return (
    <SectionCard title="Your progress" aside className={`min-w-0 ${className}`}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="ap-label text-(--ap-muted)">{entry.dueDate && !done ? dueLabel(entry.dueDate) : entry.dueDate ? "Completed" : "No due date"}</span>
        <span className="ap-label text-(--ap-muted)">{entry.progress}%</span>
      </div>
      <ProgressBar percent={entry.progress} label={`${entry.title} progress`} />
      <div className="mt-5">
        {done ? (
          <p className="ap-sm flex items-center gap-2 font-semibold text-(--ap-ok)">
            <CircleCheck className="size-5" aria-hidden="true" />
            {entry.kind === "sop" && entry.acknowledged ? "Acknowledged and complete" : "Complete"}
          </p>
        ) : entry.kind === "sop" ? (
          entry.requiresAcknowledgement ? (
            <ActionButton busy={busy} onClick={acknowledge}>Acknowledge SOP</ActionButton>
          ) : (
            <ActionButton busy={busy} onClick={() => run(() => completeSOP(entry.id), "Marked as read")}>Mark as read</ActionButton>
          )
        ) : entry.status === "assigned" ? (
          <ActionButton busy={busy} onClick={() => run(() => startTraining(entry.id), "Training started")}>Start training</ActionButton>
        ) : (
          <ActionButton busy={busy} onClick={complete}>Mark as complete</ActionButton>
        )}
      </div>
    </SectionCard>
  );
}

function ActionButton({ busy, onClick, children }: { busy: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" disabled={busy} onClick={onClick} className="ap-btn ap-btn-p h-12 w-full">
      {busy ? <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> : null}
      {busy ? "Saving..." : children}
      {busy ? null : <ArrowRight className="size-4" aria-hidden="true" />}
    </button>
  );
}
