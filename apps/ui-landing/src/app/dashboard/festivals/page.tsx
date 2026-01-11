"use client";

import React, { useState, useRef, useEffect } from "react";
import FestivalsTable, { FestivalItem } from "../_components/FestivalsTable";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { getMyFestivals } from "@/lib/api/festivalApi";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export default function FestivalsDashboardPage() {
  const [data, setData] = useState<FestivalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { getToken, isLoaded } = useAuth();

  // Create a ref for getToken to avoid useEffect dependency on it changing
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = await getTokenRef.current();
        if (!token) return;

        const res = await getMyFestivals(token);

        // Transform the data
        let rows: FestivalItem[] = [];
        if (isRecord(res) && Array.isArray(res["data"])) {
          rows = res["data"].map((item: any) => {
            return {
              id: item.id,
              name: item.name,
              slug: item.slug,
              description: item.description,
              tag: "Festival",
              status: item.status || "DRAFT",
              startDate: item.startDate || new Date().toISOString(),
              endDate: item.endDate || new Date().toISOString(),
              candidates: 0, // Placeholder
              registrationOpen: false, // Placeholder
            };
          });
        } else if (Array.isArray(res)) {
          // Handle case where API returns array directly
          rows = res.map((item: any) => {
            return {
              id: item.id,
              name: item.name,
              slug: item.slug,
              description: item.description,
              tag: "Festival",
              status: item.status || "DRAFT",
              startDate: item.startDate || new Date().toISOString(),
              endDate: item.endDate || new Date().toISOString(),
              candidates: 0, // Placeholder
              registrationOpen: false, // Placeholder
            };
          });
        }

        if (!cancelled) {
          setData(rows);
        }
      } catch (error) {
        console.error("Failed to fetch festivals", error);
        toast.error("Failed to load festivals");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [isLoaded]);

  const handleToggleRegistration = (id: string, isOpen: boolean) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, registrationOpen: isOpen } : item
      )
    );
    toast.success(`Registration ${isOpen ? "opened" : "closed"}`);
  };

  const handleEdit = (id: string) => {
    toast.info(`Edit festival ${id}`);
    // Navigate to edit page
  };

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Festivals</h1>
      </div>

      <FestivalsTable
        data={data}
        onToggleRegistration={handleToggleRegistration}
        onEdit={handleEdit}
      />
    </div>
  );
}
