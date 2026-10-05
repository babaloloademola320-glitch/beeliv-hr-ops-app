"use client";

import { useState } from "react";
import { Bell, Mail, MessageSquareText, type LucideIcon } from "@/components/applicant/icons";
import { toast } from "@/components/ui/toast";
import { setJobAlert, useJobAlert, type AlertChannel, type AlertFreq } from "./alert-store";

const CHANNELS: [AlertChannel, LucideIcon][] = [
  ["Email", Mail],
  ["WhatsApp", MessageSquareText],
  ["In-app", Bell],
];
const FREQS: AlertFreq[] = ["Instant", "Daily", "Weekly"];

function Criteria({ items, className = "my-3.5" }: { items: string[]; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {items.map((c) => (
        <span key={c} className="inline-flex h-7 items-center rounded-lg border border-(--ap-line) bg-white px-2.5 text-[13px] font-semibold text-(--ap-ink-2)">
          {c}
        </span>
      ))}
    </div>
  );
}

/**
 * Wireframe jobAlert() (.jalert2): three states - off (Create alert), edit
 * (criteria + frequency segmented control + channel picks) and on (criteria,
 * live stats, delivery line, Edit alert + switch).
 */
export function JobAlertCard({
  criteria,
  matchCount,
  newThisWeek,
  className = "",
}: {
  criteria: string[];
  matchCount: number;
  newThisWeek: number;
  className?: string;
}) {
  const alert = useJobAlert();
  const [edit, setEdit] = useState(false);
  const btn = "mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[11px] border text-[15px] font-semibold transition-colors";

  return (
    <section
      aria-label="Job alerts"
      className={`relative overflow-hidden rounded-[20px] border border-[#E6D6F0] bg-[linear-gradient(160deg,#fff_0,#FBF6FD_100%)] p-5 shadow-[0_10px_30px_-14px_rgba(91,8,123,.35)] before:pointer-events-none before:absolute before:-top-10 before:-right-10 before:size-[140px] before:rounded-full before:bg-[radial-gradient(circle,rgba(201,164,92,.22),transparent_70%)] before:content-[''] ${className}`}
    >
      <div className="relative flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-[linear-gradient(145deg,var(--ap-violet-2),var(--ap-violet))] text-white shadow-[0_6px_16px_-6px_rgba(91,8,123,.6)]">
          <Bell className="size-[21px]" strokeWidth={1.6} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 leading-[1.3]">
          <b className="block text-base font-bold">Job alerts</b>
          <span className="text-[13px] text-(--ap-muted)">{alert.on ? `On · ${alert.freq.toLowerCase()}` : "Get new roles before others"}</span>
        </div>
        {alert.on ? (
          <button
            type="button"
            role="switch"
            aria-checked="true"
            aria-label="Turn job alert off"
            onClick={() => {
              setJobAlert({ ...alert, on: false });
              setEdit(false);
              toast.add({ title: "Job alert turned off" });
            }}
            className="ap-switch before:absolute before:-inset-x-1 before:-inset-y-2 before:content-['']"
          />
        ) : null}
      </div>

      {!alert.on ? (
        <>
          <p className="ap-bd mt-3.5 mb-3 text-(--ap-ink-2)">
            Save this search and we&apos;ll tell you the moment a matching role opens.
          </p>
          <Criteria items={criteria} />
          <button
            type="button"
            onClick={() => {
              setJobAlert({ ...alert, on: true });
              setEdit(true);
            }}
            className={`${btn} border-transparent bg-(--ap-violet) text-white hover:bg-(--ap-plum)`}
          >
            <Bell className="size-[18px]" strokeWidth={1.6} aria-hidden="true" />
            Create alert
          </button>
        </>
      ) : edit ? (
        <>
          <div className="relative mt-3.5">
            <span className="block text-[13px] font-semibold text-(--ap-ink-2)">Alert me about</span>
            <Criteria items={criteria} className="mt-2 mb-1" />
            <span className="text-[13px] text-(--ap-faint)">Change the filters to update this alert.</span>
          </div>
          <div className="relative mt-3.5">
            <span className="block text-[13px] font-semibold text-(--ap-ink-2)">How often</span>
            <div className="ap-seg mt-2 flex w-full" role="group" aria-label="How often">
              {FREQS.map((f) => (
                <button key={f} type="button" aria-pressed={alert.freq === f} onClick={() => setJobAlert({ ...alert, freq: f })} className="min-w-0 flex-1">
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="relative mt-3.5">
            <span className="block text-[13px] font-semibold text-(--ap-ink-2)">Send to</span>
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Send to">
              {CHANNELS.map(([c, Icon]) => {
                const on = alert.ch.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      // Wireframe: at least one channel always stays selected.
                      if (on && alert.ch.length === 1) return;
                      setJobAlert({ ...alert, ch: on ? alert.ch.filter((x) => x !== c) : [...alert.ch, c] });
                    }}
                    className="ap-pick"
                  >
                    {on ? <Icon className="size-3.5" strokeWidth={1.6} aria-hidden="true" /> : null}
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEdit(false);
              toast.add({
                title: `Alert saved. We'll send new matches ${alert.freq === "Instant" ? "as they open" : alert.freq.toLowerCase()}.`,
                type: "success",
              });
            }}
            className={`${btn} border-transparent bg-(--ap-violet) text-white hover:bg-(--ap-plum)`}
          >
            Save alert
          </button>
        </>
      ) : (
        <>
          <Criteria items={criteria} />
          <div className="relative mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-(--ap-line-2) bg-white px-3 py-2.5">
              <b className="block text-xl font-bold tracking-[-0.01em] text-(--ap-violet) tabular-nums">{matchCount}</b>
              <span className="text-[13px] text-(--ap-muted)">role{matchCount === 1 ? "" : "s"} match now</span>
            </div>
            <div className="rounded-xl border border-(--ap-line-2) bg-white px-3 py-2.5">
              <b className="block text-xl font-bold tracking-[-0.01em] text-(--ap-violet) tabular-nums">{newThisWeek}</b>
              <span className="text-[13px] text-(--ap-muted)">new this week</span>
            </div>
          </div>
          <div className="mb-3.5 flex items-center gap-[7px] text-[13px] text-(--ap-muted)">
            <Mail className="size-[15px] shrink-0" strokeWidth={1.6} aria-hidden="true" />
            Sent by {alert.ch.join(", ")} · {alert.freq}
          </div>
          <button
            type="button"
            onClick={() => setEdit(true)}
            className={`${btn} border-[#DCCFE6] bg-white text-(--ap-violet) hover:border-(--ap-violet)`}
          >
            Edit alert
          </button>
        </>
      )}
    </section>
  );
}
