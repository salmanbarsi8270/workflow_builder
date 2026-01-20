import { Skeleton } from "@/components/ui/skeleton";

export function ConnectionCardSkeleton({
  viewMode = "grid",
}: {
  viewMode?: "grid" | "list";
}) {
  return (
    <div className="relative bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-5 overflow-hidden">

      {/* Status Dot */}
      <Skeleton className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-white/20" />

      <div
        className={`flex ${
          viewMode === "list"
            ? "items-center gap-4"
            : "flex-col gap-5"
        }`}
      >
        {/* Service Icon */}
        <Skeleton
          className={`${
            viewMode === "list" ? "h-12 w-12" : "h-16 w-16"
          } rounded-2xl bg-slate-200 dark:bg-white/10`}
        />

        {/* Main Content */}
        <div className="flex-1 w-full space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-2/3 bg-slate-200 dark:bg-white/10 rounded-xl" />
            <Skeleton className="h-5 w-24 bg-slate-200 dark:bg-white/10 rounded-md" />
          </div>

          <Skeleton className="h-12 w-full bg-slate-200 dark:bg-white/10 rounded-2xl" />

          <div className="flex items-center justify-between pt-2">
             <div className="flex gap-4">
                <Skeleton className="h-10 w-20 bg-slate-200 dark:bg-white/10 rounded-lg" />
                <Skeleton className="h-10 w-20 bg-slate-200 dark:bg-white/10 rounded-lg" />
             </div>
          </div>

          <div className="space-y-3">
             <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded-full" />
             <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-8 w-8 rounded-full border-2 border-white dark:border-[#0f172a] bg-slate-200 dark:bg-white/10" />
                ))}
             </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-white/10">
            <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
