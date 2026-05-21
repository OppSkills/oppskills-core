"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import Link from "next/link";

import { OpportunitiesTable } from "../_components/opportunities-table/OpportunitiesTable";
import {
  mapBackendToOpportunity,
  Opportunity,
} from "../_components/opportunities-table/types";
import {
  getMyHackathons,
  updateHackathonRegistrationPaused,
} from "@/lib/api/hackathonApi";
import ActionDropdown from "../_components/ActionDropdown";

export default function HackathonPage() {
  const { getToken, isLoaded } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const take = 10;

  const fetchData = async (page = currentPage) => {
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await getMyHackathons(token, { page, take });
      const mapped = res.items.map((h: any) =>
        mapBackendToOpportunity(h, "Competition"),
      );
      setOpportunities(mapped);
      setTotalPages(res.totalPages);
      setCurrentPage(res.page);
    } catch (error) {
      console.error("Error fetching hackathons:", error);
      toast.error("Failed to load hackathons");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [isLoaded, getToken, currentPage]);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(
      (opp) =>
        opp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [opportunities, searchQuery]);

  const handleToggleRegistration = async (id: string, isOpen: boolean) => {
    try {
      const token = await getToken();
      if (!token) return;

      // Optimistic update
      setOpportunities((prev) =>
        prev.map((opp) =>
          opp.id === id ? { ...opp, registrationsOpen: isOpen } : opp,
        ),
      );

      await updateHackathonRegistrationPaused(token, id, {
        isRegistrationPaused: !isOpen,
      });
      toast.success(
        `Registration ${isOpen ? "opened" : "closed"} successfully`,
      );
    } catch (error) {
      console.error("Error toggling registration:", error);
      toast.error("Failed to update registration status");
      // Rollback
      fetchData();
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-neutral-100 w-full overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-900">
          Hackathons ({opportunities.length})
        </h1>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search hackathons"
              className="pl-10 h-11 border-neutral-200 bg-white rounded-full shadow-sm focus-visible:ring-primary-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link href="/organize/hackathon">
            <Button className="h-11 px-4 rounded-full bg-primary-800 hover:bg-primary-900 text-white flex items-center gap-2 shadow-md">
              <div className="flex items-center justify-center h-6 w-6 rounded-full border border-white/30">
                <Plus className="h-4 w-4" />
              </div>
              <span>Host</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 min-w-0">
        <OpportunitiesTable
          data={filteredOpportunities}
          onToggleRegistration={handleToggleRegistration}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
