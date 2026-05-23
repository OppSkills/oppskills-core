import { Skeleton } from "@/components/ui/skeleton";

export default function OpportunityCardSkeleton() {
  return (
    <div className="flex w-full flex-col gap-4 relative">
      <div className="relative rounded-2xl overflow-hidden aspect-video">
        <Skeleton className="w-full h-full" />
        <div className="absolute bottom-2 left-2">
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
      </div>
      <div className="flex w-full justify-between pt-2">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
        <div className="space-y-1 text-right">
          <Skeleton className="h-3 w-16 ml-auto rounded-md" />
          <Skeleton className="h-5 w-24 ml-auto rounded-md" />
        </div>
      </div>
    </div>
  );
}
