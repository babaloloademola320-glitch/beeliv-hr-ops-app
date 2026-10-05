"use client";

/**
 * Filter fieldsets shared by the desktop sidebar (`<aside>` in JobsBrowser)
 * and the mobile bottom sheet (FilterSheet). Jobs-Desktop.dc.html hides the
 * sidebar's own Keyword field (`style="display:none"` - the hero search bar
 * already has one); Jobs-Filters-Mobile.dc.html shows it. `showKeyword`
 * reproduces that exactly.
 */
import { SelectMenu } from "@/components/applicant/SelectMenu";
import { JobFilterIcon, JobsSearchIcon, LocationPinIcon } from "../icons";
import {
  BENEFITS,
  DEPARTMENTS,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  JOBS_FILTERS_UI,
  JOBS_SEARCH,
  LOCATIONS,
  SHIFT_PATTERNS,
} from "@/lib/public-site/jobs-content";
import { EMPTY_FILTERS, toggleValue, type JobFilters } from "@/lib/public-site/jobs-filters";
import { DATE_POSTED_OPTIONS, SALARY_FILTER_BANDS } from "@/lib/public-site/job-details";
import type { Department } from "@/lib/public-site/jobs";

type IconName = Parameters<typeof JobFilterIcon>[0]["name"];

function OptButton({
  on,
  icon,
  label,
  onClick,
}: {
  on: boolean;
  icon?: IconName;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="jb-opt" data-on={on} aria-pressed={on} onClick={onClick}>
      {icon && <JobFilterIcon name={icon} stroke={on ? "var(--beeliv-purple)" : "var(--ink)"} />}
      {label}
    </button>
  );
}

export function FiltersPanel({
  filters,
  onChange,
  showKeyword = false,
  idPrefix,
}: {
  filters: JobFilters;
  onChange: (next: JobFilters) => void;
  showKeyword?: boolean;
  idPrefix: string;
}) {
  const set = <K extends keyof JobFilters>(key: K, value: JobFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between gap-3 pt-1 pb-1">
        <h2 className="ps-serif [--fs-d:28] [--fs-m:30]">{JOBS_FILTERS_UI.title}</h2>
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="text-[15px] font-bold underline underline-offset-2 wf-d:text-[15px]"
        >
          {JOBS_FILTERS_UI.resetAll}
        </button>
      </div>

      {showKeyword && (
        <div className="jb-fg pt-2">
          <h3>{JOBS_SEARCH.keywordLabel}</h3>
          <label className="jb-sch" htmlFor={`${idPrefix}-keyword`}>
            <JobsSearchIcon stroke="var(--muted-text)" />
            <input
              id={`${idPrefix}-keyword`}
              placeholder={JOBS_SEARCH.keywordPlaceholder}
              value={filters.keyword}
              onChange={(e) => set("keyword", e.target.value)}
            />
          </label>
        </div>
      )}

      <div className="jb-fg">
        <h3>Department</h3>
        <div className="flex flex-wrap gap-2.5">
          {DEPARTMENTS.map((d) => (
            <OptButton
              key={d.value}
              on={filters.departments.includes(d.value)}
              icon={d.icon as IconName}
              label={d.value}
              onClick={() => set("departments", toggleValue(filters.departments, d.value) as Department[])}
            />
          ))}
        </div>
      </div>

      <div className="jb-fg">
        <h3>Employment type</h3>
        <div className="flex flex-wrap gap-2.5">
          {EMPLOYMENT_TYPES.map((t) => (
            <OptButton
              key={t.value}
              on={filters.employmentTypes.includes(t.value)}
              icon={t.icon as IconName}
              label={t.value}
              onClick={() => set("employmentTypes", toggleValue(filters.employmentTypes, t.value))}
            />
          ))}
        </div>
      </div>

      <div className="jb-fg">
        <h3>Location</h3>
        <label className="jb-sch" htmlFor={`${idPrefix}-location`}>
          <LocationPinIcon stroke="var(--muted-text)" />
          <SelectMenu
            id={`${idPrefix}-location`}
            variant="bare"
            label="Location"
            placeholder="Select location"
            value={filters.location}
            onChange={(v) => set("location", v)}
            options={[{ value: "", label: "Select location" }, ...LOCATIONS]}
          />
        </label>
      </div>

      <div className="jb-fg">
        <h3>Experience level</h3>
        <div className="flex flex-wrap gap-2.5">
          {EXPERIENCE_LEVELS.map((level) => (
            <OptButton
              key={level}
              on={filters.experience === level}
              label={level}
              onClick={() => set("experience", level)}
            />
          ))}
        </div>
      </div>

      <div className="jb-fg">
        <h3>Salary range</h3>
        {/* Monthly bands (requirements §2.14). Placeholder figures - Beeliv has
            not supplied real bands. Replaces the wireframe's two disabled
            min/max selects, which had no values to offer. */}
        <div className="flex flex-wrap gap-2.5">
          {SALARY_FILTER_BANDS.map((b) => (
            <OptButton
              key={b.value}
              on={filters.salaryBands.includes(b.value)}
              label={b.value}
              onClick={() => set("salaryBands", toggleValue(filters.salaryBands, b.value))}
            />
          ))}
        </div>
      </div>

      <div className="jb-fg">
        <h3>Date posted</h3>
        <div className="flex flex-wrap gap-2.5">
          {DATE_POSTED_OPTIONS.map((o) => (
            <OptButton key={o.label} on={filters.posted === o.value} label={o.label} onClick={() => set("posted", o.value)} />
          ))}
        </div>
      </div>

      <div className="jb-fg">
        <h3>Shift pattern</h3>
        <div className="flex flex-wrap gap-2.5">
          {SHIFT_PATTERNS.map((s) => (
            <OptButton
              key={s.value}
              on={filters.shiftPatterns.includes(s.value)}
              icon={s.icon as IconName}
              label={s.value}
              onClick={() => set("shiftPatterns", toggleValue(filters.shiftPatterns, s.value))}
            />
          ))}
        </div>
      </div>

      <div className="jb-fg" style={{ borderBottom: 0 }}>
        <h3>Benefits</h3>
        <div className="flex flex-wrap gap-2.5">
          {BENEFITS.map((b) => (
            <OptButton
              key={b.value}
              on={filters.benefits.includes(b.value)}
              icon={b.icon as IconName}
              label={b.value}
              onClick={() => set("benefits", toggleValue(filters.benefits, b.value))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
