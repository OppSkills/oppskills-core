import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { MapPin, Calendar } from "lucide-react";

export interface FestivalListItem {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  posterImageUrl?: string | null;
  bannerImageUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  locationCity?: string | null;
  locationAddress?: string | null;
  status?: string;
  organizationName?: string | null;
}

interface FestivalCardProps {
  festival: FestivalListItem;
}

export function FestivalCard({ festival }: FestivalCardProps) {
  const imageSrc = festival.posterImageUrl || festival.bannerImageUrl;

  const formattedDate = festival.startDate
    ? format(new Date(festival.startDate), "dd MMM yyyy")
    : "Date TBD";

  const location =
    festival.locationCity || festival.locationAddress || "Location TBD";

  return (
    <Link href={`/festivals/${festival.slug}`} prefetch={false} className="h-full block">
      <Card className="group h-full flex flex-col overflow-hidden border-border/50 bg-card hover:shadow-lg transition-all duration-300 rounded-3xl">
        {/* Image Section */}
        <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-muted flex-shrink-0">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={festival.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600">
              <span className="text-white font-bold opacity-30 text-5xl">
                {festival.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

          {/* Bottom badge */}
          <div className="absolute -bottom-0.5 left-0 flex items-center">
            <div className="py-1 pr-3 pl-5 bg-background text-amber-600 text-xs rounded-tr-lg flex gap-2 items-center">
              <span>Festival</span>
              <span className="text-[6px]">  ●  </span>
              <span>{festival.status === "PUBLISHED" ? "Open" : festival.status ?? "Upcoming"}</span>
            </div>
            <div className="relative -left-[0.5px] -top-[0.5px] self-stretch w-5 flex-1 overflow-hidden">
              <Image
                src="/illustrations/curve.svg"
                alt="curve"
                fill
                className="object-cover object-right"
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative bg-card pt-4 px-5 pb-5 flex flex-col flex-1 min-h-[140px]">
          <div className="flex-1 flex flex-col">
            <h3 className="text-xl text-neutral-900 font-semibold line-clamp-2 leading-tight tracking-tight min-h-[3.25rem]">
              {festival.name}
            </h3>
            {festival.organizationName && (
              <p className="text-neutral-600 text-xs line-clamp-1 mt-1">
                {festival.organizationName}
              </p>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between text-sm pt-2">
            <div className="flex items-center gap-1 text-neutral-500">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-500">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs font-medium truncate max-w-[120px]">{location}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
