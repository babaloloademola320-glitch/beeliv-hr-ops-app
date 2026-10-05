/**
 * Home page "Jobs teaser" data layer - also the source of truth for the
 * /jobs listing page (Jobs-Desktop / Jobs-Mobile.dc.html) so job ids stay
 * consistent everywhere they're referenced (e.g. Signup's job lookup).
 *
 * FRONTEND-ONLY PLACEHOLDER DATA. No backend, no Supabase, no API call. The
 * roles/locations/types below are realistic-looking stand-ins so the section
 * can be judged visually; they are NOT real vacancies.
 *
 * `company` was updated from the earlier "[Company]" placeholder to the real
 * names shown on the redesigned Home-Desktop-2.dc.html / Home-Mobile-2.dc.html
 * boards ("07 · FEATURED OPPORTUNITIES") and confirmed consistent with
 * Jobs-Desktop.dc.html. These are still example listings, not live vacancies.
 *
 * `department` and `postedLabel` were added additively (not in the original
 * Home-teaser shape) so the /jobs page's department filter and "Posted X ago"
 * line have real per-job values to read, per Jobs-Desktop.dc.html. Reported
 * to the UI/UX task as a minimal, additive data-layer change.
 *
 * NOTE (flagged, not silently resolved): Home-Mobile-2.dc.html's own "Posted"
 * line gives "5 days ago" for Restaurant Supervisor and "1 week ago" for Bar
 * Supervisor - both different from the postedLabel values below (3 days / 5
 * days), which were set from Jobs-Desktop.dc.html instead. The two boards
 * disagree; values here were left as the other agent set them to avoid
 * clobbering /jobs page work in progress. Reconcile with Beeliv/the project
 * lead or the Jobs-page agent rather than picking one silently.
 *
 * Per-vacancy detail (job ref, openings, salary, requirements, working
 * conditions...) lives in ./job-details.ts, looked up by the same id.
 *
 * To wire real data later, replace the body of `getFeaturedJobs()` with a
 * Supabase query returning `Job[]` - the Home page already awaits it.
 */

export type Department =
  | "Front of house"
  | "Kitchen"
  | "Bar"
  | "Management"
  | "Admin & operations"
  | "Support";

export type Job = {
  id: string;
  role: string;
  company: string;
  location: string;
  employmentType: string;
  /** Wireframe: second chip on every job card + the sidebar "Department" filter. */
  department: Department;
  /** Wireframe: "Posted X ago" line on every job card. */
  postedLabel: string;
  /** Whole days since posted, matching postedLabel - drives the /jobs "Date posted" filter. */
  postedDaysAgo: number;
  /** Job detail route (future page: Job-Desktop / Job-Mobile wireframes). */
  href: string;
  /** Job card thumbnail (Home teaser + /jobs listing). Real photo, per-job. */
  image: { src: string; alt: string };
};

const FEATURED_JOBS: Job[] = [
  {
    id: "head-chef",
    role: "Head Chef",
    company: "The Urban Grill",
    location: "Abuja",
    employmentType: "Full-time",
    department: "Kitchen",
    postedLabel: "Posted 2 days ago",
    postedDaysAgo: 2,
    href: "/jobs/head-chef",
    image: { src: "/images/jobs/head-chef.jpg", alt: "Chef plating a salmon dish in a professional kitchen" },
  },
  {
    id: "restaurant-supervisor",
    role: "Restaurant Supervisor",
    company: "The Honey Suckle",
    location: "Abuja",
    employmentType: "Full-time",
    department: "Management",
    postedLabel: "Posted 3 days ago",
    postedDaysAgo: 3,
    href: "/jobs/restaurant-supervisor",
    image: { src: "/images/jobs/restaurant-supervisor.jpg", alt: "Waitstaff setting a table in a restaurant dining room" },
  },
  {
    id: "bar-supervisor",
    role: "Bar Supervisor",
    company: "The Velvet Room",
    location: "Lagos",
    employmentType: "Contract",
    department: "Bar",
    postedLabel: "Posted 5 days ago",
    postedDaysAgo: 5,
    href: "/jobs/bar-supervisor",
    image: { src: "/images/jobs/bar-supervisor.jpg", alt: "Bartender pouring a cocktail at a bar" },
  },
  {
    id: "guest-relations-officer",
    role: "Guest Relations Officer",
    company: "The Palm Lounge",
    location: "Abuja",
    employmentType: "Full-time",
    department: "Front of house",
    postedLabel: "Posted 1 week ago",
    postedDaysAgo: 7,
    href: "/jobs/guest-relations-officer",
    image: { src: "/images/jobs/guest-relations-officer.jpg", alt: "Host with a tablet welcoming guests at a restaurant table" },
  },
];

export async function getFeaturedJobs(): Promise<Job[]> {
  return FEATURED_JOBS;
}

/** Static rows for the route's loading skeleton (never shown as real data). */
export const SKELETON_JOBS: Job[] = FEATURED_JOBS;
