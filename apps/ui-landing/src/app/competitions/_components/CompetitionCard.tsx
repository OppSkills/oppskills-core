import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, MapPin, Users, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Placeholder for the type until we have the strict backend type
// Using a loose interface based on typical hackathon data
export interface Competition {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  startDate?: string;
  endDate?: string;
  mode?: string; // ONLINE, OFFLINE, HYBRID
  location?: string;
  bannerUrl?: string;
  status?: string; // DRAFT, PUBLISHED, etc. - or derived status
  prizes?: { totalPrizePool?: string; currency?: string }[];
  maxTeams?: number;
  _count?: {
    participants?: number;
  };
  tags?: string[];
}

interface CompetitionCardProps {
  competition: Competition;
}

export function CompetitionCard({ competition }: CompetitionCardProps) {
  const startDate = competition.startDate
    ? format(new Date(competition.startDate), "MMM d, yyyy")
    : "TBD";

  // Fallback image if no banner
  const bannerUrl =
    competition.bannerUrl ||
    "https://images.unsplash.com/photo-1504384308090-c54be3852f33?q=80&w=600&auto=format&fit=crop";

  return (
    <Card className="flex py-0 gap-0 h-full flex-col overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
      <div className="relative h-40 w-full overflow-hidden bg-muted">
        {/* Ideally use Next.js Image, but using img for now to avoid domain config issues with arbitrary URLs */}
        <img
          src={bannerUrl}
          alt={competition.title}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute right-2 top-2">
          <Badge
            variant="secondary"
            className="bg-background/80 backdrop-blur-sm"
          >
            {competition.mode || "Online"}
          </Badge>
        </div>
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {startDate}
          </span>
          {competition.location && competition.mode !== "ONLINE" && (
            <span
              className="flex items-center gap-1 truncate max-w-[120px]"
              title={competition.location}
            >
              <MapPin className="h-3 w-3" />
              {competition.location}
            </span>
          )}
        </div>
        <Link
          href={`/competitions/${competition.slug}`}
          className="hover:underline"
        >
          <h3 className="line-clamp-1 text-lg font-bold">
            {competition.title}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {competition.shortDescription || "No description provided."}
        </p>
      </CardHeader>

      <CardContent className="mt-auto p-4 pt-0">
        <div className="mt-4 flex flex-wrap gap-2">
          {competition.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="border-t bg-muted/20 p-3 text-xs text-muted-foreground">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1" title="Participants">
              <Users className="h-3.5 w-3.5" />
              {competition._count?.participants || 0}
            </span>
            <span
              className="flex items-center gap-1 text-primary font-medium"
              title="Prize Pool"
            >
              <Trophy className="h-3.5 w-3.5" />
              {/* Placeholder prize logic */}
              $10,000
            </span>
          </div>

          <Button size="sm" variant="ghost" className="h-7 px-2" asChild>
            <Link href={`/competitions/${competition.slug}`}>View Details</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
