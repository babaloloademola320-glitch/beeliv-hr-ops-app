"use client";

import { useMemo, useState } from "react";
import { BriefcaseBusiness, Bell, Calendar, Check, Sun, Upload, Video, type LucideIcon } from "@/components/applicant/icons";
import { FilterTabs } from "@/components/applicant/FilterTabs";
import { NoticeCard } from "@/components/shared/NoticeCard";
import { EmptyState, PageHeading } from "@/components/applicant/primitives";
import { CARD, type TileTone } from "@/components/applicant/SectionCard";
import { toast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/staff/format";
import { useNotifications } from "@/lib/staff/hooks";
import { deleteNotification, markNotificationRead } from "@/lib/staff/service";
import type { Notification, NotificationEvent } from "@/lib/staff/types";
import { BookOpen, Megaphone } from "../icons";
import { PageError } from "../records/PageError";
import { NotificationsSkeleton } from "./NotificationsSkeleton";

/** Glyph + tile tone per event kind (brief section 17). Same event shape serves every Beeliv app. */
const EVENT_META: Record<NotificationEvent, { icon: LucideIcon; tone: TileTone }> = {
  "shift-updated": { icon: Calendar, tone: "v" },
  "sop-assigned": { icon: BookOpen, tone: "v" },
  "training-assigned": { icon: Video, tone: "v" },
  "leave-updated": { icon: Sun, tone: "a" },
  "document-requested": { icon: Upload, tone: "a" },
  "assignment-changed": { icon: BriefcaseBusiness, tone: "ok" },
  announcement: { icon: Megaphone, tone: "v" },
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const isToday = (iso: string) => startOfDay(new Date(iso)) === startOfDay(new Date());

export function NotificationsBody() {
  const { data, status, retry } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const items = useMemo(() => [...(data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [data]);
  if (status === "loading") return <NotificationsSkeleton />;
  if (status === "error") return <PageError title="Notifications" what="your notifications" retry={retry} />;

  const unread = items.filter((n) => !n.read);
  const list = filter === "unread" ? unread : items;
  const groups = ["Today", "Earlier"].filter((g) => list.some((n) => (isToday(n.createdAt) ? "Today" : "Earlier") === g));

  async function markAll() {
    try {
      await Promise.all(unread.map((n) => markNotificationRead(n.id)));
      toast.add({ title: "All notifications marked as read" });
    } catch {
      toast.add({ title: "We couldn't update your notifications", description: "Please try again.", type: "error" });
    }
  }

  return (
    <div>
      <PageHeading
        title="Notifications"
        right={
          unread.length > 0 ? (
            <button type="button" onClick={markAll} className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-bold text-(--ap-violet) underline underline-offset-2">
              <Check className="size-4" aria-hidden="true" /> Mark all as read
            </button>
          ) : undefined
        }
      />

      {items.length > 0 ? (
        <div className="mb-[18px]">
          <FilterTabs
            label="Filter notifications"
            value={filter}
            onChange={setFilter}
            options={[
              { key: "all", label: "All", count: items.length },
              { key: "unread", label: "Unread", count: unread.length },
            ]}
          />
        </div>
      ) : null}

      {list.length === 0 ? (
        <div className={CARD}>
          <EmptyState
            icon={Bell}
            title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
            description={filter === "unread" ? "Everything has been read. Switch to All to see earlier updates." : "Updates about your shifts, leave, documents and assignment will show up here."}
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
            <h2 id={`ng-${group}`} className={`mb-3 text-center text-[16px] font-semibold text-(--ap-muted) ${gi === 0 ? "mt-1.5" : "mt-6"}`}>
              {group}
            </h2>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {list
                .filter((n) => (isToday(n.createdAt) ? "Today" : "Earlier") === group)
                .map((n) => (
                  <NotificationRow key={n.id} n={n} />
                ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function NotificationRow({ n }: { n: Notification }) {
  const meta = EVENT_META[n.event];
  return (
    <NoticeCard
      title={n.title}
      message={n.message}
      time={timeAgo(n.createdAt)}
      dateTime={n.createdAt}
      unread={!n.read}
      attention={meta.tone === "a"}
      href={n.destination.href}
      linkLabel={n.destination.label}
      onRead={() => {
        if (!n.read) void markNotificationRead(n.id);
      }}
      onDelete={() => {
        void deleteNotification(n.id);
        toast.add({ title: "Notification deleted" });
      }}
    />
  );
}
