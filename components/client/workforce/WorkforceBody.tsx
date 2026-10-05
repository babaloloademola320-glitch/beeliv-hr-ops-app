"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronRight, Search } from "@/components/applicant/icons";
import { PageHeading } from "@/components/applicant/primitives";
import { useWorkforce } from "@/lib/client/hooks";
import { plural } from "@/lib/client/format";
import { DEPARTMENT_LABEL, DEPARTMENT_ORDER, SHIFTS } from "@/lib/client/labels";
import { analyticsFamilyHref, staffHref } from "@/lib/client/links";
import { useOutletState } from "@/lib/client/outlet";
import { useUrlParams } from "@/lib/client/url-state";
import type { WorkforceMember } from "@/lib/client/types";
import { AnalyticsLink } from "../AnalyticsLink";
import { PersonPhoto } from "../PersonPhoto";
import { FILTER_ROW, FilterSelect, SearchField } from "../records-filters";
import { StatusChip } from "../StatusChip";
import { AnalyticsPanel, ChartEmptyState } from "../charts";
import { NoStaffYet, WorkforceError, WorkforceSkeleton } from "./WorkforceStates";

const PAGE = 20;
const ALL = "all";



/**
 * My Workforce (brief sections 17-18): who Beeliv has placed at the selected
 * outlet(s). One directory (table on tablet / desktop, cards on phones) with
 * search and filters, plus department chips (with counts) that filter the
 * list. Charts live on the Analytics page. Department, role, status and outlet live in the URL, so an Overview
 * link (?department=kitchen) lands on the filtered list. Nothing sensitive
 * exists in WorkforceMember, so none of it can be shown.
 */
