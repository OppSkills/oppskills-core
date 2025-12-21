"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  name: string;
  price: number; // 0 for free
  description: string;
}

interface User {
  name: string;
  email: string;
  avatar: string;
}

interface EventRegistrationCardProps {
  tickets: Ticket[];
  user?: User; // Optional, might not be logged in, but design shows user info
}

export function EventRegistrationCard({
  tickets,
  user = {
    name: "Rohit",
    email: "tstrohittiwari@gmail.com",
    avatar: "https://github.com/shadcn.png", // Placeholder avatar
  },
}: EventRegistrationCardProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    tickets.length > 0 ? tickets[0].id : null
  );

  const hasPaidTickets = tickets.some((t) => t.price > 0);

  // If only free ticket(s) or no specific paid logic required for "Free State" view:
  // The design shows two distinct states.
  // State 1: "Registration" (Free/RSVP)
  // State 2: "Registration" (Ticket Selection)

  // We can infer state based on if there are multiple tickets or paid tickets.
  // For this implementation, if there is exactly one free ticket, we show the "One Click RSVP" style.
  // If there are paid tickets or multiple options, we show the ticket selection style.

  const isSimpleRSVP = tickets.length === 1 && tickets[0].price === 0;

  if (isSimpleRSVP) {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 rounded-[20px] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm font-sans">
        <div className="bg-[#FDF2FF] dark:bg-[#3E1A45] px-6 py-4">
          <h3 className="text-[#5B2E63] dark:text-[#E8D1EE] font-semibold text-lg">
            Registration
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-zinc-600 dark:text-zinc-400 text-[15px]">
            Welcome! to join event please register below.
          </p>

          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image
                src={user.avatar}
                alt={user.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-[16px]">
                {user.name}
              </span>
              <span className="text-zinc-500 text-sm">{user.email}</span>
            </div>
          </div>

          <Button className="w-full h-[52px] rounded-full bg-[#9C00E5] hover:bg-[#8500c4] text-white font-semibold text-[18px]">
            One Click RSVP
          </Button>
        </div>
      </div>
    );
  }

  // Ticket Selection View
  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-[20px] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm font-sans">
      <div className="bg-[#FDF2FF] dark:bg-[#3E1A45] px-6 py-4">
        <h3 className="text-[#5B2E63] dark:text-[#E8D1EE] font-semibold text-lg">
          Registration
        </h3>
      </div>
      <div className="p-6 space-y-6">
        <p className="text-zinc-600 dark:text-zinc-400 text-[15px]">
          Welcome! Please choose your desired ticket type:
        </p>

        <div className="space-y-4">
          {tickets.map((ticket) => {
            const isSelected = selectedTicketId === ticket.id;
            return (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                className={cn(
                  "cursor-pointer rounded-2xl border p-4 transition-all duration-200 relative",
                  isSelected
                    ? "border-[#9C00E5] bg-[#FDF2FF]/50 dark:bg-[#3E1A45]/20 ring-1 ring-[#9C00E5]"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-transparent"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-100 text-xl">
                      {ticket.name}
                    </h4>
                    <div className="mt-1 font-bold text-zinc-900 dark:text-zinc-50 text-xl">
                      {ticket.price === 0 ? "Free" : `₹ ${ticket.price}`}
                    </div>
                  </div>
                  <div className="mt-1">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-[#9C00E5] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed dark:text-zinc-400 line-clamp-2">
                  {ticket.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <div className="relative w-10 h-10 rounded-full overflow-hidden">
            <Image
              src={user.avatar}
              alt={user.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-[16px]">
              {user.name}
            </span>
            <span className="text-zinc-500 text-sm">{user.email}</span>
          </div>
        </div>

        <Button className="w-full h-[52px] rounded-full bg-[#9C00E5] hover:bg-[#8500c4] text-white font-semibold text-[18px]">
          Click To Book
        </Button>
      </div>
    </div>
  );
}
