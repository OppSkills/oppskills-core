'use client';

import React, { useEffect } from 'react';
import { useQueryState } from 'nuqs';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const TABS = [
  { id: 'rounds', label: 'Rounds & Status' },
  { id: 'details', label: 'Details' },
  { id: 'prizes', label: 'Prizes' },
  { id: 'reviews', label: 'Reviews' },
];

export function CompetitionTabs({ setCurTab }: { setCurTab: (tab: string) => void }) {
  const [activeTab, setActiveTab] = useQueryState('activeTab', {
    defaultValue: 'rounds',
  });

  useEffect(() => {
    setCurTab(activeTab);
  }, [activeTab]);

  return (
    <div className="w-full border-b border-zinc-200 dark:border-zinc-800 mb-8 overflow-x-auto">
      <div className="flex items-center gap-8 min-w-max">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative py-4 text-sm font-medium transition-colors hover:text-purple-600',
                isActive
                  ? 'text-purple-600'
                  : 'text-zinc-600 dark:text-zinc-400'
              )}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
