"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export interface FilterState {
  search: string;
  modes: string[];
  status: string[];
  types: string[];
}

export interface FilterOptions {
  modes: string[];
  status: string[];
  types: string[];
}

interface GenericFilterSidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  options: FilterOptions;
  className?: string;
}

export function GenericFilterSidebar({
  filters,
  setFilters,
  options,
  className,
}: GenericFilterSidebarProps) {
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

  // Helper to render a checkbox group
  const renderCheckboxGroup = (
    title: string,
    category: keyof Omit<FilterState, "search">,
    items: string[]
  ) => {
    if (items.length === 0) return null;

    return (
      <div>
        <h3 className="mb-4 text-lg font-semibold capitalize">{title}</h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item} className="flex items-center space-x-2">
              <Checkbox
                id={`${category}-${item}`}
                checked={(filters[category] as string[]).includes(item)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(category, item, checked)
                }
              />
              <Label
                htmlFor={`${category}-${item}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
              >
                {item.toLowerCase().replace(/_/g, " ")}
              </Label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="mb-4 text-lg font-semibold">Search</h3>
        <div className="relative">
          <div className="p-2 h-full flex items-center absolute left-1">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8"
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <Separator />

      {renderCheckboxGroup("Status", "status", options.status)}

      {options.status.length > 0 && options.modes.length > 0 && <Separator />}

      {renderCheckboxGroup("Mode", "modes", options.modes)}

      {options.modes.length > 0 && options.types.length > 0 && <Separator />}

      {renderCheckboxGroup("Type", "types", options.types)}
    </div>
  );
}
