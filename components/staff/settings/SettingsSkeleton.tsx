const sk = "ap-shimmer rounded-2xl";

/** Also used by app/staff/settings/loading.tsx (server-safe: no hooks). */
export function SettingsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your settings">
      <div className="pt-3 pb-5">
        <h1 className="ap-serif text-[30px] min-[768px]:text-[44px]">Settings</h1>
        <div className={`${sk} mt-3 h-4 w-72 max-w-full`} />
      </div>
      <div className="flex flex-col gap-5">
        <div className={`${sk} h-[240px]`} />
        <div className={`${sk} h-[180px]`} />
      </div>
    </div>
  );
}
