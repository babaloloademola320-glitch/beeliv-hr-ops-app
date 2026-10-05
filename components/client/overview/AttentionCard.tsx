import Link from "next/link";
import { Check, ChevronRight, CircleAlert, Exclaim, FileText, UsersRound } from "@/components/applicant/icons";
import type { LucideIcon } from "@/components/applicant/icons";
import { IconTile, type TileTone } from "@/components/applicant/SectionCard";
import type { AttentionItem, AttentionKind } from "@/lib/client/types";
import { ClipboardList } from "../icons";
import { AnalyticsPanel, ChartEmptyState } from "../charts";

const KIND: Record<AttentionKind, { icon: LucideIcon; tone: TileTone }> = {
  candidates: { icon: UsersRound, tone: "v" },
  documents: { icon: FileText, tone: "a" },
  request: { icon: ClipboardList, tone: "v" },
  absence: { icon: CircleAlert, tone: "r" },
};

/**
 * "Requires your attention" (brief section 14): only things THIS client can
 * act on (feedback on candidates, documents, request updates, absences), each
 * one a link to where the action happens. Beeliv-internal HR tasks never
 * appear here. Items arrive from the backend's ClientOverview.attention.
 */
export function AttentionCard({ items, className = "" }: { items: AttentionItem[]; className?: string }) {
  return (
    <AnalyticsPanel title="Requires your attention" className={className}>
      {items.length === 0 ? (
        <ChartEmptyState icon={Check} title="You're all caught up" description="Nothing needs your attention right now. We'll show it here the moment it does." height={150} />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {items.map((it) => {
            const k = KIND[it.kind];
            return (
              <li key={it.id}>
                <Link href={it.href} className="flex items-center gap-3 rounded-xl border border-(--ap-line-2) bg-(--ap-tint-soft) px-3 py-2.5 hover:border-(--ap-tint-2)">
                  <IconTile icon={it.kind === "absence" || it.kind === "documents" ? Exclaim : k.icon} tone={k.tone} className={`size-10 rounded-xl ${it.kind === "absence" || it.kind === "documents" ? "bg-[#C8102E]! text-white!" : ""}`} iconClassName="size-[19px]" />
                  <span className="min-w-0 flex-1 leading-tight">
                    <b className="block text-[14.5px] text-(--ap-ink)">{it.title}</b>
                    {it.detail ? <span className="mt-0.5 block truncate text-[13px] text-(--ap-muted)">{it.detail}</span> : null}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-(--ap-faint)" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AnalyticsPanel>
  );
}
