const sk = "ap-shimmer rounded-2xl";

/** Also used by app/staff/records/loading.tsx (server-safe: no hooks). */
export function RecordsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your records">
      <div className="pt-3 pb-5">
        <h1 className="ap-serif text-[30px] min-[768px]:text-[44px]">Warnings &amp; Records</h1>
        <div className={`${sk} mt-3 h-4 w-72 max-w-full`} />
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${sk} h-[92px]`} />
        ))}
      </div>
    </div>
  );
}
