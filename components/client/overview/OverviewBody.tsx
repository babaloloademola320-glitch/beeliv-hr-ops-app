"use client";

import { useOnboarding, useOverview } from "@/lib/client/hooks";
import { useOutletState } from "@/lib/client/outlet";
import { ActivityCard, TeamCard } from "./ActivityTeam";
import { AttendanceTodayCard } from "./AttendanceCards";
import { AttentionCard } from "./AttentionCard";
import { Banner } from "./Banner";
import { FreshBanner, WhatHappensNext } from "./FreshAccount";
import { DistributionCard } from "./DistributionCard";
import { MetricStrip } from "./MetricStrip";
import { OnboardingWelcome } from "./OnboardingWelcome";
import { ComplianceCard, PayrollCard } from "./OpsCards";
import { OverviewError, OverviewSkeleton } from "./OverviewStates";
import { RecruitmentCard } from "./RecruitmentCard";
import { CoverageCard, WeekStripCard } from "./ScheduleCards";
import { WorkforceToday } from "./WorkforceToday";

/**
 * Overview = an operational briefing (brief section 7). One question: "how is
 * my operation doing today, and what needs my attention?" It answers in the
 * banner + five numbers, then an editorial grid where cards are deliberately
 * different sizes (12 columns from 1241px, 2 on tablets, 1 on phones).
 *
 * DOM order is the desktop reading order. On phones `order-*` reorders it on
 * purpose: attention first, then who is on today, then coverage, then the
 * two at-a-glance rings (charts live on Analytics), then the slower-moving sections. The Overview (banner, tiles,
 * attention) comes from one getOverview call; each card loads its own data, so
 * one slow or failed section never blanks the page.
 */
export function OverviewBody() {
  const { data: ov, status, retry } = useOverview();
  const outlet = useOutletState();
  const onboarding = useOnboarding();

  if (status === "loading" || onboarding.status === "loading") return <OverviewSkeleton />;
  // First-time setup: show only the welcome and checklist. The live operational numbers wait until setup is done,
  // so a new client never sees data that looks like a working account.
  if (onboarding.data && onboarding.data.status !== "complete") return <OnboardingWelcome />;
  if (status === "error" || !ov) return <OverviewError retry={retry} />;

  const empty = ov.metrics.activeStaff === 0;
  return (
    <div className="flex flex-col gap-5">
      {/* New client: welcome + "Finish setting up" above everything else; renders nothing once setup is complete. */}
      <OnboardingWelcome />
      {empty ? (
        <>
          <FreshBanner ov={ov} firstOutlet={outlet.outlets[0] ?? null} />
          <WhatHappensNext />
          <TeamCard team={ov.team} />
        </>
      ) : (
        <>
        <Banner ov={ov} firstOutlet={outlet.outlets[0] ?? null} />
        <MetricStrip ov={ov} />
        <div className="grid grid-cols-1 gap-4 min-[768px]:grid-cols-2 min-[1241px]:grid-cols-12 min-[1241px]:gap-5">
          <WorkforceToday className="order-2 min-[768px]:order-none min-[768px]:col-span-2 min-[1241px]:col-span-8" />
          <AttentionCard items={ov.attention} className="order-1 min-[768px]:order-none min-[1241px]:col-span-4" />
          <AttendanceTodayCard className="order-4 min-[768px]:order-none min-[1241px]:col-span-4" />
          <DistributionCard className="order-5 min-[768px]:order-none min-[1241px]:col-span-4" />
          <CoverageCard className="order-3 min-[768px]:order-none min-[768px]:col-span-2 min-[1241px]:col-span-4" />
          <WeekStripCard className="order-6 min-[768px]:order-none min-[768px]:col-span-2 min-[1241px]:col-span-8" />
          <ComplianceCard className="order-9 min-[768px]:order-none min-[1241px]:col-span-4" />
          <RecruitmentCard showOutlet={ov.scope === "all"} className="order-7 min-[768px]:order-none min-[768px]:col-span-2 min-[1241px]:col-span-8" />
          <PayrollCard className="order-10 min-[768px]:order-none min-[1241px]:col-span-4" />
          <ActivityCard className="order-11 min-[768px]:order-none min-[768px]:col-span-2 min-[1241px]:col-span-12" />
          <TeamCard team={ov.team} className="order-12 min-[768px]:order-none min-[768px]:col-span-2 min-[1241px]:col-span-12" />
        </div>
        </>
      )}
    </div>
  );
}
