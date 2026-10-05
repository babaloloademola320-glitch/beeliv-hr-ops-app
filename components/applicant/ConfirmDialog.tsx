"use client";

/**
 * Confirmation modal for delicate decisions (log out, pause/delete account,
 * signing out other devices, removing or replacing saved data, resetting the
 * prototype). One host is mounted in AppShell; any component calls:
 *
 *   if (await confirmAction({ tone: "danger", title: "…", confirmLabel: "Delete" })) { … }
 *
 * Phones: bottom sheet with full-width buttons (thumb reach). Tablet/desktop:
 * centred card. Esc / backdrop / Cancel all cancel; focus is trapped inside
 * and returned to the button that opened it.
 *
 * `onConfirm` runs synchronously inside the confirm click — use it when the
 * follow-up needs the user's click (e.g. opening a file picker, which browsers
 * block from a later promise callback). If it returns a promise, the button
 * shows a working state until it settles.
 */
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CircleAlert, ShieldCheck, Trash2, type LucideIcon } from "@/components/applicant/icons";
import { newsreader } from "./fonts";
import { SPRING, SwipeSheet, useIsClient, useIsPhone } from "./motion";
import { AnimatePresence, motion } from "motion/react";

export type ConfirmTone = "danger" | "caution" | "neutral";

export type ConfirmOptions = {
  tone?: ConfirmTone;
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  /** "What happens" list, shown in a soft box. */
  points?: string[];
  confirmLabel: string;
  cancelLabel?: string;
  /** Require typing this exact word (e.g. "DELETE") before confirming. */
  typeToConfirm?: string;
  /** Require ticking this acknowledgement before confirming. */
  acknowledge?: string;
  onConfirm?: () => void | Promise<void>;
};

type Request = ConfirmOptions & { resolve: (ok: boolean) => void };

let current: Request | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Opens the confirmation modal; resolves true when confirmed, false when cancelled. */
export function confirmAction(opts: ConfirmOptions): Promise<boolean> {
  current?.resolve(false);
  return new Promise((resolve) => {
    current = { ...opts, resolve };
    emit();
  });
}

function close(ok: boolean) {
  const r = current;
  current = null;
  emit();
  r?.resolve(ok);
}

const TONE: Record<ConfirmTone, { tile: string; dot: string; box: string; btn: string; icon: LucideIcon }> = {
  danger: {
    tile: "bg-(--ap-rose-bg) text-(--ap-rose)",
    dot: "bg-(--ap-rose)",
    box: "bg-[#fff1f2] border-[#fecdd3]",
    btn: "bg-[#dc2626] text-white hover:bg-[#b91c1c] focus-visible:shadow-[0_0_0_3px_rgba(220,38,38,.25)]",
    icon: Trash2,
  },
  caution: {
    tile: "bg-(--ap-warn-bg) text-(--ap-warn)",
    dot: "bg-[#f59e0b]",
    box: "bg-[#fffbeb] border-[#fde68a]",
    btn: "ap-btn-p",
    icon: CircleAlert,
  },
  neutral: {
    tile: "bg-(--ap-tint) text-(--ap-violet)",
    dot: "bg-(--ap-violet)",
    box: "bg-[#fbf8fd] border-(--ap-line)",
    btn: "ap-btn-p",
    icon: ShieldCheck,
  },
};

export function ConfirmHost() {
  const req = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => null,
  );
  const isClient = useIsClient();
  if (!isClient) return null;
  // AnimatePresence lets it slide/pop out; the key remounts per request so
  // typed text / checkbox never carry over.
  return createPortal(<AnimatePresence>{req ? <Dialog key={req.title + req.confirmLabel} req={req} /> : null}</AnimatePresence>, document.body);
}

