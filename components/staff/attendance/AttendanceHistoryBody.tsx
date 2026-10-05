"use client";

import { CircleAlert } from "@/components/applicant/icons";
import { EmptyState, PageHeading } from "@/components/applicant/primitives";
import { CARD } from "@/components/applicant/SectionCard";
import { useAttendanceHistory } from "@/lib/staff/hooks";
import { History } from "../icons";
import { BackCrumb, SK } from "../schedule/parts";
import { HistoryList } from "./AttendanceBody";

/** Full attendance history: month and status filters, counts and every record. Phones reach it from the Attendance page. */
export function AttendanceHistoryBody() {
  const history = useAttendanceHistory();
  return (
    <div>
      <BackCrumb href="/staff/attendance">Attendance</BackCrumb>
      <PageHeading title="Attendance history" subtitle="Every check-in and check-out, by month." />
      <div className={`${CARD} p-4 min-[768px]:p-6`}>
        {history.status === "loading" ? (
          <div className={`${SK} h-[320px]`} aria-busy="true" aria-label="Loading attendance history" />
        ) : history.status === "error" ? (
          <EmptyState
            icon={CircleAlert}
            title="We couldn't load your history"
            description="Check your connection and try again."
            action={
              <button type="button" onClick={history.retry} className="ap-btn ap-btn-p ap-btn-sm mt-1.5">
                Try again
              </button>
            }
          />
        ) : history.status === "empty" || !history.data ? (
          <EmptyState icon={History} title="No attendance records yet" description="Your check-ins and check-outs are listed here after your first shift." />
        ) : (
          <HistoryList records={history.data} />
        )}
      </div>
    </div>
  );
}
