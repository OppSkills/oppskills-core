"use client";

import React, { useState } from "react";
import FestivalsTable, { FestivalItem } from "../_components/FestivalsTable";
import { toast } from "sonner";

export default function FestivalsDashboardPage() {
  // Mock data as requested by the user
  const [data, setData] = useState<FestivalItem[]>([
    {
      id: "1",
      name: "Hackverse",
      description:
        "Some so called big engg. college name will come up here who is trying to be tier 1",
      tag: "Hackathon",
      status: "Completed",
      startDate: new Date("2026-01-01T00:00:00"),
      endDate: new Date("2026-01-01T00:00:00"),
      candidates: 1243,
      registrationOpen: false,
    },
    {
      id: "2",
      name: "HackInfy",
      description:
        "Some so called big engg. college name will come up here who is trying to be tier 1",
      tag: "Hackathon",
      status: "Completed",
      startDate: new Date("2026-01-01T00:00:00"),
      endDate: new Date("2026-01-01T00:00:00"),
      candidates: 12000,
      registrationOpen: false,
    },
    {
      id: "3",
      name: "HackWipro",
      description:
        "Some so called big engg. college name will come up here who is trying to be tier 1",
      tag: "Hackathon",
      status: "Completed",
      startDate: new Date("2026-01-01T00:00:00"),
      endDate: new Date("2026-01-01T00:00:00"),
      candidates: 1300,
      registrationOpen: false,
    },
    {
      id: "4",
      name: "Bas kar",
      description:
        "Some so called big engg. college name will come up here who is trying to be tier 1",
      tag: "Hackathon",
      status: "In Progress",
      startDate: new Date("2026-01-01T00:00:00"),
      endDate: new Date("2026-01-01T00:00:00"),
      candidates: 12232,
      registrationOpen: true,
    },
    {
      id: "5",
      name: "Enough of Hack",
      description:
        "Some so called big engg. college name will come up here who is trying to be tier 1",
      tag: "Hackathon",
      status: "In Progress",
      startDate: new Date("2026-01-01T00:00:00"),
      endDate: new Date("2026-01-01T00:00:00"),
      candidates: 23000,
      registrationOpen: true,
    },
  ]);

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
