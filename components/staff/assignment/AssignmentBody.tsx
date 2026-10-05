"use client";

import Link from "next/link";
import { BriefcaseBusiness, Mail, MapPin, Phone, UserRound } from "@/components/applicant/icons";
import { Reveal } from "@/components/applicant/motion";
import { Chip, EmptyState, PageHeading } from "@/components/applicant/primitives";
import { CARD, IconTile, SectionCard } from "@/components/applicant/SectionCard";
import { useAssignmentHistory, useCurrentAssignment } from "@/lib/staff/hooks";
import type { AssignmentStatus, Contact, StaffAssignment } from "@/lib/staff/types";
import { History } from "../icons";
import { ImageRoom } from "../ImageRoom";
import { FieldGrid, PanelError, SK, fullDate } from "../schedule/parts";

/**
 * My Assignment (brief section 6). Assignment is NOT permanent profile data:
 * this page shows the current assignment plus history, so a move between
 * clients/outlets never rewrites who the person is.
 */

const STATUS: Record<AssignmentStatus, { label: string; tone: "ok" | "info" | "warn" | "mute" }> = {
  active: { label: "Active", tone: "ok" },
  upcoming: { label: "Starts soon", tone: "info" },
  paused: { label: "Paused", tone: "warn" },
  ended: { label: "Ended", tone: "mute" },
};

export function AssignmentBody() {
  const current = useCurrentAssignment();
  const history = useAssignmentHistory();

  return (
    <>
      <PageHeading title="My Assignment" subtitle="Where you're assigned, and who to contact." />
      {current.status === "loading" ? (
        <AssignmentSkeleton />
      ) : current.status === "error" ? (
        <PanelError what="your assignment" retry={current.retry} />
      ) : current.status === "empty" || !current.data ? (
        <div className={CARD}>
          <EmptyState icon={BriefcaseBusiness} title="No assignment yet" description="When Beeliv confirms where you'll work, your outlet, role and start date appear here." />
        </div>
      ) : (
        <div className="flex flex-col gap-5 min-[1241px]:grid min-[1241px]:grid-cols-[minmax(0,1fr)_380px] min-[1241px]:items-start">
          <CurrentCard a={current.data} />
          <ContactsCard a={current.data} />
        </div>
      )}

      <div className="mt-5">
        <SectionCard title="Assignment history" aside>
          {history.status === "loading" ? (
            <div className="flex flex-col gap-3" aria-busy="true">
              <div className={`${SK} h-[72px]`} />
              <div className={`${SK} h-[72px]`} />
            </div>
          ) : history.status === "error" ? (
            <EmptyState
              icon={History}
              title="We couldn't load your history"
              description="Check your connection and try again."
              action={
                <button type="button" onClick={history.retry} className="ap-btn ap-btn-p ap-btn-sm mt-1.5">
                  Try again
                </button>
              }
            />
          ) : history.status === "empty" || !history.data ? (
            <EmptyState icon={History} title="No assignment history" description="Past and upcoming assignments are listed here once Beeliv records them." />
          ) : (
            <HistoryList items={history.data} currentId={current.data?.id ?? null} />
          )}
        </SectionCard>
      </div>
    </>
  );
}

function CurrentCard({ a }: { a: StaffAssignment }) {
  const st = STATUS[a.status];
  return (
    <SectionCard title="Current assignment">
      <div className="flex flex-col gap-4 min-[768px]:flex-row min-[768px]:items-start">
        {/* Outlet photo room (imageUrl from backend, else branded placeholder) */}
        <ImageRoom src={a.outlet.imageUrl} alt={a.outlet.name} className="h-[150px] w-full shrink-0 rounded-2xl min-[768px]:w-[220px]" iconClassName="size-12" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={st.tone}>{st.label}</Chip>
            <span className="ap-label text-(--ap-muted)">{a.outlet.publicId}</span>
          </div>
          <b className="ap-serif mt-1.5 block text-[26px] leading-tight">{a.outlet.name}</b>
          <span className="ap-sm mt-1 flex items-center gap-1.5 text-(--ap-muted)">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            {a.outlet.location}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <FieldGrid
          fields={[
            ["Client", a.client.name],
            ["Outlet", a.outlet.name],
            ["Role", a.role],
            ["Department", a.department],
            ["Location", a.outlet.location],
            ["Start date", fullDate(a.startDate)],
            ["Status", st.label],
            ["End date", a.endDate ? fullDate(a.endDate) : "Ongoing"],
          ]}
          cols="min-[768px]:grid-cols-4"
        />
      </div>

      {/* Working pattern: shown from Beeliv-authored tags only - no schedule rules are inferred. */}
      {a.tags.length ? (
        <div className="mt-4">
          <div className="ap-label mb-2 text-(--ap-muted)">Working pattern</div>
          <div className="flex flex-wrap gap-2">
            {a.tags.map((t) => (
              <Chip key={t} tone="violet">{t}</Chip>
            ))}
          </div>
        </div>
      ) : null}

      {a.context ? (
        <div className="mt-4">
          <div className="ap-label mb-2 text-(--ap-muted)">About your work</div>
          <p className="ap-sm rounded-xl bg-(--ap-tint-soft) p-3 text-(--ap-ink-2)">{a.context}</p>
        </div>
      ) : null}
    </SectionCard>
  );
}

