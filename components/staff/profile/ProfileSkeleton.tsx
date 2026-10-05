const sk = "ap-shimmer rounded-2xl";

/** Also used by app/staff/profile/loading.tsx (server-safe: no hooks). */
export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading your profile">
      <h1 className="sr-only">Profile</h1>
      <div className={`${sk} mt-3 h-[150px]`} />
      <div className="grid grid-cols-1 gap-5 min-[1241px]:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-5">
          <div className={`${sk} h-[230px]`} />
          <div className={`${sk} h-[200px]`} />
          <div className={`${sk} h-[110px]`} />
        </div>
        <div className="flex flex-col gap-5">
          <div className={`${sk} h-[170px]`} />
          <div className={`${sk} h-[170px]`} />
        </div>
      </div>
    </div>
  );
}
