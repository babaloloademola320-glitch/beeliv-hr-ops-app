"use client";

import { Bookmark, Share } from "@/components/applicant/icons";
import { toast } from "@/components/ui/toast";
import { toggleSavedJob, useSavedJobs } from "@/lib/applicant/saved";

/** Share a job link with the phone's share sheet, or copy it where that is not available. */
export async function shareJob(role: string, company: string) {
  const url = window.location.href;
  const title = `${role} at ${company}`;
  try {
    if (navigator.share) {
      await navigator.share({ title, text: title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.add({ title: "Link copied", type: "success" });
  } catch {
    /* share sheet dismissed - nothing to do */
  }
}

/** Toggle a job's saved state with the wireframe's confirmation toast. */
export function toggleSaveWithToast(jobId: string) {
  const now = toggleSavedJob(jobId);
  toast.add({ title: now ? "Saved to your jobs" : "Removed from saved jobs", type: now ? "success" : undefined });
}

/**
 * Wireframe `.save` bookmark: 32px ghost icon button (42px tap target
 * <=1100px), muted -> violet, filled bookmark when pressed.
 */
export function SaveJobButton({ jobId, role, className = "" }: { jobId: string; role: string; className?: string }) {
  const saved = useSavedJobs().includes(jobId);
  return (
    <button
      type="button"
      onClick={() => toggleSaveWithToast(jobId)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${role} from saved jobs` : `Save ${role}`}
      title={saved ? "Saved" : "Save role"}
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent transition-colors hover:bg-(--ap-line-2) hover:text-(--ap-violet) max-[1100px]:size-[42px] ${
        saved ? "text-(--ap-violet)" : "text-(--ap-muted)"
      } ${className}`}
    >
      <Bookmark key={saved ? "on" : "off"} className={`size-5 ${saved ? "ap-bump" : ""}`} strokeWidth={1.6} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  );
}

/** Share icon for the job header (tablet and desktop); phones get it in the apply bar. */
export function ShareJobButton({ role, company, className = "" }: { role: string; company: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => void shareJob(role, company)}
      aria-label={`Share ${role}`}
      title="Share role"
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent text-(--ap-muted) transition-colors hover:bg-(--ap-line-2) hover:text-(--ap-violet) ${className}`}
    >
      <Share className="size-5" strokeWidth={1.6} aria-hidden="true" />
    </button>
  );
}
