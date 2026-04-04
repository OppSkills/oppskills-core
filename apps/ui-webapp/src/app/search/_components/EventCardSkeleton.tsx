import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function EventCardSkeleton() {
    return (
        <Card className="h-full flex flex-col overflow-hidden border-border/50 bg-card rounded-3xl">
            {/* Image Section */}
            <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-muted flex-shrink-0">
                <Skeleton className="w-full h-full" />
                
                {/* Bottom Left Badge Skeleton */}
                <div className="absolute bottom-0 left-0 flex items-center">
                    <div className="py-2 pr-4 pl-6 bg-background rounded-tr-lg">
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="relative bg-card pt-4 px-5 pb-5 flex flex-col flex-1 min-h-[140px] space-y-3">
                <div className="flex-1 flex flex-col space-y-2">
                    <Skeleton className="h-6 w-full rounded-lg" />
                    <Skeleton className="h-6 w-3/4 rounded-lg" />
                    <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>

                <div className="mt-auto pt-4 border-t border-border/20 flex justify-between gap-4">
                    <div className="space-y-1">
                        <Skeleton className="h-2 w-12 rounded-md" />
                        <Skeleton className="h-4 w-16 rounded-md" />
                    </div>
                    <div className="space-y-1">
                        <Skeleton className="h-2 w-12 rounded-md" />
                        <Skeleton className="h-4 w-16 rounded-md" />
                    </div>
                    <div className="space-y-1 text-right">
                        <Skeleton className="h-2 w-12 ml-auto rounded-md" />
                        <Skeleton className="h-4 w-16 ml-auto rounded-md" />
                    </div>
                </div>
            </div>
        </Card>
    )
}
