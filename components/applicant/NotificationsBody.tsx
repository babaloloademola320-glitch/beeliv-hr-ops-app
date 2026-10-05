"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bell, Check, Trash2 } from "@/components/applicant/icons";
import { toast } from "@/components/ui/toast";
import { deleteNotification, markAllNotificationsRead, markNotificationRead, useApplicantStore } from "@/lib/applicant/service";
import { formatDateShort, formatTime } from "@/lib/applicant/time";
import type { AppNotification, Interview } from "@/lib/applicant/types";
import { confirmAction } from "./ConfirmDialog";
import { EmptyState, PageHeading } from "./primitives";
import { CARD } from "./SectionCard";
import { FilterTabs } from "./FilterTabs";
import { notificationTile } from "./notification-meta";
import { Reveal } from "./motion";
import { AttentionBadge } from "./AttentionBadge";

/*
 * Glyph + tile tone per notification kind (Module 1 §8) live in
 * ./notification-meta so the Overview card matches this page exactly.
 */

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
function daysAgo(iso: string, now: number) {
  return Math.round((startOfDay(new Date(now)) - startOfDay(new Date(iso))) / 86_400_000);
}
/** Wireframe time column: "9:12 AM" today, "Yesterday", "2 days ago", then "24 Sep". */
function timeLabel(iso: string, now: number) {
  const d = daysAgo(iso, now);
  if (d <= 0) return formatTime(iso);
  if (d === 1) return "Yesterday";
  if (d === 2) return "2 days ago";
  return formatDateShort(iso);
}

/** Adds the scheduled date/time to an "Interview scheduled" notice, from the live interview record. */
function detailFor(n: AppNotification, interviews: Interview[]) {
  // Only invitations get the date appended; reminders already carry their own wording.
  const invite = n.kind ? n.kind === "interview-invitation" : n.icon === "cal";
  if (!invite || / on [A-Z][a-z]{2},/.test(n.detail)) return n.detail;
  const iv = interviews.find((i) => i.status === "scheduled" && i.scheduledAt);
  if (!iv?.scheduledAt) return n.detail;
  const wd = new Date(iv.scheduledAt).toLocaleDateString("en-US", { weekday: "short" });
  return `${n.detail.replace(/\.$/, "")} on ${wd}, ${formatDateShort(iv.scheduledAt)} at ${formatTime(iv.scheduledAt)}.`;
}

export function NotificationsBody() {
  const store = useApplicantStore();
  const items = store.notifications;
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const unreadCount = items.filter((n) => n.unread).length;
  const list = useMemo(
    () =>
      [...items]
        .filter((n) => filter === "all" || n.unread)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [items, filter],
  );
  const groupOf = (n: AppNotification) => (daysAgo(n.createdAt, now) <= 0 ? "Today" : "Earlier");
  const groups = Array.from(new Set(list.map(groupOf)));

  return (
    <div>
      <PageHeading
        title="Notifications"
        right={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                void markAllNotificationsRead();
                toast.add({ title: "All notifications marked as read" });
              }}
              className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-bold text-(--ap-violet) underline underline-offset-2"
            >
              <Check className="size-4" aria-hidden="true" />
              Mark all as read
            </button>
          ) : undefined
        }
      />

      <div className="mb-[18px]">
        <FilterTabs
          label="Filter notifications"
          value={filter}
          onChange={setFilter}
          options={[
            { key: "all", label: "All", count: items.length },
            { key: "unread", label: "Unread", count: unreadCount },
          ]}
        />
      </div>

      <div id="notif-list" role="tabpanel">
        {list.length === 0 ? (
          <div className={CARD}>
            <EmptyState
              icon={Bell}
              title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
              description={filter === "unread" ? "Everything has been read. Switch to All to see earlier updates." : "Updates about your applications, interviews and documents will show up here."}
              action={
                filter === "unread" && items.length > 0 ? (
                  <button type="button" onClick={() => setFilter("all")} className="ap-btn ap-btn-s ap-btn-sm">
                    Show all notifications
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          groups.map((group, gi) => (
            <section key={group} aria-labelledby={`ng-${group}`}>
              <h2
                id={`ng-${group}`}
                className={`mb-3 text-center text-[16px] font-semibold text-(--ap-muted) ${gi === 0 ? "mt-1.5" : "mt-6"}`}
              >
                {group}
              </h2>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {list
                  .filter((n) => groupOf(n) === group)
                  .map((n) => (
                    <NotificationRow key={n.id} n={n} detail={detailFor(n, store.interviews)} time={timeLabel(n.createdAt, now)} />
                  ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function NotificationRow({ n, detail, time }: { n: AppNotification; detail: string; time: string }) {
  const read = () => {
    if (n.unread) void markNotificationRead(n.id);
  };
  // "Needs attention" = something the applicant must do (document requests and reminders).
  const attention = notificationTile(n) === "a";
  return (
    <Reveal as="li"
      onClick={read}
      className={`relative rounded-[16px] border bg-white p-4 ${attention ? "border-(--ap-line)" : n.unread ? "cursor-pointer border-[#DCCFE6]" : "border-(--ap-line)"}`}
    >
      <div className="flex items-start gap-2.5">
        {attention ? <AttentionBadge className="mt-px size-7" /> : n.unread ? <span aria-hidden="true" className="mt-2 size-2.5 shrink-0 rounded-full bg-(--ap-violet)" /> : null}
        <b className={`block text-[18px] leading-snug ${attention ? "text-[#9B0C24]" : "text-(--ap-ink)"} ${n.unread || attention ? "" : "font-semibold"}`}>
          {n.title}
          {n.unread ? <span className="sr-only"> (unread)</span> : null}
        </b>
        <button
          type="button"
          aria-label={`Delete notification: ${n.title}`}
          onClick={async (e) => {
            e.stopPropagation();
            const ok = await confirmAction({
              tone: "danger",
              title: "Delete this notification?",
              description: `"${n.title}" will be removed from your notifications. This can't be undone.`,
              confirmLabel: "Delete",
            });
            if (!ok) return;
            void deleteNotification(n.id);
            toast.add({ title: "Notification deleted" });
          }}
          className="-mt-1.5 -mr-2 ml-auto inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[#C8102E] hover:bg-[rgba(200,16,46,.08)]"
        >
          <Trash2 className="size-[22px]" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-2 text-base leading-relaxed text-(--ap-ink-2)">{detail}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <time dateTime={n.createdAt} suppressHydrationWarning className="text-[14px] font-semibold text-(--ap-muted)">
          {time}
        </time>
        {n.link ? (
          <Link href={n.link.href} onClick={read} className={`ap-btn ap-btn-sm ${attention ? "bg-[#C8102E]! text-white! hover:bg-[#9B0C24]!" : "ap-btn-p"}`}>
            {n.link.label} <ArrowRight className="size-[15px]" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </Reveal>
  );
}
