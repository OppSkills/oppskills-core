import Image from "next/image";
import Link from "next/link";
import NoDataPlaceholder from "./NoDataPlaceholder";
import { cn } from "@/lib/utils";
import { 
  MotionContainer, 
  MotionItem 
} from "@/components/ui/derived/MotionWrapper";
import { Users2, ArrowRight } from "lucide-react";

export interface RecentListingItem {
  title: string;
  slug: string;
  thumbnail: string | null;
  tregistrations: number;
  type: string;
}

export default function RecentListing({ data }: { data: RecentListingItem[] }) {
  return (
    <div className="w-full bg-background rounded-[32px] p-8 border border-border/40 flex flex-col h-full min-h-[400px] shadow-sm relative overflow-hidden backdrop-blur-sm">
      {/* Background Decorative Blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200/10 blur-[100px] -z-10 rounded-full" />
      
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Recent Listing</h2>
          <p className="text-xs text-muted-foreground font-medium">Your most recent engagement metrics</p>
        </div>
        <Link 
          href="/dashboard/host" 
          className="group flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors bg-primary-50 px-4 py-2 rounded-full border border-primary-100/50"
        >
          View All
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {(!data || data.length === 0) ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <NoDataPlaceholder message="No listings available" className="h-full border-none p-0" />
        </div>
      ) : (
        <MotionContainer 
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 flex-1"
        >
          {data.map((item, index) => {
            const href = `/dashboard/${item.type.toLowerCase() === "event" ? "events" : "hackathon"}/${item.slug}`;

            return (
              <MotionItem key={index}>
                <Link
                  href={href}
                  className="group relative flex flex-col h-full rounded-[24px] border border-border/50 bg-card/50 hover:bg-white hover:border-primary-200 hover:shadow-xl hover:shadow-primary-100/20 transition-all duration-500 overflow-hidden"
                >
                  {/* Thumbnail Section */}
                  <div className="relative w-full aspect-video rounded-t-2xl overflow-hidden shrink-0">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800">
                        <span className="text-white font-bold opacity-20 text-5xl select-none">
                          {item.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Badge Overlay */}
                    <div className="absolute top-3 right-3">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border",
                        item.type.toLowerCase() === "event" 
                          ? "bg-purple-500/90 text-white border-purple-400/50" 
                          : "bg-pink-500/90 text-white border-pink-400/50"
                      )}>
                        {item.type}
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug mb-4 flex-1">
                      {item.title}
                    </h3>

                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary-50 text-primary-600 font-bold transition-all group-hover:scale-110 group-hover:rotate-6">
                           <Users2 className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Registrations</span>
                          <span className="text-base font-bold text-neutral-800 tabular-nums">
                            {item.tregistrations.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </MotionItem>
            );
          })}
        </MotionContainer>
      )}
    </div>
  );
}
