"use client";

import React from "react";
import { Check, CheckCheck, Clock } from "lucide-react";
import type { Message } from "@/features/chat/domain/types";

export function OutgoingMessageStatus({ message }: { message: Message }) {
  if (message.sendState === "pending") {
    return <Clock className="w-3.5 h-3.5" />;
  }
  if (message.sendState === "failed") {
    return <span className="text-[9px] text-red-300">Failed</span>;
  }
  if (message.deliveryStatus === "DELIVERED") {
    return <CheckCheck className="w-3.5 h-3.5" />;
  }
  return <Check className="w-3.5 h-3.5" />;
}

export function formatTime12h(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, "0");
  const strMinutes = String(minutes).padStart(2, "0");
  return `${strHours}:${strMinutes} ${ampm}`;
}

export function formatDateSeparator(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const todayDate = new Date();
  const compareDate = new Date(date);

  const isToday =
    todayDate.getFullYear() === compareDate.getFullYear() &&
    todayDate.getMonth() === compareDate.getMonth() &&
    todayDate.getDate() === compareDate.getDate();

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const isYesterday =
    yesterdayDate.getFullYear() === compareDate.getFullYear() &&
    yesterdayDate.getMonth() === compareDate.getMonth() &&
    yesterdayDate.getDate() === compareDate.getDate();

  if (isToday) {
    return "Today";
  }
  if (isYesterday) {
    return "Yesterday";
  }

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const day = compareDate.getDate();
  const monthName = months[compareDate.getMonth()];
  const year = compareDate.getFullYear();
  return `${day} ${monthName}, ${year}`;
}

export function formatSidebarTimestamp(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const todayDate = new Date();
  const compareDate = new Date(date);

  const isToday =
    todayDate.getFullYear() === compareDate.getFullYear() &&
    todayDate.getMonth() === compareDate.getMonth() &&
    todayDate.getDate() === compareDate.getDate();

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const isYesterday =
    yesterdayDate.getFullYear() === compareDate.getFullYear() &&
    yesterdayDate.getMonth() === compareDate.getMonth() &&
    yesterdayDate.getDate() === compareDate.getDate();

  if (isToday) {
    return formatTime12h(isoString);
  }
  if (isYesterday) {
    return "Yesterday";
  }

  const day = String(compareDate.getDate()).padStart(2, "0");
  const month = String(compareDate.getMonth() + 1).padStart(2, "0");
  const year = compareDate.getFullYear();
  return `${day}-${month}-${year}`;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function ChatSidebarFallback() {
  return (
    <div className="flex-1 overflow-y-auto divide-y divide-neutral-200 p-4 space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-neutral-200 shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="h-4 bg-neutral-200 rounded-md w-1/3" />
            <div className="h-3 bg-neutral-200 rounded-md w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatTimelineFallback() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-neutral-100">
      {Array.from({ length: 5 }).map((_, i) => {
        const isYou = i % 2 === 0;
        return (
          <div
            key={i}
            className={`flex ${isYou ? "justify-end" : "justify-start"} w-full animate-pulse`}
          >
            <div
              className={`flex items-end gap-2 max-w-[70%] ${
                isYou ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`h-16 w-48 md:w-64 rounded-2xl bg-neutral-200 ${
                  isYou ? "rounded-br-none" : "rounded-bl-none"
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface HighlightedTextProps {
  text: string;
  highlight: string;
}

export const HighlightedText = React.memo(function HighlightedText({
  text,
  highlight,
}: HighlightedTextProps) {
  if (!highlight.trim()) return <>{text}</>;

  const regex = new RegExp(`(${escapeRegExp(highlight)})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-yellow-300 text-neutral-900 rounded-xs px-0.5 font-bold"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
});
