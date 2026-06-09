"use client";

import React from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";

interface MessageFilterBarProps {
  currentMatchIndex: number;
  endDateFilter: string;
  matchingMessageCount: number;
  messageSearchQuery: string;
  showDateFilter: boolean;
  showSearch: boolean;
  startDateFilter: string;
  onClearDates: () => void;
  onClose: () => void;
  onCurrentMatchIndexChange: React.Dispatch<React.SetStateAction<number>>;
  onEndDateFilterChange: (value: string) => void;
  onMessageSearchQueryChange: (value: string) => void;
  onStartDateFilterChange: (value: string) => void;
}

const MessageFilterBar = React.memo(function MessageFilterBar({
  currentMatchIndex,
  endDateFilter,
  matchingMessageCount,
  messageSearchQuery,
  showDateFilter,
  showSearch,
  startDateFilter,
  onClearDates,
  onClose,
  onCurrentMatchIndexChange,
  onEndDateFilterChange,
  onMessageSearchQueryChange,
  onStartDateFilterChange,
}: MessageFilterBarProps) {
  if (!showSearch && !showDateFilter) return null;

  return (
    <div className="bg-white border-b border-neutral-300 px-3 md:px-5 py-2.5 flex flex-wrap items-center gap-2 md:gap-3 shrink-0 shadow-xs z-10">
      {showSearch && (
        <div className="relative flex items-center flex-1 min-w-0 w-full md:w-auto">
          <div className="relative flex-1">
            <input
              type="text"
              value={messageSearchQuery}
              onChange={(e) => onMessageSearchQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (matchingMessageCount > 0) {
                    if (e.shiftKey) {
                      onCurrentMatchIndexChange((prev) =>
                        prev > 0 ? prev - 1 : matchingMessageCount - 1,
                      );
                    } else {
                      onCurrentMatchIndexChange((prev) =>
                        prev < matchingMessageCount - 1 ? prev + 1 : 0,
                      );
                    }
                  }
                }
              }}
              placeholder="Search messages in this chat..."
              className="w-full pl-9 pr-24 py-1.5 border border-neutral-300 focus:border-primary-500 outline-none rounded-xl text-xs font-semibold shadow-2xs bg-white text-neutral-900"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 bg-white pl-1 select-none">
              {messageSearchQuery.trim() && (
                <span className="font-mono">
                  {matchingMessageCount > 0
                    ? `${currentMatchIndex + 1}/${matchingMessageCount}`
                    : "0/0"}
                </span>
              )}
              {messageSearchQuery && (
                <button
                  type="button"
                  onClick={() => onMessageSearchQueryChange("")}
                  className="text-neutral-400 hover:text-neutral-600 p-0.5 rounded-full hover:bg-neutral-100 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {messageSearchQuery.trim() && matchingMessageCount > 0 && (
            <div className="flex items-center gap-1 ml-1.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  onCurrentMatchIndexChange((prev) =>
                    prev > 0 ? prev - 1 : matchingMessageCount - 1,
                  )
                }
                title="Previous match (Shift+Enter / Up)"
                className="p-1.5 border border-neutral-300 bg-white hover:bg-neutral-50 rounded-xl text-neutral-600 transition-colors shadow-2xs cursor-pointer"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onCurrentMatchIndexChange((prev) =>
                    prev < matchingMessageCount - 1 ? prev + 1 : 0,
                  )
                }
                title="Next match (Enter / Down)"
                className="p-1.5 border border-neutral-300 bg-white hover:bg-neutral-50 rounded-xl text-neutral-600 transition-colors shadow-2xs cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {showDateFilter && (
        <div className="flex flex-wrap items-center gap-2 text-xs w-full md:w-auto">
          <span className="font-semibold text-neutral-500">From:</span>
          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => onStartDateFilterChange(e.target.value)}
            className="flex-1 min-w-[130px] px-2.5 py-1.5 border border-neutral-300 rounded-xl text-xs outline-none focus:border-primary-500 font-semibold shadow-2xs bg-white"
          />
          <span className="font-semibold text-neutral-500">To:</span>
          <input
            type="date"
            value={endDateFilter}
            onChange={(e) => onEndDateFilterChange(e.target.value)}
            className="flex-1 min-w-[130px] px-2.5 py-1.5 border border-neutral-300 rounded-xl text-xs outline-none focus:border-primary-500 font-semibold shadow-2xs bg-white"
          />
          {(startDateFilter || endDateFilter) && (
            <button
              type="button"
              onClick={onClearDates}
              className="text-primary-600 hover:text-primary-800 underline font-bold ml-1 cursor-pointer"
            >
              Clear dates
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="text-xs text-red-500 hover:text-red-700 font-bold ml-auto cursor-pointer"
      >
        Close Filters
      </button>
    </div>
  );
});

export default MessageFilterBar;
