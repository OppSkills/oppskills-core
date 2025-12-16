'use client';

import React from 'react';
import { Prize } from './types';
import { Trophy, Medal, Star } from 'lucide-react';

interface PrizesProps {
  prizes: Prize[];
}

export function Prizes({ prizes }: PrizesProps) {
  const getIcon = (type?: string) => {
    switch (type) {
      case 'trophy': return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 'medal': return <Medal className="w-8 h-8 text-zinc-400" />;
      case 'star': return <Star className="w-8 h-8 text-orange-500" />;
      default: return <Trophy className="w-8 h-8 text-purple-500" />;
    }
  };

  const getGradient = (index: number) => {
    const gradients = [
      'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-yellow-200 dark:border-yellow-900/30',
      'bg-gradient-to-br from-zinc-50 to-slate-50 dark:from-zinc-900/10 dark:to-slate-900/10 border-zinc-200 dark:border-zinc-800',
      'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 border-orange-200 dark:border-orange-900/30'
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
        Prizes
      </h2>
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
             <div className="p-4 bg-white dark:bg-zinc-900 rounded-full shadow-sm mb-2">
                {getIcon(prize.icon)}
             </div>
             
             <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {prize.title}
                </h3>
                <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 mt-1">
                  {prize.amount}
                </div>
             </div>
             
             <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
               {prize.description}
             </p>
          </div>
        ))}
      </div>
    </div>
  );
}
