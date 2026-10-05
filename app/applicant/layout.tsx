import type { Metadata } from "next";
import { AppShell } from "@/components/applicant/AppShell";
import { newsreader } from "@/components/applicant/fonts";
import "./applicant.css";
import { ScreenScale } from "@/components/shared/ScreenScale";

// Applicant dashboard only: Newsreader (serif display headings), matching
// the delivered wireframe (C:\Users\USER\Documents\beeliv-website\applicant\
// index.html), same next/font pattern as app/(public)/layout.tsx (which this
// route tree does NOT import from — this is its own scope). Karla (body) is
// already loaded globally as --font-sans in app/layout.tsx.
//
// Note: CLAUDE.md records a project-lead instruction that the (other four)
// role dashboards use Inter headings only. This dashboard is a deliberate,
// scoped exception: it was handed over as its own locked wireframe (task
// instructions: "Fonts: Karla + Newsreader... reuse, don't re-import") and
// sits functionally closer to the public recruitment flow (job listings,
// apply) than to the internal HR/ops dashboards. Flagged for visibility, not
// silently applied — if Beeliv wants Inter here instead, this is the one
// line to change.
export const metadata: Metadata = {
  title: { default: "Applicant dashboard", template: "%s | Beeliv Applicant" },
  robots: { index: false, follow: false },
};

export default function ApplicantLayout({ children }: LayoutProps<"/">) {
  return (
    <div className={`ap-screen-zoom applicant-shell ${newsreader.variable}`}>
      <ScreenScale />
      {/* Scroll reveals start hidden in the server HTML (motion.tsx Reveal/Unveil); without JS, show them. Same pattern as app/(public)/layout.tsx. */}
      <noscript>
        <style>{`.applicant-shell [data-ap-reveal]{opacity:1!important;transform:none!important;clip-path:none!important}`}</style>
      </noscript>
      <AppShell>{children}</AppShell>
    </div>
  );
}
