"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface FilterState {
  search: string;
  modes: string[]; // Online, In Person
  status: string[]; // Upcoming, Recent
  eventDates: string[]; // This week, Next week, This month, Next month
  eligibility: string[]; // School, UG, PG, Open
  sort?: string;
}

export interface FilterOptions {
  modes: string[];
  status: string[];
  types: string[];
}

interface GenericFilterSidebarProps {
  filters: FilterState;
  setFilters: (filters: FilterState | ((prev: FilterState) => FilterState)) => void;
  options?: FilterOptions; // Now optional as we use fixed filters mainly
  className?: string;
}

export function GenericFilterSidebar({
  filters,
  setFilters,
  className,
}: GenericFilterSidebarProps) {
  const handleCheckboxChange = (
    category: keyof Omit<FilterState, "search" | "sort">,
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
  
  const handleRadioChange = (
    category: keyof Omit<FilterState, "search" | "sort">,
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [category]: [value],
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      modes: [],
      status: [],
      eventDates: [],
      eligibility: [],
      sort: filters.sort, // Keep current sort
    });
  };

  // Helper to render a checkbox group
  const renderCheckboxGroup = (
    title: string,
    category: keyof Omit<FilterState, "search" | "sort">,
    items: string[]
  ) => {
    return (
      <div className="space-y-2">
        <h3 className="font-bold text-neutral-900">{title}</h3>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item} className="flex items-center space-x-3">
              <Checkbox
                id={`${category}-${item}`}
                className="h-6 w-6 rounded-md border-2 border-neutral-400 data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600"
                checked={(filters[category] as string[]).includes(item)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(category, item, checked)
                }
              />
              <Label
                htmlFor={`${category}-${item}`}
                className="font-medium text-neutral-600 cursor-pointer select-none leading-none"
              >
                {item}
              </Label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper to render a radio group
  const renderRadioGroup = (
    title: string,
    category: keyof Omit<FilterState, "search" | "sort">,
    items: string[]
  ) => {
    const value = (filters[category] as string[])[0] || "";
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-neutral-900">{title}</h3>
        <RadioGroup value={value} onValueChange={(val) => handleRadioChange(category, val)}>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item} className="flex items-center space-x-3">
                <RadioGroupItem
                  value={item}
                  id={`${category}-${item}`}
                  className="h-6 w-6 border-2 border-neutral-400 text-primary-600 focus:ring-primary-600"
                />
                <Label
                  htmlFor={`${category}-${item}`}
                  className="font-medium text-neutral-600 cursor-pointer select-none leading-none"
                >
                  {item}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>
    );
  };

  return (
    <div className={`space-y-4 py-2 ${className}`}>
      <button
        onClick={clearFilters}
        className="text-2xl font-medium text-neutral-900 hover:text-primary-600 transition-colors"
      >
        Clear filters
      </button>

      {renderRadioGroup("Location", "modes", ["Online", "In Person"])}

      {renderCheckboxGroup("Status", "status", ["Upcoming", "Recent"])}

      {renderCheckboxGroup("Event Date", "eventDates", [
        "This week",
        "Next week",
        "This month",
        "Next month",
      ])}

      {renderCheckboxGroup("Eligibility", "eligibility", [
        "School",
        "UG",
        "PG",
        "Open",
      ])}
    </div>
  );
}
