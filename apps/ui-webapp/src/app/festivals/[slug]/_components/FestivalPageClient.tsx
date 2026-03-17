"use client";

import React, { useMemo } from "react";
import { useFestivalBySlug } from "@/hooks/useFestivalBySlug";
import { usePublicHackathons } from "@/hooks/usePublicHackathons";
import { useEvents } from "@/hooks/useEvents";
import { Loader2, AlertCircle } from "lucide-react";
import FestivalDetailsClient from "./FestivalDetailsClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface FestivalPageClientProps {
  slug: string;
}

export default function FestivalPageClient({ slug }: FestivalPageClientProps) {
  const { 
    data: festival, 
    isLoading: isLoadingFestival, 
    isError: isErrorFestival,
    error: festivalError
  } = useFestivalBySlug(slug);

  const festivalId = (festival as any)?.id;

  const { 
    data: hackathonsData, 
    isLoading: isLoadingHackathons 
  } = usePublicHackathons(festivalId, undefined, { enabled: !!festivalId });

  const { 
    data: eventsData, 
    isLoading: isLoadingEvents 
  } = useEvents(festivalId, undefined, { enabled: !!festivalId });

  // Flatten infinite query results
  const hackathons = useMemo(() => {
    return hackathonsData?.pages.flatMap(page => page) || [];
  }, [hackathonsData]);

  const events = useMemo(() => {
    return eventsData?.pages.flatMap(page => page) || [];
  }, [eventsData]);

  if (isLoadingFestival) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        <p className="text-neutral-500 font-medium">Loading festival details...</p>
      </div>
    );
  }

  if (isErrorFestival || !festival) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-6">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-3">
          {festivalError instanceof Error && (festivalError as any).response?.status === 404 
            ? "Festival Not Found" 
            : "Oops! Something went wrong"}
        </h1>
        <p className="text-neutral-600 max-w-md mb-8">
          {festivalError instanceof Error && (festivalError as any).response?.status === 404
            ? "The festival you're looking for doesn't exist or has been removed."
            : "We couldn't load the festival details. Please try again later or contact support if the problem persists."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/festivals">
            <Button variant="outline" className="rounded-full px-8">
              Browse All Festivals
            </Button>
          </Link>
          <Button 
            onClick={() => window.location.reload()} 
            className="rounded-full px-8"
          >
            Retry Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FestivalDetailsClient
      festival={festival}
      hackathons={hackathons}
      events={events}
    />
  );
}
