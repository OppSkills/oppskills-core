
interface EventsEmptyStateProps {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyMessage: string;
}

export function EventsEmptyState({
    title,
    subtitle,
    emptyTitle,
    emptyMessage,
}: EventsEmptyStateProps) {
    return (
        <section className="w-full pt-12 md:pt-16 lg:pt-20 bg-background">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="mb-8 space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
                        {title}
                    </h2>
                    <p className="text-muted-foreground text-lg inter">{subtitle}</p>
                </div>
                <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-border bg-muted/20">
                    <div className="relative mb-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-purple-600 "
                            >
                                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                <line x1="16" x2="16" y1="2" y2="6" />
                                <line x1="8" x2="8" y1="2" y2="6" />
                                <line x1="3" x2="21" y1="10" y2="10" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground poppins mb-2">
                        {emptyTitle}
                    </h3>
                    <p className="text-muted-foreground text-center max-w-md inter">
                        {emptyMessage}
                    </p>
                </div>
            </div>
        </section>
    );
}
