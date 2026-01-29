import { Loader2 } from "lucide-react";

interface EventsSectionSkeletonProps {
    title: string;
    subtitle: string;
}

export function EventsSectionSkeleton({
    title,
    subtitle,
}: EventsSectionSkeletonProps) {
    return (
        <section className="w-full pt-12 md:pt-16 lg:pt-20 bg-background">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="mb-8 space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
                        {title}
                    </h2>
                    <p className="text-muted-foreground text-lg inter">{subtitle}</p>
                </div>
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        </section>
    );
}
