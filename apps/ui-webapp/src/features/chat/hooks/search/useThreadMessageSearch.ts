"use client";

import { useEffect, useMemo, useState } from "react";
import type { Chat, Message } from "../../domain/types";

export function useThreadMessageSearch(
  activeChat: Chat | undefined,
  selectedChatId: string | null,
) {
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);

  useEffect(() => {
    setIsSearchingMessages(false);
    setMessageSearchQuery("");
    setShowDateFilter(false);
    setStartDateFilter("");
    setEndDateFilter("");
    setHighlightedMessageId(null);
  }, [selectedChatId]);

  const matchingMessageIds = useMemo(() => {
    if (!isSearchingMessages || !messageSearchQuery.trim() || !activeChat) {
      return [];
    }
    const query = messageSearchQuery.toLowerCase();
    const sorted = [...activeChat.messages].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    return sorted
      .filter((message) => {
        if (message.type === "SYSTEM") return false;

        if (showDateFilter) {
          const msgTime = new Date(message.timestamp).getTime();
          if (startDateFilter) {
            const start = new Date(startDateFilter);
            start.setHours(0, 0, 0, 0);
            if (msgTime < start.getTime()) return false;
          }
          if (endDateFilter) {
            const end = new Date(endDateFilter);
            end.setHours(23, 59, 59, 999);
            if (msgTime > end.getTime()) return false;
          }
        }

        const textMatch = message.text.toLowerCase().includes(query);
        const senderMatch = message.senderName?.toLowerCase().includes(query);
        return textMatch || senderMatch;
      })
      .map((m) => m.id);
  }, [
    activeChat,
    isSearchingMessages,
    messageSearchQuery,
    showDateFilter,
    startDateFilter,
    endDateFilter,
  ]);

  const matchingMessageIdsKey = matchingMessageIds.join(",");

  useEffect(() => {
    if (matchingMessageIds.length > 0) {
      setCurrentMatchIndex(matchingMessageIds.length - 1);
    } else {
      setCurrentMatchIndex(0);
    }
  }, [matchingMessageIdsKey, matchingMessageIds.length]);

  useEffect(() => {
    if (matchingMessageIds.length > 0 && isSearchingMessages) {
      const matchId = matchingMessageIds[currentMatchIndex];
      if (matchId) {
        const el = document.getElementById(`msg-${matchId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setHighlightedMessageId(matchId);
        }
      }
    } else {
      setHighlightedMessageId(null);
    }
  }, [currentMatchIndex, matchingMessageIdsKey, isSearchingMessages]);

  const scrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  };

  return {
    isSearchingMessages,
    setIsSearchingMessages,
    messageSearchQuery,
    setMessageSearchQuery,
    showDateFilter,
    setShowDateFilter,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    currentMatchIndex,
    setCurrentMatchIndex,
    matchingMessageIds,
    highlightedMessageId,
    setHighlightedMessageId,
    scrollToMessage,
  };
}

export type { Message };
