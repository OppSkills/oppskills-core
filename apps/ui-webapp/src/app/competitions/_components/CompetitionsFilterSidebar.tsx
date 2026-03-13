"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface FilterState {
  search: string;
  modes: string[];
  status: string[];
  types: string[];
}

interface CompetitionsFilterSidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  className?: string;
}

export function CompetitionsFilterSidebar({
  filters,
  setFilters,
  className,
}: CompetitionsFilterSidebarProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleCheckboxChange = (
    category: keyof Omit<FilterState, "search">,
    value: string,
    checked: boolean | string
  ) => {
    setFilters((prev) => {
      const current = prev[category] as string[];
      let updated: string[];
      if (checked === true) {
        updated = [...current, value];
      } else {
        updated = current.filter((item) => item !== value);
      }
      return { ...prev, [category]: updated };
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="mb-4 text-lg font-semibold">Search</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search competitions..."
            className="pl-8"
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-4 text-lg font-semibold">Status</h3>
        <div className="space-y-3">
          {["Upcoming", "Open", "Ongoing", "Ended"].map((status) => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status}`}
                checked={filters.status.includes(status)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("status", status, checked)
                }
              />
              <Label
                htmlFor={`status-${status}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {status}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-4 text-lg font-semibold">Mode</h3>
        <div className="space-y-3">
          {["Online", "Offline", "Hybrid"].map((mode) => (
            <div key={mode} className="flex items-center space-x-2">
              <Checkbox
                id={`mode-${mode}`}
                checked={filters.modes.includes(mode)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("modes", mode, checked)
                }
              />
              <Label
                htmlFor={`mode-${mode}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {mode}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-4 text-lg font-semibold">Type</h3>
        <div className="space-y-3">
          {["Hackathon", "Design Challenge", "Coding Contest"].map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type}`}
                checked={filters.types.includes(type)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("types", type, checked)
                }
              />
              <Label
                htmlFor={`type-${type}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {type}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
