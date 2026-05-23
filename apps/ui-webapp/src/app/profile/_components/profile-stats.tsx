"use client";
import { Award, Calendar, ChartLine, Trophy } from "lucide-react";

interface ProfileStatsProps {
  data: {
    events: number;
    hackathon: number;
    certificates: number;
  };
}

export function ProfileStats({ data }: ProfileStatsProps) {
  if (!data) return null;

  return (
    <div className="p-4 bg-neutral-100 rounded-3xl w-full lg:w-[300px] h-fit">
      <div className="bg-linear-to-br from-primary-700 from-10% to-primary-900 to-90% p-6 text-neutral-100 flex flex-col gap-4 rounded-2xl w-full">
        <p className="font-medium text-xl">Your Stats</p>
        <div className="flex flex-col gap-4">
          {[
            {
              title: "Events",
              value: data.events,
              icon: Calendar,
            },
            {
              title: "Hackathon",
              value: data.hackathon,
              icon: Trophy,
            },
            {
              title: "Certificates",
              value: data.certificates,
              icon: Award,
            },
          ].map((e, i) => (
            <div key={i} className="flex w-full justify-between items-center">
              <div className="flex flex-1 gap-3 items-center">
                <e.icon size={20} />
                <p className="text-neutral-200">{e.title}</p>
              </div>
              <div className="font-semibold text-lg">{e.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
