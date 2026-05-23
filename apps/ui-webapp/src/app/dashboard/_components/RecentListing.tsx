import Image from "next/image";
import Link from "next/link";
import NoDataPlaceholder from "./NoDataPlaceholder";
import { cn, normalizeUrl, isValidUrl } from "@/lib/utils";
import {
  MotionContainer,
  MotionItem,
} from "@/components/ui/derived/MotionWrapper";
import { Users2, ArrowRight } from "lucide-react";

export interface RecentListingItem {
  title: string;
  slug: string;
  thumbnail: string | null;
  description: string;
  organization: string;
  location: string;
  applied: number;
  finalized: number;
  type: string;
}

export default function RecentListing({ data }: { data: RecentListingItem[] }) {
  return (
    <div className="w-full bg-background rounded-3xl p-4 lg:p-5 border-2 border-neutral-400 flex flex-col h-full min-h-[400px] shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Recent Listing
        </h2>
      </div>

      {!data || data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <NoDataPlaceholder
            message="No listings available"
            className="h-full border-none p-0"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data.map((item, index) => {
            const href = `/dashboard/${item.type.toLowerCase() === "event" ? "events" : "hackathon"}/${item.slug}`;

            const thumbSrc = normalizeUrl(item.thumbnail);
            const isValidThumbnail = isValidUrl(thumbSrc);

            return (
              <MotionItem key={index}>
                <Link
                  href={href}
                  className="group flex flex-col sm:flex-row items-center gap-4 p-2 rounded-2xl border border-border/60 hover:border-primary-200 hover:shadow-lg transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="relative w-full sm:w-32 aspect-video sm:aspect-4/3 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                    {isValidThumbnail && thumbSrc ? (
                      <Image
                        src={thumbSrc}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800">
                        <span className="text-white font-bold opacity-20 text-5xl select-none">
                          {item.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
                    <p className="text-xl text-neutral-800 line-clamp-1 group-hover:text-primary-600 transition-colors">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground/80 mt-2 line-clamp-2 italic wrap-break-word">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Stats Badges */}
                  <div className="flex flex-row sm:flex-col gap-2 shrink-0 sm:min-w-30">
                    <div className="flex items-center justify-between gap-4 px-4 py-1 rounded-lg bg-primary-200 text-primary-900">
                      <span className="text-sm ">Applied</span>
                      <span className="text-base tabular-nums">
                        {(
                          item.applied ??
                          (item as any).tregistrations ??
                          0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-1 rounded-lg bg-primary-200 text-primary-900">
                      <span className="text-sm">Finalized</span>
                      <span className="text-base tabular-nums">
                        {(item.finalized ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              </MotionItem>
            );
          })}
        </div>
      )}
    </div>
  );
}
