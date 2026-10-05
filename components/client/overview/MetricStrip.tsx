import Link from "next/link";
import { Exclaim, Clock3, DoorOpen, Check, UsersRound } from "@/components/applicant/icons";
import type { LucideIcon } from "@/components/applicant/icons";
import { Reveal } from "@/components/applicant/motion";
import { formatPercent, share } from "@/lib/client/format";
import { attendanceHref, workforceHref } from "@/lib/client/links";
import type { ClientOverview } from "@/lib/client/types";

type Tile = { key: string; icon: LucideIcon; tint: string; label: string; value: number; sub: string; href: string };

/**
 * The five headline numbers (brief section 9). Compact, one calm row: no
 * oversized colour blocks, no trend arrows, no growth percentages. Every
 * figure comes from ClientOverview.metrics (one fixture source) and is a link
 * into the underlying records. Percentages are simple shares of "scheduled".
 */
export function MetricStrip({ ov }: { ov: ClientOverview }) {
  const m = ov.metrics;
  const of = (n: number) => (m.scheduled ? `${formatPercent(share(n, m.scheduled))} of scheduled` : "No one scheduled");
  const tiles: Tile[] = [
    { key: "active", icon: UsersRound, tint: "bg-(--ap-violet) text-white", label: "Active staff", value: m.activeStaff, sub: ov.scope === "all" ? "Across all outlets" : "At this outlet", href: workforceHref() },
    { key: "present", icon: Check, tint: "bg-[#15803D] text-white", label: "Present", value: m.present, sub: m.scheduled ? `${formatPercent(m.attendanceRate)} attendance rate` : "No one scheduled", href: attendanceHref({ status: "present", date: "today" }) },
    { key: "late", icon: Clock3, tint: "bg-[#C98A00] text-white", label: "Late", value: m.late, sub: of(m.late), href: attendanceHref({ status: "late", date: "today" }) },
    { key: "absent", icon: Exclaim, tint: "bg-[#C8102E] text-white", label: "Absent", value: m.absent, sub: of(m.absent), href: attendanceHref({ status: "absent", date: "today" }) },
    { key: "leave", icon: DoorOpen, tint: "bg-[#2563EB] text-white", label: "On leave", value: m.onLeave, sub: of(m.onLeave), href: attendanceHref({ status: "on-leave", date: "today" }) },
  ];
  return (
    <Reveal as="section" aria-label="Today at a glance" className="grid grid-cols-6 gap-2.5 min-[768px]:grid-cols-5 min-[768px]:gap-3.5">
      {tiles.map((t, i) => (
        <Link
          key={t.key}
          href={t.href}
          className={`ap-card ap-card-hover flex min-w-0 flex-col gap-2.5 rounded-2xl p-3.5 min-[768px]:flex-row min-[768px]:items-center min-[768px]:gap-3 min-[768px]:p-4 ${i < 3 ? "col-span-2" : "col-span-3"} min-[768px]:col-span-1`}
        >
          <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-full ${t.tint}`}>
            <t.icon className="size-[19px]" />
          </span>
          <span className="min-w-0 leading-tight">
            <b className="block text-[26px] font-bold tracking-tight text-(--ap-ink) tabular-nums min-[768px]:text-[28px]">{t.value}</b>
            <span className="block text-[14px] font-semibold text-(--ap-ink-2)">{t.label}</span>
            <span className="mt-0.5 block text-[12px] text-(--ap-muted) max-[767px]:hidden">{t.sub}</span>
          </span>
        </Link>
      ))}
    </Reveal>
  );
}
