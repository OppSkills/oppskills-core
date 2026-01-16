import NoDataPlaceholder from "./NoDataPlaceholder";

export interface HighestPerformingItem {
  title: string;
  slug: string;
  thumbnail: string | null;
  tregistrations: number;
}

export interface HighestPerformingData {
  event: HighestPerformingItem | null;
  hackathon: HighestPerformingItem | null;
}

export default function Alerts({ data }: { data: HighestPerformingData | null }) {

  const items = [];
  if (data?.event && data.event.tregistrations > 1000) {
    items.push({
      ...data.event,
      type: "Event",
      message: `Your event is doing great, it got ${data.event.tregistrations} registrations.`
    });
  }
  if (data?.hackathon && data.hackathon.tregistrations > 1000) {
    items.push({
      ...data.hackathon,
      type: "Hackathon",
      message: `Your hackathon is doing great, it got ${data.hackathon.tregistrations} registrations.`
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-background rounded-[20px] p-6 border border-border flex flex-col h-full min-h-[400px]">
      <h2 className="text-xl font-bold mb-4">Performance Alerts</h2>
      <div className="flex flex-col gap-4 flex-1">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-center p-4 rounded-[12px] border border-border/60 bg-background hover:border-primary/30 transition-colors gap-2"
          >
            <div className="flex flex-col gap-1 max-w-[70%]">
              <p className="font-semibold text-foreground text-md line-clamp-1">
                {item.title}
              </p>
              <p className="text-xs text-neutral-600 line-clamp-2 leading-tight">
                {item.message}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center rounded-lg border overflow-hidden text-xs border-green-300">
              <div className="bg-green-100 text-green-700 w-full text-center py-1 border-b border-green-300 whitespace-nowrap px-2">
                <p>Top Performing</p>
              </div>
              <div className="py-1 px-4 flex justify-center w-full text-green-900 text-sm whitespace-nowrap font-bold">
                <p>{item.tregistrations}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
