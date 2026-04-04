"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSearch } from "@/hooks/useSearch";
import OpportunityCard from "./OpportunityCard";
import OpportunityCardSkeleton from "./_components/OpportunityCardSkeleton";
import EventCardSkeleton from "./_components/EventCardSkeleton";
import { EventCard } from "@/components/landingpage/_components/EventCard";
import { Search, Sparkles, Trophy, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { motion } from "framer-motion";

function SearchLoadingSkeleton() {
    return (
        <div className="container w-full px-0 sm:px-6 lg:px-8 pb-8 sm:pt-12 xl:px-24">
            <div className="flex w-full flex-col gap-8 md:gap-12 lg:gap-16 xl:gap-20">
                {/* Top Opportunities Skeleton */}
                <section className="space-y-4">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <OpportunityCardSkeleton key={`top-skel-${i}`} />
                        ))}
                    </div>
                </section>

                {/* Hackathons Skeleton */}
                <section className="space-y-8">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-8 w-48 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <EventCardSkeleton key={`hack-skel-${i}`} />
                        ))}
                    </div>
                </section>

                {/* Events Skeleton */}
                <section className="space-y-8">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-8 w-48 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <EventCardSkeleton key={`ev-skel-${i}`} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

function SearchEmptyState({ 
    title, 
    subtitle, 
    emptyTitle, 
    emptyMessage,
    onClear
}: { 
    title?: string;
    subtitle?: string;
    emptyTitle: string; 
    emptyMessage: string;
    onClear?: () => void;
}) {
    return (
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-primary-50 flex items-center justify-center rotate-12 transition-transform hover:rotate-0 duration-500">
                    <Search className="w-10 h-10 text-primary-500 -rotate-12" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center animate-bounce">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
            </div>
            
            <div className="space-y-2 max-w-sm">
                <h3 className="text-2xl font-bold text-neutral-900">{emptyTitle}</h3>
                <p className="text-neutral-500">{emptyMessage}</p>
            </div>

            {onClear && (
                <Button 
                    variant="outline" 
                    onClick={onClear}
                    className="rounded-full border-neutral-200 hover:bg-neutral-50"
                >
                    Clear Search
                </Button>
            )}
        </div>
    );
}

function SearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";
    const { data, isLoading, isError } = useSearch(query);

    const handleClear = () => {
        router.push("/search");
    };

    if (!query) {
        return (
            <SearchEmptyState
                emptyTitle="Start Searching"
                emptyMessage="Enter a keyword to discover the best hackathons and events in your area."
            />
        );
    }

    if (isLoading) {
        return <SearchLoadingSkeleton />;
    }

    if (isError || !data) {
        return (
            <SearchEmptyState
                emptyTitle="Oops! Something went wrong"
                emptyMessage="We're having trouble fetching results right now. Please try again in 
                a few moments."
                onClear={handleClear}
            />
        );
    }

    const hasResults =
        data.hackathons.length > 0 ||
        data.events.length > 0 ||
        data.topOpportunities.length > 0;

    if (!hasResults) {
        return (
            <SearchEmptyState
                emptyTitle="No results found"
                emptyMessage={`We couldn't find any opportunities matching "${query}". Try using broader keywords.`}
                onClear={handleClear}
            />
        );
    }

    return (
        <div className="container w-full px-0 sm:px-6 lg:px-8 pb-8 sm:pt-12 xl:px-25">
            <div className="flex w-full flex-col gap-8 md:gap-12 lg:gap-16 xl:gap-20">
                {/* Top Opportunities */}
                {data.topOpportunities.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">Top Matches</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {data.topOpportunities.map((opportunity, idx) => (
                                <motion.div
                                    key={`${opportunity.type}-${opportunity.id}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <OpportunityCard opportunity={opportunity} />
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Hackathons Section */}
                {data.hackathons.length > 0 && (
                    <section className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">Hackathons</h2>

                            <Link href="/hackathons">
                                <Button variant="ghost" className="text-primary-600 hover:text-primary-700 hover:bg-primary-50">
                                    View All <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {data.hackathons.map((hackathon, idx) => (
                                <motion.div
                                    key={`hackathon-${hackathon.id}`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <EventCard event={{ ...hackathon, type: "HACKATHON" }} />
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Events Section */}
                {data.events.length > 0 && (
                    <section className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">Events</h2>

                            <Link href="/events">
                                <Button variant="ghost" className="text-primary-600 hover:text-primary-700 hover:bg-primary-50">
                                    View All <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {data.events.map((event, idx) => (
                                <motion.div
                                    key={`event-${event.id}`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <EventCard event={{ ...event, type: "EVENT" }} />
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <main className="min-h-screen bg-neutral-50/50">
            <Suspense fallback={<SearchLoadingSkeleton />}>
                <SearchContent />
            </Suspense>
        </main>
    );
}