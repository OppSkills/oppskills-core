import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, MapPin, Users, Trophy, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Competition } from "./CompetitionCard";

interface CompetitionListItemProps {
  competition: Competition;
}

export function CompetitionListItem({ competition }: CompetitionListItemProps) {
  const startDate = competition.startDate
    ? format(new Date(competition.startDate), "MMM d, yyyy")
    : "TBD";

  // Fallback image if no banner
  const bannerUrl =
    competition.bannerUrl ||
    "https://images.unsplash.com/photo-1504384308090-c54be3852f33?q=80&w=600&auto=format&fit=crop";

  return (
    <Link
      href={`/hackathons/${competition.slug}`}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-lg border bg-card p-4 transition-all hover:bg-accent/50 sm:flex-row sm:items-center"
    >
      {/* Thumbnail */}
      <div className="h-32 w-full shrink-0 overflow-hidden rounded-md sm:h-24 sm:w-40">
        <img
          src={bannerUrl}
          alt={competition.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Main Info */}
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {competition.isDraft && (
            <Badge variant="secondary" className="bg-yellow-500/90 text-white">
              Draft
            </Badge>
          )}
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 text-primary"
          >
            {competition.mode || "Online"}
          </Badge>
          {competition.tags?.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs font-normal"
            >
              {tag}
            </Badge>
          ))}
        </div>

        <div>
          <h3 className="line-clamp-1 text-lg font-bold group-hover:text-primary-500 transition-colors">
            {competition.title}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground sm:line-clamp-1">
            {competition.shortDescription || "No description provided."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {startDate}
          </span>
          {competition.location && competition.mode !== "ONLINE" && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {competition.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {competition.registrationCount || 0} enrolled
          </span>
        </div>
      </div>

      {/* Action / Right Side */}
      <div className="hidden shrink-0 flex-col items-end justify-center gap-2 sm:flex">
        <span className="flex items-center gap-1 text-sm font-bold text-primary">
          <Trophy className="h-4 w-4" />
          $10,000
        </span>
        <ButtonMock />
      </div>
    </Link>
  );
}

// Just a visual element to mimic a button
function ButtonMock() {
  return (
    <div className="h-8 w-8 rounded-full bg-background border flex items-center justify-center group-hover:bg-primary-500 group-hover:border-primary-500 transition-colors">
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
    </div>
  );
}
