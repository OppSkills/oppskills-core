import { Skeleton } from "@/components/ui/skeleton";

interface EventsSectionSkeletonProps {
  title: string;
  subtitle: string;
}

export function EventsSectionSkeleton({
  title,
  subtitle,
}: EventsSectionSkeletonProps) {
  return (
    <section className="w-full pt-8 md:pt-12 lg:pt-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8 space-y-2">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
            {title}
          </h2>
          <p className="text-muted-foreground text-lg inter">{subtitle}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </section>
  );
}
