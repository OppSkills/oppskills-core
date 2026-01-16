import Image from "next/image";
import NoDataPlaceholder from "./NoDataPlaceholder";

export interface RecentListingItem {
  title: string;
  slug: string;
  thumbnail: string | null;
  tregistrations: number;
  type: string;
}

export default function RecentListing({ data }: { data: RecentListingItem[] }) {
  return (
    <div className="w-full bg-background rounded-[20px] p-6 border border-border flex flex-col h-full min-h-[400px]">
      <h2 className="text-xl font-bold mb-4">Recent Listing</h2>
      <div className="flex flex-col gap-4 flex-1">
        {(!data || data.length === 0) ? (
          <NoDataPlaceholder message="No listings available" className="h-full border-none p-0" />
        ) : (
          data.map((item, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row gap-4 p-3 rounded-[12px] border border-border/60 bg-background hover:border-primary/30 transition-colors"
            >
              {/* Image Placeholder */}
              <div className="w-full sm:w-[120px] h-[120px] sm:h-[70px] relative rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail}
                    alt={item.title}

                    width={150}
                    height={150}
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50 text-[10px] font-bold tracking-widest uppercase">
                    {item.type}
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 md:gap-6 flex-1">
                <div className="flex-1 flex flex-col justify-center">
                  <p className="font-semibold text-neutral-800 line-clamp-1">{item.title}</p>
                  <p className="text-xs text-neutral-600 line-clamp-1 mt-1">
                    {item.type}
                  </p>
                </div>

                <div className="flex sm:flex-col gap-2 justify-start sm:justify-center min-w-[100px]">
                  <div className="flex items-center justify-between bg-neutral-200 rounded-sm px-2 py-1 gap-2">
                    <span className="text-xs text-primary-800">Registrations</span>
                    <span className="text-xs text-primary-800 font-bold">
                      {item.tregistrations}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
