"use client";

/**
 * Staff Help & support. Contacts are the ones the public site already
 * publishes plus the assignment's own Beeliv/HR contact and supervisor (from
 * the data layer). FAQ answers only point to where things live in the app -
 * they promise no policy, timeline or rule Beeliv hasn't confirmed (leave,
 * attendance and correction rules are TBD per the brief).
 */
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useId, useMemo, useState } from "react";
import { ArrowRight, Calendar, ChevronDown, Clock3, Files, LifeBuoy, Mail, MapPin, Phone, Search, Sun, type LucideIcon } from "@/components/applicant/icons";
import { PageHeading } from "@/components/applicant/primitives";
import { SectionCard } from "@/components/applicant/SectionCard";
import { CONTACT_INFO } from "@/lib/public-site/contact-content";
import { STAFF_ART } from "@/lib/staff/assets";
import { useCurrentAssignment } from "@/lib/staff/hooks";
import type { Contact } from "@/lib/staff/types";
import { ImageRoom } from "../ImageRoom";

type Faq = { q: string; a: React.ReactNode; keywords: string };

const FAQS: Faq[] = [
  {
    q: "Where can I see my shifts?",
    keywords: "schedule shift roster today week upcoming",
    a: <p>Open <Link href="/staff/schedule">Schedule</Link> for today, this week and what&apos;s coming up. If a shift changes, you&apos;ll get a notification.</p>,
  },
  {
    q: "How do I check in or out?",
    keywords: "attendance check in clock out",
    a: <p>Use the attendance card on <Link href="/staff">Home</Link> or open <Link href="/staff/attendance">Attendance</Link>. If something looks wrong on your record, contact Beeliv.</p>,
  },
  {
    q: "How do I request leave?",
    keywords: "leave holiday time off request",
    a: <p>Go to <Link href="/staff/leave">Leave</Link> and start a request. You can follow its status there.</p>,
  },
  {
    q: "Beeliv asked me for a document. Where do I upload it?",
    keywords: "documents upload certificate request replace",
    a: <p>Open <Link href="/staff/documents">Documents</Link>. Anything Beeliv needs from you is marked there.</p>,
  },
  {
    q: "Where are my SOPs and training?",
    keywords: "sop training learning assigned acknowledge",
    a: <p>Everything assigned to you is under <Link href="/staff/sops-training">SOPs &amp; Training</Link>.</p>,
  },
  {
    q: "How do I update my phone number or contact details?",
    keywords: "profile phone contact change update details",
    a: <p>You can edit your preferred name and phone in <Link href="/staff/profile">Profile</Link>. For anything marked &ldquo;Managed by Beeliv&rdquo;, contact Beeliv.</p>,
  },
  {
    q: "Is my NIN or bank information visible in the app?",
    keywords: "nin bank banking identity sensitive privacy secure",
    a: <p>No. Identity and banking details are held securely by Beeliv and aren&apos;t displayed in the app. To update them, contact Beeliv.</p>,
  },
  {
    q: "Do I need a separate login for the Staff Hub?",
    keywords: "login account password applicant sign in same",
    a: <p>No. It&apos;s the same Beeliv account you already use. Manage it in <Link href="/staff/settings">Settings</Link>.</p>,
  },
];

