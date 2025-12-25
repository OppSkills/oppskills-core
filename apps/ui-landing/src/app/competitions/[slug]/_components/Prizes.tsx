"use client";

import React from "react";
import { Prize } from "./types";
import { Trophy, Medal, Star } from "lucide-react";

interface PrizesProps {
  prizes: Prize[];
}

export function Prizes({ prizes }: PrizesProps) {
  const getIcon = (type?: string) => {
    switch (type) {
      case "trophy":
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case "medal":
        return <Medal className="w-8 h-8 text-neutral-400" />;
      case "star":
        return <Star className="w-8 h-8 text-orange-500" />;
      default:
        return <Trophy className="w-8 h-8 text-purple-500" />;
    }
  };

  const getGradient = (index: number) => {
    const gradients = [
      "bg-gradient-to-br from-yellow-50 to-orange-50   border-yellow-200 ",
      "bg-gradient-to-br from-neutral-50 to-slate-50   border-neutral-200 ",
      "bg-gradient-to-br from-orange-50 to-red-50   border-orange-200 ",
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-900  mb-6">Prizes</h2>
      {prizes.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-neutral-50  border border-dashed rounded-xl">
          No prizes announced yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {prizes.map((prize, index) => (
            <div
              key={prize.id}
              className={`
                relative p-6 rounded-2xl border flex flex-col items-center text-center space-y-4
                ${getGradient(index)}
                hover:shadow-lg transition-all duration-300 hover:-translate-y-1
              `}
            >
              <div className="p-4 bg-background  rounded-full shadow-sm mb-2">
                {getIcon(prize.icon)}
              </div>

              <div>
                <h3 className="text-lg font-bold text-neutral-900 ">
                  {prize.title}
                </h3>
                <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600   mt-1">
                  {prize.amount}
                </div>
              </div>

              <p className="text-sm text-neutral-600  leading-relaxed">
                {prize.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
