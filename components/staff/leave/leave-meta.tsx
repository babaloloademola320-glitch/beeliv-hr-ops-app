import type { ReactNode } from "react";
import { Chip } from "@/components/applicant/primitives";
import { dayMonth, longDate } from "@/lib/staff/format";
import type { LeaveRequest, LeaveStatus } from "@/lib/staff/types";

/** Same status chips Home's Leave card uses, so status language matches everywhere. */
const CHIPS: Record<LeaveStatus, ReactNode> = {
  approved: <Chip tone="ok">Approved</Chip>,
  pending: <Chip tone="warn">Pending</Chip>,
  rejected: <span className="ap-chip bg-(--ap-rose-bg) text-(--ap-rose)">Rejected</span>,
  cancelled: <Chip tone="mute">Cancelled</Chip>,
};
export const LeaveStatusChip = ({ status }: { status: LeaveStatus }) => <>{CHIPS[status]}</>;

export function rangeLabel(l: Pick<LeaveRequest, "startDate" | "endDate">): string {
  return l.startDate === l.endDate ? longDate(l.startDate) : `${dayMonth(l.startDate)} - ${dayMonth(l.endDate)}`;
}

/**
 * DEV FIXTURE - leave types must come from backend configuration after Beeliv
 * confirms them (brief section 9: "do not hard-code ... leave entitlement").
 * These labels only let the form work now; replace with a service call
 * (e.g. getLeaveTypes()) when the backend adapter exists.
 */
export const LEAVE_TYPE_OPTIONS: string[] = ["Annual leave", "Personal leave", "Sick leave", "Other"];
