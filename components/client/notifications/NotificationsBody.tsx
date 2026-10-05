"use client";

import { useMemo, useState } from "react";
import { Bell, Briefcase, Check, ShieldCheck, type LucideIcon } from "@/components/applicant/icons";
import { FilterTabs } from "@/components/applicant/FilterTabs";
import { NoticeCard } from "@/components/shared/NoticeCard";
import { EmptyState, PageHeading } from "@/components/applicant/primitives";
import { CARD, type TileTone } from "@/components/applicant/SectionCard";
import { toast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/client/format";
import { useNotifications } from "@/lib/client/hooks";
import { deleteNotification, markAllNotificationsRead, markNotificationRead } from "@/lib/client/service";
import type { ClientNotification } from "@/lib/client/types";
import { ClipboardList } from "../icons";
import { PageState } from "../states";

/**
 * Client notifications, in the Staff pattern (components/staff/notifications).
 * The notification record carries only a destination, so the glyph and the
 * link label are chosen from where it leads - presentation only.
 */
function metaFor(href: string): { icon: LucideIcon; tone: TileTone; label: string } {
  if (href.startsWith("/client/recruitment")) return { icon: Briefcase, tone: "v", label: "Review candidates" };
  if (href.startsWith("/client/requests")) return { icon: ClipboardList, tone: "v", label: "View request" };
  if (href.startsWith("/client/compliance")) return { icon: ShieldCheck, tone: "a", label: "View documents" };
  return { icon: Bell, tone: "v", label: "View" };
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const isToday = (iso: string) => startOfDay(new Date(iso)) === startOfDay(new Date());
const groupOf = (n: ClientNotification) => (isToday(n.createdAt) ? "Today" : "Earlier");


export function NotificationsBody() {
  const { data, status, retry } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const items = useMemo(() => [...(data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [data]);
  const unread = items.filter((n) => !n.read);
  const list = filter === "unread" ? unread : items;
  const groups = ["Today", "Earlier"].filter((g) => list.some((n) => groupOf(n) === g));

  async function markAll() {
    try {
      await markAllNotificationsRead();
      toast.add({ title: "All notifications marked as read" });
    } catch {
      toast.add({ title: "We couldn't update your notifications", description: "Please try again.", type: "error" });
    }
  }

  return (
    <PageState status={status} title="Notifications" what="your notifications" retry={retry} layout="list" empty={<div><Heading /><CaughtUp /></div>}>
      <div>
        <Heading
          right={
            unread.length > 0 ? (
              <button type="button" onClick={markAll} className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-bold text-(--ap-violet) underline underline-offset-2">
                <Check className="size-4" aria-hidden="true" /> Mark all as read
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
              { key: "unread", label: "Unread", count: unread.length },
            ]}
          />
        </div>
        {list.length === 0 ? (
          <CaughtUp unreadView={filter === "unread"}
            action={
              filter === "unread" && items.length > 0 ? (
                <button type="button" onClick={() => setFilter("all")} className="ap-btn ap-btn-s ap-btn-sm mt-1">
                  Show all notifications
                </button>
              ) : null
            }
          />
        ) : (
          groups.map((group, gi) => (
            <section key={group} aria-labelledby={`ng-${group}`}>
              <h2 id={`ng-${group}`} className={`mb-3 text-center text-[16px] font-semibold text-(--ap-muted) ${gi === 0 ? "mt-1.5" : "mt-6"}`}>
                {group}
              </h2>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {list
                  .filter((n) => groupOf(n) === group)
                  .map((n) => (
                    <Row key={n.id} n={n} />
                  ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </PageState>
  );
}

function Heading({ right }: { right?: React.ReactNode }) {
  return <PageHeading title="Notifications" right={right} />;
}

function CaughtUp({ action, unreadView }: { action?: React.ReactNode; unreadView?: boolean }) {
  return (
    <div className={CARD}>
      <EmptyState
        icon={Bell}
        title={unreadView ? "No unread notifications" : "No notifications yet"}
        description={unreadView ? "Everything has been read. Switch to All to see earlier updates." : "Updates about candidates, workforce requests and documents will show up here."}
        action={action}
      />
    </div>
  );
}

function Row({ n }: { n: ClientNotification }) {
  const meta = metaFor(n.href);
  return (
    <NoticeCard
      title={n.title}
      message={n.message}
      time={timeAgo(n.createdAt)}
      dateTime={n.createdAt}
      unread={!n.read}
      attention={meta.tone === "a"}
      href={n.href}
      linkLabel={meta.label}
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
