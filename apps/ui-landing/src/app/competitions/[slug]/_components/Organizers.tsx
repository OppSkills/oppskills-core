'use client';

import React from 'react';
import { Organizer } from './types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Linkedin } from 'lucide-react';
import Link from 'next/link';

interface OrganizersProps {
  organizers: Organizer[];
}

export function Organizers({ organizers }: OrganizersProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
        Organizers
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {organizers.map((organizer) => (
          <div 
            key={organizer.id} 
            className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-purple-200 dark:hover:border-purple-900/30 transition-colors"
          >
            <Avatar className="h-12 w-12 border border-zinc-100">
              <AvatarImage src={organizer.avatar} alt={organizer.name} />
              <AvatarFallback>{organizer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {organizer.name}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {organizer.role}
              </p>
               {organizer.company && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                    {organizer.company}
                  </p>
               )}
            </div>
            <div className="flex items-center gap-2">
               {organizer.linkedin && (
                 <Link href={organizer.linkedin} className="p-2 text-zinc-400 hover:text-[#0077b5] hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full transition-colors">
                   <Linkedin className="w-4 h-4" />
                 </Link>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
