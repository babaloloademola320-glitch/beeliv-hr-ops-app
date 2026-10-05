import type { Metadata } from "next";
import { HomeBody } from "@/components/public/HomeBody";
import { MenuProvider, StickyBar } from "@/components/public/SiteHeader";
import { HERO } from "@/lib/public-site/content";
import { getFeaturedJobs } from "@/lib/public-site/jobs";

export const metadata: Metadata = {
  title: { absolute: "Beeliv Hospitality" },
  description: HERO.body,
};

export default async function HomePage() {
  // Static placeholder data today; swap the body of getFeaturedJobs() for a
  // real query later - nothing here changes.
  const jobs = await getFeaturedJobs();
  return (
    <MenuProvider>
      <StickyBar sentinelId="ps-hero-end" />
      <HomeBody jobs={jobs} />
    </MenuProvider>
  );
}
