"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const INDUSTRIES = [
  { label: "Technology", value: "TECHNOLOGY" },
  { label: "Education", value: "EDUCATION" },
  { label: "Healthcare", value: "HEALTHCARE" },
  { label: "Finance", value: "FINANCE" },
  { label: "Arts & Culture", value: "ARTS_CULTURE" },
  { label: "Sports & Fitness", value: "SPORTS_FITNESS" },
  { label: "Food & Beverage", value: "FOOD_BEVERAGE" },
  { label: "Travel", value: "TRAVEL" },
  { label: "Nonprofit", value: "NONPROFIT" },
  { label: "Government", value: "GOVERNMENT" },
  { label: "Retail", value: "RETAIL" },
  { label: "Media & Entertainment", value: "MEDIA_ENTERTAINMENT" },
  { label: "Real Estate", value: "REAL_ESTATE" },
  { label: "Other", value: "OTHER" },
];

export interface CommunityFilterValues {
  search: string;
  industry: string[];
}

interface CommunityFilterSidebarProps {
  values: CommunityFilterValues;
  onChange: (values: CommunityFilterValues) => void;
  onClear: () => void;
  className?: string;
}

export function CommunityFilterSidebar({
  values,
  onChange,
  onClear,
  className,
}: CommunityFilterSidebarProps) {
  const [localSearch, setLocalSearch] = useState(values.search);

  // Sync local search when parent search value changes (e.g. on clear)
  useEffect(() => {
    setLocalSearch(values.search);
  }, [values.search]);

  // Debounced search input sync
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== values.search) {
        onChange({ ...values, search: localSearch });
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [localSearch, values, onChange]);

  const handleCheckboxChange = (industry: string, checked: boolean | string) => {
    let updated: string[];
    if (checked === true) {
      updated = [...values.industry, industry];
    } else {
      updated = values.industry.filter((item) => item !== industry);
    }
    onChange({ ...values, industry: updated });
  };

  return (
    <div className={`space-y-6 py-2 ${className}`}>
      <div className="flex items-center justify-between">
        <button
          onClick={onClear}
          className="text-2xl font-medium text-neutral-900 hover:text-primary-600 transition-colors"
        >
          Clear filters
        </button>
      </div>

      {/* Search Input */}
      <div className="space-y-2">
        <h3 className="font-bold text-neutral-900">Search</h3>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search communities..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-4 pr-10 rounded-full border-neutral-400 py-2 focus:border-primary-600"
          />
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {/* Industry Checkbox Group */}
      <div className="space-y-3">
        <h3 className="font-bold text-neutral-900">Industry</h3>
        <div className="space-y-2.5">
          {INDUSTRIES.map((ind) => (
            <div key={ind.value} className="flex items-center space-x-3">
              <Checkbox
                id={`industry-${ind.value}`}
                className="h-6 w-6 rounded-md border-2 border-neutral-400 data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600"
                checked={values.industry.includes(ind.value)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(ind.value, checked)
                }
              />
              <Label
                htmlFor={`industry-${ind.value}`}
                className="font-medium text-neutral-600 cursor-pointer select-none leading-none"
              >
                {ind.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