export function WorkforceBody() {
  const { data, status, retry } = useWorkforce();
  const outlet = useOutletState();
  const url = useUrlParams();
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);

  const department = url.get("department") || ALL;
  const role = url.get("role") || ALL;
  const assignment = url.get("assignment") || ALL;
  const outletId = url.get("outlet") || ALL;
  const allOutlets = outlet.scope === "all";
  const outletName = (id: string) => outlet.outlets.find((o) => o.id === id)?.name ?? "";

  const members = useMemo(() => data ?? [], [data]);
  const roles = useMemo(() => [...new Set(members.map((m) => m.role))].sort((a, b) => a.localeCompare(b)), [members]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return members
      .filter((m) => (department === ALL || m.departmentId === department) && (role === ALL || m.role === role) && (assignment === ALL || m.assignmentStatus === assignment) && (!allOutlets || outletId === ALL || m.outletId === outletId))
      .filter((m) => !needle || m.name.toLowerCase().includes(needle) || m.staffId.toLowerCase().includes(needle) || m.role.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, q, department, role, assignment, outletId, allOutlets]);

  // Department chip counts ignore the department filter itself so every chip stays comparable.
  const chipBase = useMemo(() => members.filter((m) => (role === ALL || m.role === role) && (assignment === ALL || m.assignmentStatus === assignment) && (!allOutlets || outletId === ALL || m.outletId === outletId)), [members, role, assignment, outletId, allOutlets]);
  const analyticsHref = analyticsFamilyHref("workforce", { department: department === ALL ? undefined : department, role: role === ALL ? undefined : role });
  const filtered = q.trim() !== "" || department !== ALL || role !== ALL || assignment !== ALL || (allOutlets && outletId !== ALL);
  const setFilter = (patch: Record<string, string>) => {
    setShown(PAGE);
    url.set(Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, v === ALL ? undefined : v])));
  };
  const clear = () => {
    setQ("");
    setShown(PAGE);
    url.set({ department: undefined, role: undefined, assignment: undefined, outlet: undefined });
  };

  if (status === "loading") return <WorkforceSkeleton />;
  if (status === "error" || status === "restricted") return <WorkforceError retry={retry} />;

  const subtitle = allOutlets ? "Search and review the staff Beeliv has placed across your outlets." : "Search and review the staff Beeliv has placed at this outlet.";
  const count = filtered ? `${rows.length} of ${members.length} ${members.length === 1 ? "person" : "people"} match your filters` : `${plural(members.length, "person", "people")}${allOutlets ? " across all outlets" : " at this outlet"}`;

  return (
    <>
      <PageHeading title="My Workforce" subtitle={subtitle} />
      {status === "empty" ? (
        <NoStaffYet />
      ) : (
        <div className="flex flex-col gap-4">
          <AnalyticsLink href={analyticsHref} label="View workforce analytics" />
          <AnalyticsPanel anchor="records" title="Staff" subtitle={count}>
            <DepartmentChips members={chipBase} active={department} onPick={(d) => setFilter({ department: d })} />
            <div className="mb-4 flex flex-col gap-2.5">
              <SearchField
                value={q}
                onChange={(v) => {
                  setQ(v);
                  setShown(PAGE);
                }}
                label="Search staff"
                placeholder="Search by name, staff ID or role"
              />
              <div className={FILTER_ROW}>
                <FilterSelect label="Department" value={department} onChange={(v) => setFilter({ department: v })} options={[{ value: ALL, label: "All departments" }, ...DEPARTMENT_ORDER.map((d) => ({ value: d, label: DEPARTMENT_LABEL[d] }))]} />
                <FilterSelect label="Role" value={role} onChange={(v) => setFilter({ role: v })} options={[{ value: ALL, label: "All roles" }, ...roles.map((r) => ({ value: r, label: r }))]} />
                <FilterSelect label="Assignment status" value={assignment} onChange={(v) => setFilter({ assignment: v })} options={[{ value: ALL, label: "All statuses" }, { value: "active", label: "Active" }, { value: "ended", label: "Ended" }]} />
                {allOutlets ? <FilterSelect label="Outlet" value={outletId} onChange={(v) => setFilter({ outlet: v })} options={[{ value: ALL, label: "All outlets" }, ...outlet.outlets.map((o) => ({ value: o.id, label: o.name }))]} /> : null}
              </div>
            </div>

            {rows.length === 0 ? (
              <ChartEmptyState
                icon={Search}
                title="No staff match these filters"
                description="Try a different search, or clear the filters to see everyone."
                action={
                  <button type="button" onClick={clear} className="ap-btn ap-btn-s ap-btn-sm mt-1">
                    Clear filters
                  </button>
                }
                height={180}
              />
            ) : (
              <>
                <StaffTable rows={rows.slice(0, shown)} showOutlet={allOutlets} outletName={outletName} />
                <StaffCards rows={rows.slice(0, shown)} showOutlet={allOutlets} outletName={outletName} />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px] text-(--ap-muted)">
                  <span>
                    Showing {Math.min(shown, rows.length)} of {rows.length}
                  </span>
                  <span className="flex items-center gap-2">
                    {filtered ? (
                      <button type="button" onClick={clear} className="ap-hit font-bold text-(--ap-violet) hover:text-(--ap-violet-2)">
                        Clear filters
                      </button>
                    ) : null}
                    {rows.length > shown ? (
                      <button type="button" onClick={() => setShown((n) => n + PAGE)} className="ap-btn ap-btn-s ap-btn-sm">
                        Show more
                      </button>
                    ) : null}
                  </span>
                </div>
              </>
            )}
          </AnalyticsPanel>

        </div>
      )}
    </>
  );
}

/** Department chips with counts. Each chip filters the list (?department=); the counts follow the outlet, role and assignment filters. */
function DepartmentChips({ members, active, onPick }: { members: WorkforceMember[]; active: string; onPick: (d: string) => void }) {
  const counts = DEPARTMENT_ORDER.map((d) => ({ d, n: members.filter((m) => m.departmentId === d).length })).filter((x) => x.n > 0 || x.d === active);
  const chip = "ap-hit inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors";
  const on = "border-(--ap-violet) bg-(--ap-tint) text-(--ap-violet)";
  const off = "border-(--ap-line) text-(--ap-ink-2) hover:bg-(--ap-line-2)";
  return (
    <div role="group" aria-label="Filter by department" className="mb-3 flex flex-wrap gap-2">
      <button type="button" aria-pressed={active === ALL} onClick={() => onPick(ALL)} className={`${chip} ${active === ALL ? on : off}`}>
        All <span className="tabular-nums">{members.length}</span>
      </button>
      {counts.map(({ d, n }) => (
        <button key={d} type="button" aria-pressed={active === d} onClick={() => onPick(active === d ? ALL : d)} className={`${chip} ${active === d ? on : off}`}>
          {DEPARTMENT_LABEL[d]} <span className="tabular-nums">{n}</span>
        </button>
      ))}
    </div>
  );
}

