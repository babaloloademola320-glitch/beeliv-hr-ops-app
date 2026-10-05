import Link from "next/link";
import { BarChart3 } from "./icons";

/** Compact "View analytics" link that deep-links to the matching Analytics family with the same filters. */
export function AnalyticsLink({ href, label = "View analytics", className = "" }: { href: string; label?: string; className?: string }) {
  return (
    <div className={`flex justify-end ${className}`}>
      <Link href={href} className="ap-btn ap-btn-s ap-btn-sm">
        <BarChart3 className="size-4" aria-hidden="true" /> {label}
      </Link>
    </div>
  );
}
