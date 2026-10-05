"use client";

import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";

/**
 * Phone bottom sheet that holds the full job-alert controls (criteria, frequency, channels), so the
 * Jobs page itself only needs a one-line "Job alert created / Manage" bar. Same sheet pattern as
 * FiltersSheet, portalled into `.applicant-shell` for the dashboard tokens.
 */
export function JobAlertSheet({
  open,
  onOpenChange,
  container,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container: HTMLElement | null;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={container}>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-[rgba(17,17,27,.36)] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          aria-label="Job alerts"
          className="fixed inset-x-0 bottom-0 z-[71] mx-auto max-h-[86vh] w-full overflow-y-auto overscroll-contain rounded-t-[22px] bg-white px-4 pt-2.5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] transition-transform duration-[250ms] ease-[cubic-bezier(.2,.7,.2,1)] outline-none data-ending-style:translate-y-full data-starting-style:translate-y-full"
        >
          <div aria-hidden="true" className="mx-auto mb-3.5 h-1 w-10 rounded-sm bg-(--ap-line)" />
          <Dialog.Title className="sr-only">Job alerts</Dialog.Title>
          {children}
          <Dialog.Close className="ap-btn ap-btn-s mt-3 h-[48px] w-full text-[15px] font-semibold">Done</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
