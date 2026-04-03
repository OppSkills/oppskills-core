"use client";

import { Prize } from "./types";
import { Trophy } from "lucide-react";
import Image from "next/image";

interface PrizesProps {
  prizes: Prize[];
}

export function Prizes({ prizes }: PrizesProps) {
  const displayPrizes = prizes;

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-semibold text-neutral-800">Prizes</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayPrizes.length > 0 ? (
          displayPrizes.map((prize, index) => (
            <div
              key={prize.id || `prize-${index}`}
              className="relative overflow-hidden border border-neutral-400 rounded-3xl px-6 py-4 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="relative z-10 flex flex-col gap-4 h-full ">
                <div className="flex flex-col gap-4 flex-1 max-w-[60%]">
                  <p className="text-base font-medium text-neutral-700 mb-1">
                    {prize.title}
                  </p>
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
                {prize.image && (
                  <div className="absolute right-0 bottom-0 w-37 h-37">
                    <Image
                      src={`/illustrations/prices/${prize.image}`}
                      alt={prize.title || "Prize"}
                      width={160}
                      height={160}
                      className="absolute top-0"
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full border border-dashed border-neutral-300 bg-neutral-50 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 bg-linear-to-r from-primary-100 to-primary-50">
            <div className="p-4 bg-white rounded-full shadow-sm">
              <Trophy className="w-8 h-8 text-neutral-400" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-medium text-neutral-800">
                Organizer has not disclosed any prize
              </p>
              <p className="text-neutral-500 max-w-xs mx-auto">
                Please contact your organizer to know more about the prize
                structure.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
