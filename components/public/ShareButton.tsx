"use client";

import { useState } from "react";
import { T } from "./primitives";

function ShareGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
    </svg>
  );
}

/**
 * Share a job: the phone's share sheet where there is one, otherwise copy the
 * link and say so. `icon` = square icon-only button for the mobile apply bar.
 */
export function ShareButton({ title, label, icon = false, className = "" }: { title: string; label: string; icon?: boolean; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* share sheet dismissed - nothing to do */
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      aria-label={icon ? `Share ${title}` : undefined}
      className={icon ? `ps-btn ps-bo !h-[52px] !w-[52px] shrink-0 !px-0 bg-white ${className}` : `ps-btn ps-bo gap-2 bg-white font-semibold ${className}`}
    >
      <ShareGlyph />
      {icon ? null : <T>{label}</T>}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
      {copied && !icon ? <span className="ml-1 text-[13px] font-medium text-(--beeliv-purple)">Link copied</span> : null}
    </button>
  );
}
