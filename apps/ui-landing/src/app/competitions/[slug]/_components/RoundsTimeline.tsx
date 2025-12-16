'use client';

import React from 'react';
import { Round } from './types';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface RoundsTimelineProps {
  rounds: Round[];
}

export function RoundsTimeline({ rounds }: RoundsTimelineProps) {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
        Rounds Timeline
      </h2>
      
      <div className="space-y-6">
        {rounds.map((round, index) => {
          const roundNumber = index + 1;
          
          return (
             <div key={round.id} className="flex gap-6 relative">
                
                {/* Vertical Connector Line */}
                {index !== rounds.length - 1 && (
                  <div className="absolute left-[24px] top-[48px] bottom-[-24px] w-[2px] bg-[#eaccf7]" />
                )}

                {/* Badge Column using absolute positioning context is tricky if heights vary, 
                    but here flex is better. The line needs to align with center of badge.
                    The badge is 48x48. Center is 24px.
                */}
                <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="w-12 h-12 bg-[#eaccf7] rounded-lg flex items-center justify-center z-10">
                        <span className="text-lg font-bold text-[#3c0055]">R{roundNumber}</span>
                    </div>
                </div>

                {/* Card */}
                <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                   <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                     {round.name}
                   </h3>
                   <p className="text-sm text-zinc-500 mb-4">
                      Round Description in 5 lines
                   </p>
                   
                   <p className="text-sm text-zinc-500 mb-4">
                     {round.description}
                   </p>

                   <div className="space-y-2 mt-4">
                     <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                        <Calendar className="w-4 h-4 text-zinc-500 stroke-[2] opacity-80" />
                        <span className="text-sm">Start: {round.startDate}</span>
                     </div>
                     <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                        <Calendar className="w-4 h-4 text-zinc-500 stroke-[2] opacity-80" />
                        <span className="text-sm">End: {round.endDate}</span>
                     </div>
                   </div>
                </div>
             </div>
          );
        })}
      </div>
    </div>
  );
}
