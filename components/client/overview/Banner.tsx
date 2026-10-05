import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin } from "@/components/applicant/icons";
import { Reveal } from "@/components/applicant/motion";
import { outletImage } from "@/lib/client/assets";
import { fullDate, greetingForNow, todayISO } from "@/lib/client/format";
import { attendanceHref, NEW_REQUEST_HREF } from "@/lib/client/links";
import type { ClientOverview, Outlet } from "@/lib/client/types";
import { UserPlus } from "../icons";

/**
 * Overview hero: the selected outlet's photo (or an approved Beeliv
 * placeholder) under a wine wash, the editorial greeting (Newsreader, the one
 * place the serif leads), the date, and a small frosted "checked in today" card
 * that drills into live attendance. Operational, not a second marketing page.
 * `firstOutlet` supplies the photo when "All outlets" is selected.
 */
export function Banner({ ov, firstOutlet }: { ov: ClientOverview; firstOutlet: Outlet | null }) {
  const m = ov.metrics;
  const photo = outletImage(ov.outlet ?? firstOutlet);
  return (
    <Reveal as="section" aria-label="Welcome" className="relative overflow-hidden rounded-[20px] bg-(--client-wine) text-white shadow-(--ap-shadow)">
      <Image src={photo} alt="" fill priority sizes="(max-width: 1360px) 100vw, 1360px" className="object-cover" />
      <span className="client-banner-shade absolute inset-0" aria-hidden="true" />
      <div className="relative grid gap-4 p-5 min-[768px]:min-h-[208px] min-[768px]:grid-cols-[minmax(0,1fr)_auto] min-[768px]:items-center min-[768px]:gap-6 min-[768px]:p-7">
        <div className="min-w-0">
          <p className="text-[12px] font-bold tracking-[.2em] text-[#e0c9a3] uppercase">{greetingForNow().replace(",", "")}</p>
          <h1 className="ap-serif mt-1 text-[36px] leading-[1.05] text-white min-[768px]:text-[46px]">Welcome back, {ov.greetingName}.</h1>
          <p className="mt-2 max-w-[52ch] text-[15px] leading-[1.5] text-white/85">
            Here&apos;s what&apos;s happening at <b className="font-bold text-white">{ov.scopeLabel}</b> today.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2.5">
            <span className="inline-flex items-center gap-1.5 text-[13px] text-white/80">
              <Calendar className="size-4" aria-hidden="true" />
              {fullDate(todayISO())}
            </span>
            {ov.outlet ? (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-white/80">
                <MapPin className="size-4" aria-hidden="true" />
                {ov.outlet.location}
              </span>
            ) : null}
          </div>
          <Link href={NEW_REQUEST_HREF} className="ap-btn mt-4 h-11 bg-[rgba(255,255,255,.95)] text-(--client-wine)! hover:bg-white max-[480px]:w-full">
            <UserPlus className="size-4" aria-hidden="true" /> Request staff
          </Link>
        </div>

        {/* Frosted card: facts only - clock-ins recorded today out of those scheduled. */}
        <div className="client-glass rounded-2xl p-4 min-[768px]:w-[250px]">
          <div className="flex items-baseline gap-2">
            <b className="text-[34px] leading-none font-bold tabular-nums">{ov.checkedIn}</b>
            <span className="text-[14px] font-bold">checked in</span>
          </div>
          <p className="mt-1 text-[13px] text-(--ap-muted)">out of {m.scheduled} scheduled today</p>
          <Link href={attendanceHref({ date: "today" })} className="ap-btn ap-btn-p ap-btn-sm mt-3 w-full text-white!">
            View live attendance <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
