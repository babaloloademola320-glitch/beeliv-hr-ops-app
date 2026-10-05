import { Exclaim, RefreshCw } from "@/components/applicant/icons";
import { CARD } from "@/components/applicant/SectionCard";

/**
 * "Couldn't load" state for Staff pages. Larger than the generic EmptyState
 * (project lead: wider, with bigger text on desktop): serif title, body-size
 * copy, full-height button. Phones keep a comfortable, full-width layout.
 */
export function ErrorPanel({ title, retry }: { title: string; retry: () => void }) {
  return (
    <div className={`${CARD} flex items-start gap-5 p-6 max-[640px]:flex-col max-[640px]:gap-4 min-[768px]:p-8 min-[1101px]:p-10`} role="alert">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#C8102E] text-white min-[1101px]:size-16">
        <Exclaim className="size-7" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="ap-serif text-[26px] leading-tight min-[768px]:text-[30px] min-[1101px]:text-[34px]">{title}</h2>
        <p className="ap-bd mt-2 max-w-[56ch]">Check your connection and try again. Nothing on your account has changed.</p>
        <button type="button" onClick={retry} className="ap-btn ap-btn-p mt-5 h-12 px-6 text-white! max-[640px]:w-full">
          <RefreshCw className="size-4" aria-hidden="true" /> Try again
        </button>
      </div>
    </div>
  );
}
