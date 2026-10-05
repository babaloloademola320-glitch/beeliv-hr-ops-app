/**
 * Job alert preferences (wireframe `st.alert`: {on, edit, freq, ch}).
 * Frontend-only placeholder, persisted to localStorage like the rest of the
 * applicant mock state. No alert is actually delivered: sending email /
 * WhatsApp alerts is backend work, not built here.
 */
import { useEffect, useSyncExternalStore } from "react";

export type AlertFreq = "Instant" | "Daily" | "Weekly";
export type AlertChannel = "Email" | "WhatsApp" | "In-app";
export type JobAlert = { on: boolean; freq: AlertFreq; ch: AlertChannel[] };

const KEY = "beeliv-applicant-job-alert-v1";
// Wireframe default: alert on, daily, Email + WhatsApp.
const DEFAULT: JobAlert = { on: true, freq: "Daily", ch: ["Email", "WhatsApp"] };

let state: JobAlert = DEFAULT;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<JobAlert>;
      state = {
        on: typeof p.on === "boolean" ? p.on : DEFAULT.on,
        freq: p.freq === "Instant" || p.freq === "Weekly" || p.freq === "Daily" ? p.freq : DEFAULT.freq,
        ch: Array.isArray(p.ch) && p.ch.length ? (p.ch.filter((c) => ["Email", "WhatsApp", "In-app"].includes(c)) as AlertChannel[]) : DEFAULT.ch,
      };
      emit();
    }
  } catch {
    // Unavailable/corrupt storage - keep the default.
  }
}

export function useJobAlert(): JobAlert {
  const snap = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => DEFAULT,
  );
  useEffect(hydrate, []);
  return snap;
}

export function setJobAlert(next: JobAlert) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Keep in memory only.
  }
  emit();
}
