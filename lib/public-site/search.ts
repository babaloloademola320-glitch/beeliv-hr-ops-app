/**
 * Public-site search data layer: THE ONLY place a search query is matched
 * against site content.
 *
 * STATUS: NO BACKEND. Plain, case-insensitive substring matching over two
 * static, in-repo sources:
 *   1. The top-level page directory (title + path), reusing NAV_LINKS so the
 *      indexed pages never drift from the real nav.
 *   2. The job listings data layer (lib/public-site/jobs.ts), matched on
 *      role / company / location.
 * No fuzzy-match library, no network call, no new dependency.
 *
 * TO CONNECT REAL SEARCH LATER (one place, the UI does not change):
 *   Replace the body of `search()` (SWAP POINT) with a real query - e.g. a
 *   Supabase full-text search across pages and live job postings - and
 *   return results in the same SearchResult[] shape.
 */

import { NAV_LINKS } from "./content";
import { SKELETON_JOBS } from "./jobs";

export type SearchResultType = "page" | "job";

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  /** Secondary line (job company/location); null for page results. */
  subtitle: string | null;
  href: string;
};

const PAGE_RESULTS: SearchResult[] = NAV_LINKS.map((l) => ({
  id: `page-${l.href}`,
  type: "page",
  title: l.label,
  subtitle: null,
  href: l.href,
}));

const JOB_RESULTS: (SearchResult & { haystack: string })[] = SKELETON_JOBS.map((j) => ({
  id: `job-${j.id}`,
  type: "job",
  title: j.role,
  subtitle: `${j.company} · ${j.location}`,
  href: j.href,
  haystack: [j.role, j.company, j.location].join(" ").toLowerCase(),
}));

/**
 * Case-insensitive substring match over the page directory (title only) and
 * job listings (role / company / location). Returns [] for an empty/blank
 * query. SWAP POINT for a real backend search - see file header.
 */
export function search(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const jobMatches: SearchResult[] = JOB_RESULTS.filter((j) => j.haystack.includes(q)).map(
    (j) => ({ id: j.id, type: j.type, title: j.title, subtitle: j.subtitle, href: j.href }),
  );
  const pageMatches = PAGE_RESULTS.filter((p) => p.title.toLowerCase().includes(q));

  return [...jobMatches, ...pageMatches];
}
