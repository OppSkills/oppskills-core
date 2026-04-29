import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Full-width dashboard-style panel with header + role cards placeholder */
export function DashboardManageRolesFallback({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-8 p-6 md:p-10",
        className,
      )}
    >
      <Skeleton className="h-4 w-full max-w-2xl rounded-md" />
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-px w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}

/** Profile / settings style: hero block + stacked sections */
export function ProfileLikeFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-8",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 max-w-full rounded-md" />
          <Skeleton className="h-4 w-56 max-w-full rounded-md" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Card list (participants, registrations, transactions) */
export function CardListFallback({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-4xl space-y-4 p-4", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-36 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Opportunity / listing grid */
export function ListingGridFallback({ className }: { className?: string }) {
  return (
    <div className={cn("w-full px-4 py-6", className)}>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Centered minimal block (pass validate, join page, etc.) */
export function CenteredCardFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-[50vh] w-full flex-col items-center justify-center p-6",
        className,
      )}
    >
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-8">
        <Skeleton className="mx-auto h-12 w-12 rounded-full" />
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

/** Hackathon / competition detail (sidebar + main) */
export function HackathonDetailFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "container mx-auto max-w-7xl space-y-6 p-4 pb-16 sm:px-6 lg:px-8",
        className,
      )}
    >
      <Skeleton className="h-12 w-2/3 max-w-xl rounded-lg" />
      <Skeleton className="h-5 w-full max-w-2xl rounded-md" />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Skeleton className="min-h-[420px] w-full rounded-2xl" />
        <Skeleton className="min-h-[420px] w-full rounded-2xl" />
      </div>
    </div>
  );
}

/** Table / dense dashboard (manage registration) */
export function TableBlockFallback({ className }: { className?: string }) {
  return (
    <div className={cn("w-full space-y-4 p-4 md:p-6", className)}>
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-10 flex-1 rounded-lg md:max-w-xs" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <Skeleton className="h-[480px] w-full rounded-xl" />
    </div>
  );
}

/** Stacked blocks for registration Q&A / long forms */
export function StackedFieldsFallback({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full space-y-4 py-6", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** 4-column analytics / stats cards placeholder */
export function StatsGridFallback({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-3xl" />
      ))}
    </div>
  );
}
