/**
 * /jobs client-side filter state + matching logic. Frontend-only: filters over
 * the placeholder array from lib/public-site/jobs.ts, no request ever leaves
 * the browser.
 *
 * Experience level, salary range, date posted and (most) benefits now match
 * against each vacancy's SAMPLE detail data (lib/public-site/job-details.ts,
 * requirements §2.14). Groups the sample data still has no field for (shift
 * pattern; the "Flexible schedule" benefit) are treated as a real, honest
 * constraint no sample job can satisfy - they produce zero results (and so
 * reach Jobs-Empty-*), rather than faking matches.
 */
import type { Department, Job } from "./jobs";
import {
  DATE_POSTED_OPTIONS,
  experienceBand,
  jobDetailsFor,
  matchesDatePosted,
  matchesSalaryBand,
  type BenefitKind,
} from "./job-details";

export type JobFilters = {
  keyword: string;
  location: string;
  departments: Department[];
  employmentTypes: string[];
  experience: string;
  shiftPatterns: string[];
  benefits: string[];
  /** SALARY_FILTER_BANDS values, incl. "Not listed". */
  salaryBands: string[];
  /** DATE_POSTED_OPTIONS value; "" = any time. */
  posted: string;
};

export const DEFAULT_EXPERIENCE = "Any";

export const EMPTY_FILTERS: JobFilters = {
  keyword: "",
  location: "",
  departments: [],
  employmentTypes: [],
  experience: DEFAULT_EXPERIENCE,
  shiftPatterns: [],
  benefits: [],
  salaryBands: [],
  posted: "",
};

/** Filter-panel benefit labels -> vacancy benefit kinds. Unmapped labels match nothing. */
const BENEFIT_KIND: Record<string, BenefitKind> = {
  "Accommodation provided": "Accommodation",
  "Transport provided": "Transport",
  "Meals provided": "Feeding",
};

export function toggleValue<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function filterJobs(jobs: Job[], f: JobFilters): Job[] {
  const kw = f.keyword.trim().toLowerCase();
  return jobs.filter((job) => {
    if (kw) {
      const haystack = `${job.role} ${job.company} ${job.location} ${job.department}`.toLowerCase();
      if (!haystack.includes(kw)) return false;
    }
    if (f.location && job.location !== f.location) return false;
    if (f.departments.length && !f.departments.includes(job.department)) return false;
    if (f.employmentTypes.length && !f.employmentTypes.includes(job.employmentType)) return false;
    const d = jobDetailsFor(job.id, job.department);
    if (f.experience !== DEFAULT_EXPERIENCE && experienceBand(d.experience.minYears) !== f.experience) return false;
    if (f.salaryBands.length && !f.salaryBands.some((b) => matchesSalaryBand(d.salary, b))) return false;
    if (!matchesDatePosted(job.postedDaysAgo, f.posted)) return false;
    if (f.benefits.length && !f.benefits.every((b) => BENEFIT_KIND[b] && d.benefits.some((x) => x.kind === BENEFIT_KIND[b]))) return false;
    // No sample job carries a shift pattern - see file header.
    if (f.shiftPatterns.length) return false;
    return true;
  });
}

export function hasActiveFilters(f: JobFilters): boolean {
  return (
    f.keyword.trim() !== "" ||
    f.location !== "" ||
    f.departments.length > 0 ||
    f.employmentTypes.length > 0 ||
    f.experience !== DEFAULT_EXPERIENCE ||
    f.shiftPatterns.length > 0 ||
    f.benefits.length > 0 ||
    f.salaryBands.length > 0 ||
    f.posted !== ""
  );
}

/** Removable chips row (Jobs-Desktop.dc.html: everything except keyword). */
export type ActiveChip = { key: string; label: string; remove: (f: JobFilters) => JobFilters };

export function activeChips(f: JobFilters): ActiveChip[] {
  const chips: ActiveChip[] = [];
  for (const d of f.departments) {
    chips.push({ key: `dept-${d}`, label: d, remove: (cur) => ({ ...cur, departments: toggleValue(cur.departments, d) }) });
  }
  for (const t of f.employmentTypes) {
    chips.push({ key: `type-${t}`, label: t, remove: (cur) => ({ ...cur, employmentTypes: toggleValue(cur.employmentTypes, t) }) });
  }
  if (f.location) {
    chips.push({ key: "loc", label: f.location, remove: (cur) => ({ ...cur, location: "" }) });
  }
  if (f.experience !== DEFAULT_EXPERIENCE) {
    chips.push({ key: "exp", label: f.experience, remove: (cur) => ({ ...cur, experience: DEFAULT_EXPERIENCE }) });
  }
  for (const b of f.salaryBands) {
    chips.push({
      key: `pay-${b}`,
      label: b === "Not listed" ? "Salary not listed" : b,
      remove: (cur) => ({ ...cur, salaryBands: toggleValue(cur.salaryBands, b) }),
    });
  }
  if (f.posted) {
    const label = DATE_POSTED_OPTIONS.find((o) => o.value === f.posted)?.label ?? f.posted;
    chips.push({ key: "posted", label: `Posted: ${label.toLowerCase()}`, remove: (cur) => ({ ...cur, posted: "" }) });
  }
  for (const s of f.shiftPatterns) {
    chips.push({ key: `shift-${s}`, label: `${s} shift`, remove: (cur) => ({ ...cur, shiftPatterns: toggleValue(cur.shiftPatterns, s) }) });
  }
  for (const b of f.benefits) {
    chips.push({ key: `ben-${b}`, label: b, remove: (cur) => ({ ...cur, benefits: toggleValue(cur.benefits, b) }) });
  }
  return chips;
}
