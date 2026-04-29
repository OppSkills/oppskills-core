"use client";

import React, { useState, useEffect } from "react";
import FestivalsTable, { FestivalItem } from "../_components/FestivalsTable";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { getMyFestivals } from "@/lib/api/festivalApi";
import { Loader2 } from "lucide-react";

export default function FestivalsDashboardPage() {
  const [data, setData] = useState<FestivalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const take = 10;

  const { getToken, isLoaded } = useAuth();

  const fetchData = async (page = currentPage) => {
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res: any = await getMyFestivals(token, { page, take });

      const items = Array.isArray(res.items) ? res.items : (Array.isArray(res) ? res : []);
      
      const rows: FestivalItem[] = items.map((item: any) => {
        const events = item.events || [];
        const hackathons = item.hackathons || [];
        
        const eventCandidates = events.reduce((sum: number, e: any) => sum + (e.registrationCount || 0), 0);
        const competitionCandidates = hackathons.reduce((sum: number, h: any) => sum + (h.registrationCount || 0), 0);
        const totalCandidates = eventCandidates + competitionCandidates;

        return {
          id: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description || "",
          image: item.posterImageUrl || "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=2070&auto=format&fit=crop",
          candidates: totalCandidates,
          numberOfEvents: events.length,
          eventCandidates: eventCandidates,
          numberOfCompetitions: hackathons.length,
          competitionCandidates: competitionCandidates,
        };
      });

      setData(rows);
      if (res.totalPages) setTotalPages(res.totalPages);
      if (res.page) setCurrentPage(res.page);
    } catch (error) {
      console.error("Failed to fetch festivals", error);
      toast.error("Failed to load festivals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [isLoaded, getToken, currentPage]);

  const handleEdit = (id: string) => {
    // Navigate is handled inside ActionDropdown, but we can keep this for other manual triggers
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-neutral-100 w-full overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-900">Festivals ({data.length})</h1>
      </div>

      {/* Table Section */}
      <div className="flex-1 min-w-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <p className="text-neutral-500">Loading your festivals...</p>
          </div>
        ) : (
          <FestivalsTable
            data={data}
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onEdit={handleEdit}
          />
        )}
      </div>
    </div>
  );
}
