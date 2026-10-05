"use client";

/**
 * Mobile filters bottom sheet (Jobs-Filters-Mobile.dc.html). Real open/close:
 * portalled to <body> so it can inert the entire rest of the page (header,
 * hero, results) the same way SiteHeader's MobileMenu does - Esc, Tab loop,
 * scroll lock, focus return to the trigger. Sticky footer with a live result
 * count, same "Clear all" / primary action pairing as the wireframe.
 */
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { CloseIcon } from "../icons";
import { DUR, EASE } from "../motion";
import { JOBS_FILTERS_UI } from "@/lib/public-site/jobs-content";
import { EMPTY_FILTERS, type JobFilters } from "@/lib/public-site/jobs-filters";
import { FiltersPanel } from "./FiltersPanel";

export function FilterSheet({
  open,
  onClose,
  filters,
  onChange,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  filters: JobFilters;
  onChange: (next: JobFilters) => void;
  resultCount: number;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });

    // Inert every other top-level element in <body> so keyboard and
    // screen-reader navigation cannot leave the sheet (mirrors SiteHeader's
    // MobileMenu; portalled here so it reaches page-level siblings, not just
    // the sheet's own subtree).
    const panel = panelRef.current;
    const host = panel?.closest<HTMLElement>('[data-jb-sheet-root]');
    const inerted: HTMLElement[] = [];
    if (host) {
      for (const el of Array.from(document.body.children)) {
        if (el !== host && el instanceof HTMLElement && !el.inert) {
          el.inert = true;
          inerted.push(el);
        }
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), select:not([disabled]), input:not([disabled])",
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      for (const el of inerted) el.inert = false;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  // Server render (and the very first client render before hydration takes
  // over) has no `document`; the guard is a plain render check, not effect
  // state, so there is no extra client-only render pass to flash through.
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div data-jb-sheet-root className="fixed inset-0 z-[70] wf-d:hidden">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-[rgba(17,17,27,.45)]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.fast, ease: EASE }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-[24px] bg-white"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: DUR.fast, ease: EASE }}
          >
            <div className="mx-auto mt-2.5 h-[5px] w-11 shrink-0 rounded-full bg-(--soft-border)" />
            <div className="flex shrink-0 justify-end px-3 pt-1">
              <button
                ref={closeRef}
                type="button"
                aria-label="Close filters"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center border-0 bg-transparent"
              >
                <CloseIcon size={22} strokeWidth={1.7} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 pb-[120px]">
              <FiltersPanel filters={filters} onChange={onChange} showKeyword idPrefix="fm" />
            </div>
            <div className="absolute inset-x-0 bottom-0 grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-3 border-t border-(--soft-border) bg-white px-5 pt-3.5 pb-5">
              <button
                type="button"
                onClick={() => onChange(EMPTY_FILTERS)}
                className="ps-btn ps-bo bg-white"
              >
                {JOBS_FILTERS_UI.clearAll}
              </button>
              <button type="button" onClick={onClose} className="ps-btn ps-bp">
                Show {resultCount} results
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
