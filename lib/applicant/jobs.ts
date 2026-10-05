/**
 * Applicant "Find Jobs" listings — the wireframe's own JOBS array
 * (beeliv-website/applicant/index.html), FRONTEND-ONLY PLACEHOLDER DATA.
 *
 * Where a wireframe job is the same vacancy as a public listing in
 * lib/public-site/jobs.ts, it keeps that public id, so a job seen on the
 * public site is the same job here (and /signup?job=<id> keeps working).
 * The public Head Chef listing is appended for the same reason.
 *
 * `image: null` = the wireframe shows department art instead of a photo
 * (see components/applicant/primitives.tsx JobThumb).
 *
 * Every job is merged with its per-vacancy detail from
 * lib/public-site/job-details.ts (job ref, openings, resumption, listing
 * status, experience, salary, benefits, working conditions, documents...).
 * That detail content is SAMPLE content - to be replaced by Beeliv's real
 * vacancy data (no database yet). `pay` is derived from its public salary so
 * the card chip and the detail page can never disagree.
 */
import { getFeaturedJobs, type Department, type Job } from "@/lib/public-site/jobs";
import { isOpenStatus, jobDetailsFor, payChipLabel, type JobDetails } from "@/lib/public-site/job-details";

export type Shift = "Day" | "Evening" | "Night" | "Rotating";
export type Match = "Strong match" | "Good match";

export type ApplicantJob = Omit<Job, "image" | "postedDaysAgo"> & JobDetails & {
  image: { src: string; alt: string } | null;
  shift: Shift;
  /** Short public pay line for chips, e.g. "₦250k – ₦320k / month"; null = not published. */
  pay: string | null;
  /** Days since posted — drives sort and the "Posted …" label. */
  daysAgo: number;
  closes: string;
  match: Match | null;
  /** Wireframe `ww`: still listed but closed to new applicants (derived from `status`). */
  closed?: boolean;
};

type BaseJob = Omit<ApplicantJob, keyof JobDetails>;

const photo = (file: string, alt: string) => ({ src: `/images/jobs/${file}`, alt });

const WIREFRAME_JOBS: BaseJob[] = [
  { id: "sous-chef", role: "Sous Chef", company: "The Urban Grill", location: "Abuja", employmentType: "Full-time", department: "Kitchen", shift: "Rotating", pay: "₦250k – ₦320k / month", daysAgo: 2, closes: "Closes 15 Oct 2026", match: "Strong match", image: photo("head-chef.jpg", "Chef plating a dish"), postedLabel: "", href: "" },
  { id: "bar-supervisor", role: "Bar Supervisor", company: "The Velvet Room", location: "Lagos", employmentType: "Contract", department: "Bar", shift: "Evening", pay: null, daysAgo: 5, closes: "Closes 10 Oct 2026", match: null, image: photo("bar-supervisor.jpg", "Bartender pouring a cocktail"), postedLabel: "", href: "" },
  { id: "guest-relations-officer", role: "Guest Relations Officer", company: "The Palm Lounge", location: "Abuja", employmentType: "Full-time", department: "Front of house", shift: "Day", pay: "₦180k – ₦220k / month", daysAgo: 7, closes: "Closes 12 Oct 2026", match: "Good match", image: photo("guest-relations-officer.jpg", "Host welcoming guests"), postedLabel: "", href: "" },
  { id: "restaurant-supervisor", role: "Restaurant Supervisor", company: "The Honey Suckle", location: "Abuja", employmentType: "Full-time", department: "Management", shift: "Rotating", pay: null, daysAgo: 8, closes: "Closes 18 Oct 2026", match: "Strong match", image: photo("restaurant-supervisor.jpg", "Supervisor setting a table"), postedLabel: "", href: "" },
  { id: "admin-operations-officer", role: "Admin & Operations Officer", company: "Maison 23", location: "Lagos", employmentType: "Full-time", department: "Admin & operations", shift: "Day", pay: "₦200k – ₦260k / month", daysAgo: 14, closes: "Closes 20 Oct 2026", match: null, image: { src: "/images/home/office-fallback.jpg", alt: "Operations officer at a laptop" }, postedLabel: "", href: "" },
  { id: "waiter-waitress", role: "Waiter / Waitress", company: "Brunch Lane", location: "Lagos", employmentType: "Full-time", department: "Front of house", shift: "Day", pay: null, daysAgo: 21, closes: "Closed to new applicants", match: null, image: null, closed: true, postedLabel: "", href: "" },
  { id: "line-cook", role: "Line Cook", company: "Café Lemon", location: "Abuja", employmentType: "Part-time", department: "Kitchen", shift: "Evening", pay: "₦120k – ₦150k / month", daysAgo: 3, closes: "Closes 16 Oct 2026", match: null, image: null, postedLabel: "", href: "" },
  { id: "housekeeping-supervisor", role: "Housekeeping Supervisor", company: "Grand Palm Hotel", location: "Lagos", employmentType: "Full-time", department: "Support", shift: "Rotating", pay: null, daysAgo: 4, closes: "Closes 19 Oct 2026", match: null, image: null, postedLabel: "", href: "" },
];

function postedLabel(days: number): string {
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 7) return `Posted ${days} days ago`;
  const weeks = Math.floor(days / 7);
  return `Posted ${weeks} week${weeks === 1 ? "" : "s"} ago`;
}

export async function getApplicantJobs(): Promise<ApplicantJob[]> {
  const publicJobs = await getFeaturedJobs();
  const extras: BaseJob[] = publicJobs
    .filter((p) => !WIREFRAME_JOBS.some((w) => w.id === p.id))
    .map(({ postedDaysAgo, ...p }) => ({ ...p, shift: "Day", pay: null, daysAgo: postedDaysAgo, closes: "Closes 15 Oct 2026", match: null }));
  return [...WIREFRAME_JOBS, ...extras].map((j) => {
    const details = jobDetailsFor(j.id, j.department);
    return {
      ...j,
      ...details,
      pay: payChipLabel(details.salary),
      closed: j.closed || !isOpenStatus(details.status),
      postedLabel: postedLabel(j.daysAgo),
      href: `/applicant/jobs/${j.id}`,
    };
  });
}

export const DEPARTMENTS: Department[] = ["Front of house", "Kitchen", "Bar", "Management", "Admin & operations", "Support"];
export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Casual"] as const;
export const SHIFTS: Shift[] = ["Day", "Evening", "Night", "Rotating"];
