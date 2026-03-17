"use client"
import React, { useState, useMemo, useEffect } from "react";
import { RegistrationTabs } from "./_components/RegistrationTabs";
import { RegistrationCard } from "./_components/RegistrationCard";
import { Registration } from "./_components/registration-types";
import { getRegistrations } from "@/lib/api/usersApi";
import { useAuth } from "@clerk/nextjs";
import { Loader2, Search } from "lucide-react";
import Image from "next/image";

export default function RegistrationsPage() {
  const { getToken } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await getRegistrations(token);
        setRegistrations(data);
      } catch (error) {
        console.error("Failed to fetch registrations", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRegistrations();
  }, [getToken]);

  const counts = useMemo(() => ({
    all: registrations.length,
    events: registrations.filter((r) => r.opportunityType === "event").length,
    competitions: registrations.filter((r) => r.opportunityType === "hackathon").length,
  }), [registrations]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const matchesTab = activeTab === "all" || reg.opportunityType === activeTab;
      const matchesSearch = reg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.teamName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [registrations, activeTab, searchQuery]);

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-3xl p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-3xl p-8">
      <RegistrationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        counts={counts}
      />

      <div className="mt-6 space-y-4">
        {filteredRegistrations.length > 0 ? (
          filteredRegistrations.map((reg) => (
            <RegistrationCard key={reg.id} registration={reg} />
          ))
        ) : (
          <div className="p-10 md:p-15 lg:p-20 flex flex-col items-center justify-center text-center">
            <Image
              src="/illustrations/working-on-desk.svg"
              alt="No registrations"
              width={300}
              height={300}
            />
            <p className="text-neutral-800">You haven’t registered in any {activeTab === "all" ? "Competition, Event or Festival" : activeTab === "event" ? "Event" : "Competition"} till now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
