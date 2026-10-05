const sk = "ap-shimmer rounded-2xl";

/** Also used by app/staff/notifications/loading.tsx (server-safe: no hooks). */
export function NotificationsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your notifications">
      <div className="pt-3 pb-5">
        <h1 className="ap-serif text-[30px] min-[768px]:text-[44px]">Notifications</h1>
        <div className={`${sk} mt-3 h-4 w-72 max-w-full`} />
      </div>
      <div className={`${sk} mb-[18px] h-12 w-60 max-w-full`} />
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${sk} h-[92px]`} />
        ))}
      </div>
    </div>
  );
}
