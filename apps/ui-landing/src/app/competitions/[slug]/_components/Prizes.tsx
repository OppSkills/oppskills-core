"use client";

import { Prize } from "./types";
import { Trophy, Medal, Star } from "lucide-react";
import { MOCK_PRIZES } from "./mock-prizes";

interface PrizesProps {
  prizes: Prize[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Prizes({ prizes: _prizes }: PrizesProps) {
  // Use mock data for now as requested
  const prizes = MOCK_PRIZES;

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-semibold text-neutral-800">Prizes</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {prizes.map((prize) => (
          <div
            key={prize.id}
            className="relative overflow-hidden border border-neutral-400 rounded-3xl p-6 h-48 md:h-56 shadow-sm hover:shadow-md transition-all duration-300"
          >
            {/* Content Left */}
            <div className="relative z-10 flex flex-col justify-between h-full max-w-[60%]">
              <div>
                <p className="text-lg font-medium text-neutral-500 mb-1">{prize.title}</p>
                <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 leading-tight">
                  {prize.amount}
                </h3>
              </div>

              {/* Certificate Pill */}
              {prize.tags && prize.tags.length > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full w-fit">
                  {prize.icon === "trophy" && <Trophy className="w-4 h-4 text-neutral-700" />}
                  {prize.icon === "medal" && <Medal className="w-4 h-4 text-neutral-700" />}
                  {prize.icon === "star" && <Star className="w-4 h-4 text-neutral-700" />}
                  <span className="text-xs font-base bg-primary-100 text-neutral-700">
                    {prize.tags[0]}
                  </span>
                </div>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
