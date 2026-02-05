"use client";

import { Prize } from "./types";
import { Trophy, Medal, Star } from "lucide-react";
import { MOCK_PRIZES } from "./mock-prizes";
import Image from "next/image";

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
            className="relative overflow-hidden border border-neutral-400 rounded-3xl px-6 py-4 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="relative z-10 flex flex-col gap-4 h-full ">
              <div className="flex flex-col gap-4 flex-1 max-w-[60%]">
                <p className="text-base font-medium text-neutral-700 mb-1">{prize.title}</p>
                <h3 className="text-3xl font-semibold text-neutral-900 leading-tight">
                  {prize.amount}
                </h3>
              </div>

              {/* Certificate Pill */}
              {prize.tags && prize.tags.length > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full w-fit">
                  <Trophy className="w-4 h-4 text-neutral-700" />
                  <span className="text-xs font-base bg-primary-100 text-neutral-700">
                    {prize.tags[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="hidden md:block">
              <div className="w-40 h-36 rounded-[50%] bg-primary-900 absolute -right-5 -bottom-20"></div>
              <div className="absolute right-0 bottom-0 w-37 h-37">
                <Image src={`/illustrations/prices/${prize.image}`} alt={prize.title} width={160} height={160} className="absolute top-0" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
