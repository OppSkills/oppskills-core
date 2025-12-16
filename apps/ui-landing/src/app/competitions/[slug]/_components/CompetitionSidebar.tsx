'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronRight, MapPin, Users, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompetitionDetails } from './types';

interface CompetitionSidebarProps {
  competition: CompetitionDetails;
}

export function CompetitionSidebar({ competition }: CompetitionSidebarProps) {
  return (
    <div className="space-y-5 font-sans">
      {/* Featured In Pill */}
      {competition.featuredIn && (
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-full text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-normal text-muted-foreground">Featured in</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{competition.featuredIn}</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        </div>
      )}

      {/* Banner Component */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-sm">
        <Image
          src={competition.thumbnail}
          alt={competition.title}
          fill
          className="object-cover"
          priority
        />
        {/* Overlay gradient if needed, or text on image like in design 'Edureka Masterclass' */}
        {/* For now, assuming image contains the text/design */}
      </div>

      {/* Info Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <p className="text-zinc-600 dark:text-zinc-400 text-[15px] mb-6">
          Welcome! to join event please register below.
        </p>

        <div className="space-y-5">
          {/* Date Row */}
          <div className="flex gap-4 items-center">
            <div className="flex-shrink-0 w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 flex flex-col items-center justify-center">
               <span className="text-[10px] uppercase text-zinc-500 font-medium leading-none mb-0.5">Jan</span>
               <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-none">05</span>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-[15px]">
                {competition.specificDate || 'Monday, 5 January 2026'}
              </h4>
               <p className="text-sm text-zinc-500">
                 {competition.specificTime || '8:00 - 20:00 GMT-8'}
               </p>
            </div>
          </div>

          {/* Location Row */}
          <div className="flex gap-4 items-center">
             <div className="flex-shrink-0 w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 flex items-center justify-center">
               <MapPin className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-[15px]">
                {competition.venueName || 'College/University Name'}
              </h4>
               <p className="text-sm text-zinc-500">
                 {competition.venueAddress || 'City, State'}
               </p>
            </div>
          </div>

          {/* Register Button */}
          <Button className="w-full bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-full h-[52px] font-semibold text-[16px] shadow-sm">
            Register for free
          </Button>

          {/* Divider */}
          <div className="h-px bg-zinc-100 dark:bg-zinc-800 w-full my-2" />

          {/* Stats List */}
          <div className="space-y-4">
            {/* Team Size */}
            <div className="flex items-center gap-4">
               <div className="flex-shrink-0 w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 flex items-center justify-center">
                  <Users className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
               </div>
               <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                    {competition.teamSize || '1-2 Members'}
                  </div>
                  <div className="text-xs text-zinc-500">Team Size</div>
               </div>
            </div>

            {/* Impressions */}
            <div className="flex items-center gap-4">
               <div className="flex-shrink-0 w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
               </div>
               <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                    {competition.impressions || '206'}
                  </div>
                  <div className="text-xs text-zinc-500">Impressions</div>
               </div>
            </div>

             {/* Deadline */}
             <div className="flex items-center gap-4">
               <div className="flex-shrink-0 w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
               </div>
               <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                    {competition.registrationDeadline || '8 Days'}
                  </div>
                  <div className="text-xs text-zinc-500">Registration Deadline</div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
