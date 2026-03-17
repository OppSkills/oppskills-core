"use client";

import React, { useState, useMemo } from "react";
import { RegistrationTabs } from "./_components/RegistrationTabs";
import { RegistrationCard } from "./_components/RegistrationCard";
import { MOCK_REGISTRATIONS } from "./_components/registration-types";

export default function RegistrationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const counts = useMemo(() => ({
    all: MOCK_REGISTRATIONS.length,
    events: MOCK_REGISTRATIONS.filter((r) => r.type === "Event").length,
    competitions: MOCK_REGISTRATIONS.filter((r) => r.type === "Competition").length,
  }), []);

  const filteredRegistrations = useMemo(() => {
    return MOCK_REGISTRATIONS.filter((reg) => {
      const matchesTab = activeTab === "all" || reg.type === activeTab;
      const matchesSearch = reg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.teamName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  return (
    <div className="w-full bg-white rounded-3xl p-8">
      <RegistrationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        counts={counts}
      />

      <div className="mt-6">
        {filteredRegistrations.length > 0 ? (
          filteredRegistrations.map((reg) => (
            <RegistrationCard key={reg.id} registration={reg} />
          ))
        ) : (
          <div className="bg-white border border-[#E0E0E6] rounded-[32px] p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-[#F2F2F5] rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-[#9E9EAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#1A1A1E] mb-2">No registrations found</h3>
            <p className="text-[#9E9EAE]">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
}