function ContactRow({ label, c }: { label: string; c: Contact | null }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-(--ap-line-2) p-3">
      <IconTile icon={UserRound} tone="v" />
      <div className="min-w-0 flex-1">
        <span className="ap-label block text-(--ap-muted)">{label}</span>
        {c ? (
          <>
            <b className="ap-title block">{c.name}</b>
            <span className="ap-label block text-(--ap-muted)">{c.title}</span>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {c.email ? (
                <a href={`mailto:${c.email}`} className="ap-hit inline-flex items-center gap-1.5 text-[13px] font-bold break-all text-(--ap-violet) hover:text-(--ap-plum)">
                  <Mail className="size-3.5 shrink-0" aria-hidden="true" /> {c.email}
                </a>
              ) : null}
              {c.phone ? (
                <a href={`tel:${c.phone}`} className="ap-hit inline-flex items-center gap-1.5 text-[13px] font-bold text-(--ap-violet) hover:text-(--ap-plum)">
                  <Phone className="size-3.5 shrink-0" aria-hidden="true" /> {c.phone}
                </a>
              ) : null}
              {!c.email && !c.phone ? <span className="ap-label text-(--ap-faint)">Contact details to be confirmed</span> : null}
            </div>
          </>
        ) : (
          <b className="ap-sm block text-(--ap-muted)">To be confirmed</b>
        )}
      </div>
    </li>
  );
}

function ContactsCard({ a }: { a: StaffAssignment }) {
  return (
    <SectionCard title="Your contacts" aside>
      <ul className="flex flex-col gap-3">
        <ContactRow label="Supervisor" c={a.supervisor} />
        <ContactRow label="Beeliv contact" c={a.beelivContact} />
      </ul>
      <Link href="/staff/help" className="ap-btn ap-btn-s ap-btn-sm mt-4">
        Get help
      </Link>
    </SectionCard>
  );
}

function HistoryList({ items, currentId }: { items: StaffAssignment[]; currentId: string | null }) {
  // Newest first by start date.
  const sorted = [...items].sort((x, y) => y.startDate.localeCompare(x.startDate));
  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((a) => {
        const st = STATUS[a.status];
        const isCurrent = a.id === currentId;
        return (
          <Reveal as="li" key={a.id} className="flex items-center gap-3 rounded-2xl border border-(--ap-line-2) p-3">
            <ImageRoom src={a.outlet.imageUrl} className="size-14 shrink-0 rounded-xl" iconClassName="size-6" />
            <div className="min-w-0 flex-1">
              <b className="ap-title block truncate">{a.outlet.name}</b>
              <span className="ap-sm block truncate text-(--ap-ink-2)">
                {a.role} - {a.department}
              </span>
              <span className="ap-label block text-(--ap-muted)">
                {fullDate(a.startDate)} to {a.endDate ? fullDate(a.endDate) : "present"}
              </span>
            </div>
            <Chip tone={isCurrent ? "ok" : st.tone}>{isCurrent ? "Current" : st.label}</Chip>
          </Reveal>
        );
      })}
    </ul>
  );
}

export function AssignmentSkeleton() {
  return (
    <div className="flex flex-col gap-5 min-[1241px]:grid min-[1241px]:grid-cols-[minmax(0,1fr)_380px]" aria-busy="true" aria-label="Loading your assignment">
      <div className={`${SK} h-[380px]`} />
      <div className={`${SK} h-[260px]`} />
    </div>
  );
}

/** Route-level loading UI (heading + skeleton). */
export function AssignmentLoading() {
  return (
    <>
      <PageHeading title="My Assignment" subtitle="Where you're assigned, and who to contact." />
      <AssignmentSkeleton />
      <div className={`${SK} mt-5 h-[200px]`} />
    </>
  );
}
