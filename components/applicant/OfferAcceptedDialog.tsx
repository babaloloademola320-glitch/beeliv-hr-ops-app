"use client";

/**
 * "Offer accepted" moment, shown once straight after the accept-offer
 * preloader (project lead: a pop-up with CTAs instead of a card at the
 * bottom of the page). Same shell as ConfirmDialog: centred modal from
 * 768px, swipe-to-close bottom sheet on phones. The page itself then shows
 * the live status in "What happens next".
 */
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "./icons";
import { Celebration } from "./Celebration";
import { SubmittedMark } from "./apply/SubmittedMark";
import { newsreader } from "./fonts";
import { SPRING, SwipeSheet, useIsClient, useIsPhone } from "./motion";

export function OfferAcceptedDialog({
  open,
  role,
  outlet,
  resumption,
  onClose,
  onSeeNext,
}: {
  open: boolean;
  role: string;
  outlet: string;
  resumption: string;
  onClose: () => void;
  onSeeNext: () => void;
}) {
  const client = useIsClient();
  if (!client) return null;
  return createPortal(
    <AnimatePresence>
      {open ? <Panel key="offer-accepted" role={role} outlet={outlet} resumption={resumption} onClose={onClose} onSeeNext={onSeeNext} /> : null}
    </AnimatePresence>,
    document.body,
  );
}

function Panel({ role, outlet, resumption, onClose, onSeeNext }: { role: string; outlet: string; resumption: string; onClose: () => void; onSeeNext: () => void }) {
  const isPhone = useIsPhone();
  const titleId = useId();
  const descId = useId();
  const primary = useRef<HTMLAnchorElement>(null);

  // Focus the main action, lock page scroll, restore focus on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    primary.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      opener?.focus?.();
    };
  }, []);

  const content = (
    <div className="flex flex-col items-center text-center">
      <SubmittedMark label="Offer accepted" plane={false} />
      <h2 id={titleId} className="ap-serif mt-2 text-[30px] leading-tight text-(--ap-ink)">
        Offer accepted
      </h2>
      <p className="mt-1 text-[15px] font-bold text-(--ap-ink)">
        {role} at {outlet}
      </p>
      <p className="ap-sm">Resumption {resumption}</p>
      <p id={descId} className="ap-sm mt-3 max-w-[40ch] text-(--ap-ink-2)">
        Beeliv is confirming your placement. We&apos;ll notify you when your Staff Hub is ready.
      </p>
      <div className="mt-5 flex w-full flex-col gap-2.5">
        <Link ref={primary} href="/applicant" className="ap-btn ap-btn-p h-12 w-full text-white!">
          Go to Overview <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <button type="button" onClick={onSeeNext} className="ap-btn ap-btn-s h-12 w-full">
          See what happens next
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
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <Celebration originY={isPhone ? "58%" : "44%"} />
      {isPhone ? (
        <SwipeSheet role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId} onClose={onClose} className="px-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
          <div className="pt-3">{content}</div>
        </SwipeSheet>
      ) : (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={SPRING}
          className="w-[440px] rounded-[22px] bg-white p-7 shadow-[0_30px_80px_rgba(17,17,27,.28)]"
        >
          {content}
        </motion.div>
      )}
    </motion.div>
  );
}
