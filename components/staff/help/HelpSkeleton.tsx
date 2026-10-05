const sk = "ap-shimmer rounded-2xl";

/** Also used by app/staff/help/loading.tsx (server-safe: no hooks). */
export function HelpSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading help and support">
      <div className="pt-3 pb-5">
        <h1 className="ap-serif text-[30px] min-[768px]:text-[44px]">Help &amp; support</h1>
        <div className={`${sk} mt-3 h-4 w-72 max-w-full`} />
      </div>
      <div className="flex flex-col gap-5">
        <div className={`${sk} h-[240px]`} />
        <div className={`${sk} h-[180px]`} />
      </div>
    </div>
  );
}