type ListProps = { rows: WorkforceMember[]; showOutlet: boolean; outletName: (id: string) => string };

const ASSIGN_TONE = { active: "ok", ended: "mute" } as const;
const ASSIGN_LABEL = { active: "Active", ended: "Ended" } as const;

/** Tablet / desktop: table. The name is the real link; the whole row is also clickable. */
function StaffTable({ rows, showOutlet, outletName }: ListProps) {
  const router = useRouter();
  return (
    <div className="max-[767px]:hidden">
      <table className="w-full border-collapse text-left text-[14px]">
        <caption className="sr-only">Staff placed at your outlets</caption>
        <thead>
          <tr className="text-[12px] font-bold tracking-[.06em] text-(--ap-muted) uppercase">
            <th scope="col" className="pb-2 font-bold">Staff</th>
            <th scope="col" className="pb-2 font-bold">Role</th>
            <th scope="col" className="pb-2 font-bold max-[1100px]:hidden">Department</th>
            {showOutlet ? <th scope="col" className="pb-2 font-bold max-[1240px]:hidden">Outlet</th> : null}
            <th scope="col" className="pb-2 font-bold">Assignment</th>
            <th scope="col" className="w-6 pb-2">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id} onClick={() => router.push(staffHref(m.id))} className="cursor-pointer border-t border-(--ap-line-2) hover:bg-(--ap-tint-soft)">
              <td className="py-2.5 pr-3">
                <span className="flex items-center gap-2.5">
                  <PersonPhoto name={m.name} photoUrl={m.photoUrl} size={34} />
                  <span className="min-w-0 leading-tight">
                    <Link href={staffHref(m.id)} onClick={(e) => e.stopPropagation()} className="block font-semibold text-(--ap-ink) hover:text-(--ap-violet)">
                      {m.name}
                    </Link>
                    <span className="block text-[12px] text-(--ap-muted) tabular-nums">{m.staffId}</span>
                  </span>
                </span>
              </td>
              <td className="py-2.5 pr-3 text-(--ap-ink-2)">{m.role}</td>
              <td className="py-2.5 pr-3 whitespace-nowrap text-(--ap-ink-2) max-[1100px]:hidden">{DEPARTMENT_LABEL[m.departmentId]}</td>
              {showOutlet ? <td className="py-2.5 pr-3 whitespace-nowrap text-(--ap-ink-2) max-[1240px]:hidden">{outletName(m.outletId)}</td> : null}
              <td className="py-2.5 pr-3">
                <StatusChip tone={ASSIGN_TONE[m.assignmentStatus]}>{ASSIGN_LABEL[m.assignmentStatus]}</StatusChip>
              </td>
              <td className="py-2.5 text-(--ap-faint)">
                <ChevronRight className="size-4" aria-hidden="true" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Phone: one card per person (never a squeezed table). */
function StaffCards({ rows, showOutlet, outletName }: ListProps) {
  return (
    <ul aria-label="Staff" className="m-0 flex list-none flex-col p-0 min-[768px]:hidden">
      {rows.map((m) => (
        <li key={m.id} className="border-t border-(--ap-line-2) first:border-t-0">
          <Link href={staffHref(m.id)} className="flex items-center gap-3 py-3">
            <PersonPhoto name={m.name} photoUrl={m.photoUrl} size={42} />
            <span className="min-w-0 flex-1 leading-tight">
              <b className="block truncate text-[15px]">{m.name}</b>
              <span className="block truncate text-[13px] text-(--ap-muted)">
                {m.role} &middot; {DEPARTMENT_LABEL[m.departmentId]}
              </span>
              <span className="block truncate text-[12px] text-(--ap-muted)">
                {m.staffId}
                {showOutlet ? ` · ${outletName(m.outletId)}` : ` · ${SHIFTS[m.shift].label}`}
              </span>
            </span>
            <StatusChip tone={ASSIGN_TONE[m.assignmentStatus]}>{ASSIGN_LABEL[m.assignmentStatus]}</StatusChip>
            <ChevronRight className="size-4 shrink-0 text-(--ap-faint)" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