export function HelpBody() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(FAQS[0].q);
  const { data: assignment } = useCurrentAssignment();
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? FAQS.filter((f) => `${f.q} ${f.keywords}`.toLowerCase().includes(q)) : FAQS;
  }, [query]);

  return (
    <div>
      <PageHeading title="Help & support" subtitle="Answers to common questions, and how to reach the Beeliv team." />

      <div className="mb-5 grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 max-[640px]:grid-cols-1">
        <QuickLink href="/staff/schedule" icon={Calendar} title="Schedule" sub="Your shifts" />
        <QuickLink href="/staff/attendance" icon={Clock3} title="Attendance" sub="Check in and history" />
        <QuickLink href="/staff/leave" icon={Sun} title="Leave" sub="Requests and status" />
        <QuickLink href="/staff/documents" icon={Files} title="Documents" sub="Upload or replace a file" />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-5 max-[1240px]:grid-cols-1">
        <SectionCard id="h-faq" title="Common questions">
          <label className="ap-input mb-3 flex items-center gap-2.5 focus-within:border-(--ap-violet)">
            <Search className="size-[18px] shrink-0 text-(--ap-muted)" aria-hidden="true" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search help, e.g. leave, documents" aria-label="Search help" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
          </label>
          {shown.length ? (
            <ul className="m-0 list-none p-0">
              {shown.map((f) => (
                <FaqItem key={f.q} faq={f} open={open === f.q} onToggle={() => setOpen(open === f.q ? null : f.q)} />
              ))}
            </ul>
          ) : (
            <p className="ap-sm py-3">No answers match that. Try another word, or contact Beeliv.</p>
          )}
        </SectionCard>

        <aside className="flex min-w-0 flex-col gap-5">
          <SectionCard id="h-contact" title="Contact Beeliv" aside>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              <ContactRow href={CONTACT_INFO.phone.href} icon={Phone} label="Call us" value={CONTACT_INFO.phone.value} />
              <ContactRow href={CONTACT_INFO.email.href} icon={Mail} label="Email us" value={CONTACT_INFO.email.value} />
              <ContactRow icon={MapPin} label="Office" value={CONTACT_INFO.office.city} />
            </ul>
          </SectionCard>

          {assignment && (assignment.beelivContact || assignment.supervisor) ? (
            <SectionCard id="h-team" title="Your contacts" aside>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {assignment.beelivContact ? <PersonRow c={assignment.beelivContact} /> : null}
                {assignment.supervisor ? <PersonRow c={assignment.supervisor} /> : null}
              </ul>
            </SectionCard>
          ) : null}

          {/* Room for the "Need assistance?" photo (STAFF_ART.supportPhoto). */}
          <ImageRoom src={STAFF_ART.supportPhoto} alt="" icon={LifeBuoy} className="h-[140px] w-full rounded-[20px]" iconClassName="size-12" />
        </aside>
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, title, sub }: { href: string; icon: LucideIcon; title: string; sub: string }) {
  return (
    <Link href={href} className="ap-card ap-card-hover flex items-center gap-3.5 p-4 text-(--ap-ink)!">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-(--ap-tint) text-(--ap-violet)">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-[15px]">{title}</b>
        <span className="block text-[13px] text-(--ap-muted)">{sub}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-(--ap-violet)" aria-hidden="true" />
    </Link>
  );
}

function FaqItem({ faq, open, onToggle }: { faq: Faq; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <li className="border-t border-(--ap-line-2) first:border-t-0">
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={id} className="flex w-full items-center gap-3 py-3.5 text-left">
        <b className="flex-1 text-[15px] font-bold text-(--ap-ink)">{faq.q}</b>
        <ChevronDown className={`size-[18px] shrink-0 text-(--ap-muted) transition-transform duration-200 ${open ? "rotate-180 text-(--ap-violet)" : ""}`} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div id={id} key="a" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 38 }} style={{ overflow: "hidden" }}>
            <div className="pb-4 text-[15px] leading-[1.65] text-(--ap-ink-2) [&_a]:font-bold [&_a]:text-(--ap-violet)">{faq.a}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

function ContactRow({ href, icon: Icon, label, value }: { href?: string; icon: LucideIcon; label: string; value: string }) {
  const inner = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--ap-tint) text-(--ap-violet)">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] text-(--ap-muted)">{label}</span>
        <b className="block truncate text-[15px] text-(--ap-ink)">{value}</b>
      </span>
    </>
  );
  return (
    <li>
      {href ? (
        <a href={href} className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-(--ap-line-2)">{inner}</a>
      ) : (
        <div className="flex items-center gap-3 p-1.5">{inner}</div>
      )}
    </li>
  );
}

/** A named contact from the current assignment. Only shows the channels that exist. */
function PersonRow({ c }: { c: Contact }) {
  return (
    <li className="rounded-2xl border border-(--ap-line) p-3.5">
      <b className="ap-title block">{c.name}</b>
      <span className="ap-label block text-(--ap-muted)">{c.title}</span>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {c.email ? <a href={`mailto:${c.email}`} className="ap-sm font-bold text-(--ap-violet) wrap-anywhere">{c.email}</a> : null}
        {c.phone ? <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="ap-sm font-bold text-(--ap-violet)">{c.phone}</a> : null}
      </div>
    </li>
  );
}