function Dialog({ req }: { req: Request }) {
  const tone = TONE[req.tone ?? "neutral"];
  const isPhone = useIsPhone();
  const Icon = req.icon ?? tone.icon;
  const [typed, setTyped] = useState("");
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const firstFocus = useRef<HTMLElement>(null);
  const titleId = useId();
  const descId = useId();
  const inputId = useId();

  const ready = (!req.typeToConfirm || typed.trim() === req.typeToConfirm) && (!req.acknowledge || ack) && !busy;

  // Focus in, lock scroll, restore focus on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstFocus.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      opener?.focus?.();
    };
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape" && !busy) {
      e.preventDefault();
      close(false);
    }
    if (e.key !== "Tab" || !panel.current) return;
    const f = [...panel.current.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled)")];
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function confirm() {
    if (!ready) return;
    const out = req.onConfirm?.();
    if (out && typeof (out as Promise<void>).then === "function") {
      setBusy(true);
      (out as Promise<void>).then(
        () => close(true),
        () => setBusy(false),
      );
    } else close(true);
  }

  const content = (
    <div ref={panel}>
        <span className={`mb-4 flex size-12 items-center justify-center rounded-[14px] ${tone.tile}`}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <h2 id={titleId} className="ap-serif text-[26px] leading-[1.15] text-(--ap-ink)">
          {req.title}
        </h2>
        {req.description ? (
          <p id={descId} className="mt-2 text-[15px] leading-[1.6] text-(--ap-muted)">
            {req.description}
          </p>
        ) : null}

        {req.points?.length ? (
          <ul className={`mt-4 flex flex-col gap-2 rounded-[14px] border px-4 py-3.5 ${tone.box}`}>
            {req.points.map((p) => (
              <li key={p} className="flex gap-2.5 text-sm leading-[1.5] text-(--ap-ink-2)">
                <span className={`mt-[7px] size-1.5 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
        ) : null}

        {req.acknowledge ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={ack}
            onClick={() => setAck((v) => !v)}
            ref={req.typeToConfirm ? undefined : (el) => void (firstFocus.current = el)}
            className="mt-4 flex w-full items-start gap-3 rounded-xl text-left text-sm leading-[1.5] text-(--ap-ink-2)"
          >
            <span
              className={`mt-px flex size-5 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors ${
                ack ? "border-(--ap-violet) bg-(--ap-violet) text-white" : "border-[#cfc8d8] bg-white"
              }`}
              aria-hidden="true"
            >
              {ack ? (
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5 9-10" />
                </svg>
              ) : null}
            </span>
            {req.acknowledge}
          </button>
        ) : null}

        {req.typeToConfirm ? (
          <div className="mt-4 flex flex-col gap-1.5">
            <label htmlFor={inputId} className="text-sm font-semibold text-(--ap-ink-2)">
              Type <b className="font-bold tracking-[.04em] text-(--ap-rose)">{req.typeToConfirm}</b> to confirm
            </label>
            <input
              id={inputId}
              ref={(el) => void (firstFocus.current = el)}
              className="ap-input"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirm()}
            />
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2.5 min-[768px]:flex-row min-[768px]:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => close(false)}
            ref={req.typeToConfirm || req.acknowledge ? undefined : (el) => void (firstFocus.current = el)}
            className="ap-btn ap-btn-s h-12 w-full text-[15px] font-semibold min-[768px]:h-11 min-[768px]:w-auto"
          >
            {req.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={confirm}
            className={`ap-btn h-12 w-full text-[15px] font-semibold min-[768px]:h-11 min-[768px]:w-auto ${tone.btn}`}
          >
            {busy ? (
              <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
            ) : null}
            {busy ? "Working…" : req.confirmLabel}
          </button>
        </div>
    </div>
  );

  return (
    <motion.div
      className={`applicant-shell ${newsreader.variable} fixed inset-0 z-[130] flex items-end justify-center min-[768px]:items-center min-[768px]:p-6`}
      style={{ background: "rgba(17,17,27,.5)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) close(false);
      }}
      onKeyDown={onKeyDown}
    >
      {isPhone ? (
        // Phones: bottom sheet — swipe the handle down to cancel.
        <SwipeSheet
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={req.description ? descId : undefined}
          onClose={() => !busy && close(false)}
          className="px-5 pb-[calc(20px+env(safe-area-inset-bottom))]"
        >
          <div className="pt-4">{content}</div>
        </SwipeSheet>
      ) : (
        <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={req.description ? descId : undefined}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={SPRING}
          className="w-[460px] rounded-[22px] bg-white p-7 shadow-[0_30px_80px_rgba(17,17,27,.28)]"
        >
          {content}
        </motion.div>
      )}
    </motion.div>
  );
}
