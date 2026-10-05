"use client";

import { useStaffHome } from "@/lib/staff/hooks";
import { HomeHero } from "./HomeHero";
import { HomeError, HomeGate, HomeOnboarding, HomeSkeleton } from "./HomeStates";
import { AnnouncementsCard, AssignmentCard, CareerStrip, LearningCard, LeaveCard, NotificationsCard, QuickActions, RecentAttendance, RequiredCard, SupportCard, TodayRow, TodayTimeline, UpcomingCard } from "./HomeSections";

/**
 * Staff Home. Mobile order is the DOM/`order-*` sequence (today -> required ->
 * upcoming -> training -> announcements). At 1241px+ two columns take over via
 * `contents` wrappers: left = assignment / upcoming / required / leave /
 * training, right = today / attendance / announcements / notifications / help.
 */
export function HomeBody() {
  const { data: home, status, retry } = useStaffHome();
  if (status === "loading") return <HomeSkeleton />;
  if (status === "error" || !home) return <HomeError retry={retry} />;

  const s = home.profile.accountStatus;
  if (s !== "active" && s !== "onboarding") return <HomeGate status={s} />;
  if (s === "onboarding") return <HomeOnboarding home={home} />;

  return (
    <div className="flex flex-col gap-5">
      <HomeHero home={home} />
      <TodayRow home={home} />
      <div className="min-[768px]:hidden">
        <QuickActions />
      </div>

      <div className="flex flex-col gap-5 min-[1241px]:grid min-[1241px]:grid-cols-[minmax(0,1fr)_340px] min-[1241px]:items-start min-[1600px]:grid-cols-[minmax(0,1fr)_380px]">
        <div className="contents min-[1241px]:flex min-[1241px]:min-w-0 min-[1241px]:flex-col min-[1241px]:gap-5">
          <AssignmentCard a={home.assignment} className="order-1" />
          <UpcomingCard shifts={home.upcoming} className="order-4 min-[1241px]:order-2" />
          <RequiredCard actions={home.requiredActions} className="order-3" />
          <LeaveCard leave={home.leave} className="order-6 min-[1241px]:order-4" />
          <LearningCard items={home.learning} className="order-7 min-[1241px]:order-5" />
        </div>
        <div className="contents min-[1241px]:flex min-[1241px]:min-w-0 min-[1241px]:flex-col min-[1241px]:gap-5">
          <TodayTimeline shifts={home.todaysShifts} className="order-2" />
          <RecentAttendance records={home.recentAttendance} className="order-5" />
          <AnnouncementsCard items={home.announcements} className="order-8" />
          <NotificationsCard className="order-9" />
          <SupportCard className="order-10" />
        </div>
      </div>

      <div className="hidden min-[768px]:block">
        <QuickActions />
      </div>
      <CareerStrip />
    </div>
  );
}
