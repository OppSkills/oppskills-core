import Image from "next/image";

interface ListingItem {
  name: string;
  university: string;
  applied: number;
  finalized: number;
  image: string;
}

const listings: ListingItem[] = [
  {
    name: "Hackathon Name",
    university: "Guru Jambheshwar University Science and Technology, Hisar",
    applied: 112,
    finalized: 30,
    image: "/images/hackathon-placeholder.jpg", // Placeholder - relies on existing or generic
  },
  {
    name: "Hackathon Name",
    university: "Guru Jambheshwar University Science and Technology, Hisar",
    applied: 112,
    finalized: 30,
    image: "/images/hackathon-placeholder.jpg",
  },
  {
    name: "Hackathon Name",
    university: "Guru Jambheshwar University Science and Technology, Hisar",
    applied: 112,
    finalized: 30,
    image: "/images/hackathon-placeholder.jpg",
  },
];

export default function RecentListing() {
  return (
    <div className="w-full bg-background rounded-[20px] p-6 border border-border flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4">Recent Listing</h2>
      <div className="flex flex-col gap-4">
        {listings.map((item, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row gap-4 p-3 rounded-[12px] border border-border/60 bg-background hover:border-primary/30 transition-colors"
          >
            {/* Image Placeholder - using a gradient div if image missing, or fallback */}
            <div className="w-full sm:w-[120px] h-[120px] sm:h-[70px] relative rounded-md overflow-hidden bg-slate-900 shrink-0">
              {/* Pseudo-image since we might not have the asset */}
              <div className="absolute inset-0 flex items-center justify-center text-background/50 text-[10px] font-bold tracking-widest">
                HACKATHON
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent"></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
              <div className="flex-1 flex flex-col justify-center">
                <p className="font-semibold text-neutral-800">{item.name}</p>
                <p className="text-xs text-neutral-600 line-clamp-2 mt-1">
                  {item.university}
                </p>
              </div>

              <div className="flex sm:flex-col gap-2 justify-start sm:justify-center min-w-[100px]">
                <div className="flex items-center justify-between bg-neutral-200 rounded-sm px-2 py-1 gap-2">
                  <span className="text-xs text-primary-800">Applied</span>
                  <span className="text-xs text-primary-800">
                    {item.applied}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-neutral-200 rounded-sm px-2 py-1">
                  <span className="text-xs text-primary-800">Finalized</span>
                  <span className="text-xs text-primary-800">
                    {item.finalized}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
