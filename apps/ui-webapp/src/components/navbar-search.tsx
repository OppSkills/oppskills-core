"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, TrendingUp, Calendar, Trophy } from "lucide-react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScrollArea } from "./ui/scroll-area";
import { Chart } from "@solar-icons/react";
import { Button } from "./ui/button";
import { autosuggestOpportunities } from "@/lib/api/opportunityApi";

const TRENDING_SEARCHES = [
  "Hackathons 2024",
  "Web Development",
  "AI Workshops",
  "Design Sprints",
  "Coding Competitions",
  "Open Source",
  "Internships",
  "Startup Pitch",
];

// Mock data for results
const MOCK_RESULTS = [
  {
    id: "1",
    title: "Global AI Hackathon",
    description: "Build the future of AI in this 48-hour global challenge.",
    type: "Hackathon",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop",
    slug: "global-ai-hackathon",
  },
  {
    id: "2",
    title: "React Conf 2024",
    description: "The biggest React conference of the year.",
    type: "Event",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=100&fit=crop",
    slug: "react-conf-2024",
  },
  {
    id: "3",
    title: "Blockchain Summit",
    description: "Explore the latest in blockchain technology.",
    type: "Event",
    image: "https://images.unsplash.com/photo-1516245834210-c4c142787335?w=100&h=100&fit=crop",
    slug: "blockchain-summit",
  },
  {
    id: "4",
    title: "Fintech Innovation Hack",
    description: "Revolutionize finance with tech.",
    type: "Hackathon",
    image: "https://images.unsplash.com/photo-1551288049-bbda4865cda1?w=100&h=100&fit=crop",
    slug: "fintech-innovation-hack",
  },
  {
    id: "5",
    title: "UI/UX Design Workshop",
    description: "Master modern design principles.",
    type: "Event",
    image: "https://images.unsplash.com/photo-1586717791821-3f44a563dc4c?w=100&h=100&fit=crop",
    slug: "ui-ux-workshop",
  },
];

interface NavbarSearchProps {
  query: string;
  isOpen: boolean;
  onClose: () => void;
}

export const NavbarSearch = ({ query, isOpen, onClose }: NavbarSearchProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Fetch results from API based on query
  useEffect(() => {
    const q = query.trim();
    if (q === "") {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const fetchResults = async () => {
      try {
        const data = await autosuggestOpportunities(q);
        setResults(data);
      } catch (error) {
        console.error("Failed to fetch autosuggest results:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeout = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleTrendingClick = (term: string) => {
    router.push(`/search?q=${encodeURIComponent(term)}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full border p-0 bg-white rounded-2xl absolute right-0 top-12 shadow-xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top",
        "md:w-[450px] md:max-h-[500px]",
        "fixed inset-x-0 bottom-0 top-[76px] md:absolute md:bottom-auto md:inset-x-auto"
      )}
    >
      <ScrollArea className="h-full max-h-[500px]">
        <div className="p-4 space-y-6">
          {/* Trending Searches */}
          {!query.trim() && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex gap-2 items-center px-1">
                <Chart className="w-3.5 h-3.5" /> Trending Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((search, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="rounded-full hover:bg-primary-500 cursor-pointer hover:text-neutral-100 px-3 py-1 text-sm transition-colors"
                    onClick={() => handleTrendingClick(search)}
                  >
                    {search}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {query.trim() && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1 m-0">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  {isLoading && "Searching..."}
                </span>
              </div>

              {!isLoading && (
                <>
                  <div className="space-y-1">
                    {results.length > 0 ? (
                      results.map((item) => (
                        <Link
                          key={item.slug}
                          href={`/${item.type.toLowerCase()}s/${item.slug}`}
                          onClick={onClose}
                          className="flex items-start gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-all group"
                        >
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-neutral-100 border">
                            {item.thumbnail ? (
                              <Image
                                src={item.thumbnail}
                                alt={item.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-neutral-200">
                                <Search className="w-5 h-5 text-neutral-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-sm font-semibold text-neutral-900 truncate group-hover:text-primary-700 transition-colors">
                                {item.title}
                              </h4>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-[10px] px-1.5 py-0 rounded-md font-medium",
                                  item.type === "HACKATHON"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                )}
                              >
                                {item.type === "HACKATHON" ? (
                                  <>
                                    <Trophy className="h-2.5 w-2.5 mr-1" />
                                    Opportunity
                                  </>
                                ) : (
                                  <>
                                    <Calendar className="h-2.5 w-2.5 mr-1" />
                                    Event
                                  </>
                                )}
                              </Badge>
                            </div>
                            <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <Link
                        href={`/search?q=${encodeURIComponent(query)}`}
                        onClick={onClose}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-all group border border-dashed border-neutral-200"
                      >
                        <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                          <Search className="w-5 h-5 text-primary-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-neutral-900 truncate">
                            {query}
                          </h4>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Search all for "{query}"
                          </p>
                        </div>
                      </Link>
                    )}
                  </div>

                  {results.length > 0 && (
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}`}
                      onClick={onClose}
                      className="block w-full py-2.5 text-center text-sm font-medium text-primary-700 hover:bg-primary-50 rounded-xl transition-colors mt-2"
                    >
                      View all results for "{query}"
                    </Link>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
