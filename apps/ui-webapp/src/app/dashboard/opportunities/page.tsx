"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { OpportunitiesTable } from "../_components/opportunities-table/OpportunitiesTable";
import { MOCK_OPPORTUNITIES } from "../_components/opportunities-table/types";

export default function OpportunitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-neutral-100 w-full overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Tabs defaultValue="all" className="w-full md:w-auto">
          <TabsList className="bg-transparent h-12 p-0 gap-8 border-b border-neutral-200 rounded-none w-full md:w-auto justify-start">
            <TabsTrigger
              value="all"
              className="px-0 py-3 text-sm rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 data-[state=active]:bg-transparent transition-all"
            >
              All Opportunities (543)
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="px-0 py-3 text-sm rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 data-[state=active]:bg-transparent transition-all"
            >
              Events
            </TabsTrigger>
            <TabsTrigger
              value="competitions"
              className="px-0 py-3 text-sm rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 data-[state=active]:bg-transparent transition-all"
            >
              Competitions
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search"
              className="pl-10 h-11 border-neutral-200 bg-white rounded-full shadow-sm focus-visible:ring-primary-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="h-11 px-4 rounded-full bg-primary-800 hover:bg-primary-900 text-white flex items-center gap-2 shadow-md">
            <div className="flex items-center justify-center h-6 w-6 rounded-full border border-white/30">
              <Plus className="h-4 w-4" />
            </div>
            <span>Host</span>
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 min-w-0">
        <OpportunitiesTable data={MOCK_OPPORTUNITIES} />
      </div>
    </div>
  );
}
