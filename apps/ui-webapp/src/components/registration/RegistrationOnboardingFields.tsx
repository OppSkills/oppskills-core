"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  MapPin,
  User,
  Users,
  GraduationCap,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { searchColleges } from "@/lib/api/collegesApi";
import { autocompleteLocation } from "@/lib/api/recommendationApi";
import type { LocationSuggestionDto } from "@oppskills/types";
import { UserCategoryValue } from "@oppskills/types/enums";
import {
  REGISTRATION_GENDER_OPTIONS,
  REGISTRATION_ONBOARDING_SECTIONS,
  REGISTRATION_TEAM_PREFERENCE_OPTIONS,
  REGISTRATION_USER_CATEGORY_OPTIONS,
} from "@/lib/registration/onboardingFormConstants";
import type {
  RegistrationOnboardingErrors,
  RegistrationOnboardingValues,
} from "@/lib/registration/registrationOnboardingTypes";

const SECTION_ICONS = [User, GraduationCap, MapPin, Users];

export interface RegistrationOnboardingFieldsProps {
  values: RegistrationOnboardingValues;
  onChange: (values: RegistrationOnboardingValues) => void;
  errors?: RegistrationOnboardingErrors;
  showTeamPreference?: boolean;
  compact?: boolean;
}

export function RegistrationOnboardingFields({
  values,
  onChange,
  errors = {},
  showTeamPreference = true,
  compact = false,
}: RegistrationOnboardingFieldsProps) {
  const { getToken } = useAuth();
  const [collegeSearchQuery, setCollegeSearchQuery] = useState("");
  const [collegeSearchResults, setCollegeSearchResults] = useState<
    Array<{ id: string; name: string; city: string; state: string }>
  >([]);
  const [isSearchingColleges, setIsSearchingColleges] = useState(false);
  const [collegeComboboxOpen, setCollegeComboboxOpen] = useState(false);

  const [locationSuggestions, setLocationSuggestions] = useState<
    LocationSuggestionDto[]
  >([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [focusedLocationIndex, setFocusedLocationIndex] = useState(-1);
  const [debouncedLocationQuery, setDebouncedLocationQuery] = useState("");
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const ignoreLocationQueryRef = useRef("");

  const patch = useCallback(
    (partial: Partial<RegistrationOnboardingValues>) => {
      onChange({ ...values, ...partial });
    },
    [onChange, values],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocationQuery(values.locationCoords || "");
    }, 300);
    return () => clearTimeout(timer);
  }, [values.locationCoords]);

  useEffect(() => {
    const trimmed = debouncedLocationQuery.trim();
    if (trimmed.length < 2 || trimmed === ignoreLocationQueryRef.current) {
      setLocationSuggestions([]);
      return;
    }

    let active = true;
    async function fetchSuggestions() {
      setIsSearchingLocation(true);
      try {
        const token = await getToken();
        if (!token) return;
        const res = await autocompleteLocation(token, trimmed);
        if (active) {
          setLocationSuggestions(res);
          setFocusedLocationIndex(-1);
          setShowLocationDropdown(true);
        }
      } finally {
        if (active) setIsSearchingLocation(false);
      }
    }
    void fetchSuggestions();
    return () => {
      active = false;
    };
  }, [debouncedLocationQuery, getToken]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node)
      ) {
        setShowLocationDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCollegeSearch = async (query: string) => {
    setCollegeSearchQuery(query);
    if (query.trim().length < 2) {
      setCollegeSearchResults([]);
      return;
    }
    setIsSearchingColleges(true);
    try {
      const token = await getToken();
      if (!token) return;
      const results = await searchColleges(token, query);
      setCollegeSearchResults(results);
    } finally {
      setIsSearchingColleges(false);
    }
  };

  const handleSelectLocation = (suggestion: LocationSuggestionDto) => {
    ignoreLocationQueryRef.current = suggestion.mainText;
    const parts = (suggestion.secondaryText || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    let parsedState = "";
    let parsedCountry = "India";
    if (parts.length >= 2) {
      parsedCountry = parts[parts.length - 1];
      parsedState = parts[parts.length - 2];
    } else if (parts.length === 1) {
      parsedCountry = parts[0];
    }
    patch({
      locationCoords: suggestion.mainText,
      locationPlaceId: suggestion.placeId,
      locationState: parsedState,
      locationCountry: parsedCountry,
    });
    setLocationSuggestions([]);
    setShowLocationDropdown(false);
  };

  const sectionClass = compact
    ? "space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4"
    : "space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-5";

  const SectionHeader = ({
    index,
    title,
  }: {
    index: number;
    title: string;
  }) => {
    const Icon = SECTION_ICONS[index];
    return (
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-primary-600" />
        <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Step 1: Primary Identity */}
      <section className={sectionClass}>
        <SectionHeader index={0} title={REGISTRATION_ONBOARDING_SECTIONS[0]} />
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label>
              Gender <span className="text-red-500">*</span>
            </Label>
            <Select
              value={values.gender || undefined}
              onValueChange={(v) =>
                patch({ gender: v as RegistrationOnboardingValues["gender"] })
              }
            >
              <SelectTrigger className={cn(errors.gender && "border-red-500")}>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {REGISTRATION_GENDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-xs text-red-500">{errors.gender}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              I am a... <span className="text-red-500">*</span>
            </Label>
            <Select
              value={values.userCategory || undefined}
              onValueChange={(v) =>
                patch({
                  userCategory:
                    v as RegistrationOnboardingValues["userCategory"],
                })
              }
            >
              <SelectTrigger
                className={cn(errors.userCategory && "border-red-500")}
              >
                <SelectValue placeholder="Select your category" />
              </SelectTrigger>
              <SelectContent>
                {REGISTRATION_USER_CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.userCategory && (
              <p className="text-xs text-red-500">{errors.userCategory}</p>
            )}
          </div>
        </div>
      </section>

      {/* Step 2: Education / Work */}
      {values.userCategory && (
        <section className={sectionClass}>
          <SectionHeader
            index={1}
            title={REGISTRATION_ONBOARDING_SECTIONS[1]}
          />

          {values.userCategory === UserCategoryValue.SCHOOL_STUDENT && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>
                  School Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={values.schoolName}
                  onChange={(e) => patch({ schoolName: e.target.value })}
                  className={cn(errors.schoolName && "border-red-500")}
                  placeholder="Enter your school name"
                />
                {errors.schoolName && (
                  <p className="text-xs text-red-500">{errors.schoolName}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>
                    Class/Grade <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={values.schoolClass}
                    onChange={(e) => patch({ schoolClass: e.target.value })}
                    className={cn(errors.schoolClass && "border-red-500")}
                    placeholder="e.g. 10th, 12th"
                  />
                  {errors.schoolClass && (
                    <p className="text-xs text-red-500">{errors.schoolClass}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>School Address</Label>
                  <Input
                    value={values.schoolAddress}
                    onChange={(e) => patch({ schoolAddress: e.target.value })}
                    placeholder="City, State"
                  />
                </div>
              </div>
            </div>
          )}

          {(values.userCategory === UserCategoryValue.COLLEGE_STUDENT ||
            values.userCategory ===
              UserCategoryValue.PROFESSIONAL_SCHOOL_STUDENT) && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>
                  College <span className="text-red-500">*</span>
                </Label>
                {!values.collegeSkipped ? (
                  <Popover
                    open={collegeComboboxOpen}
                    onOpenChange={setCollegeComboboxOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between font-normal",
                          errors.college && "border-red-500",
                        )}
                      >
                        {values.collegeName || "Search for your college..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-full min-w-[300px] p-0"
                      align="start"
                    >
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search colleges..."
                          value={collegeSearchQuery}
                          onValueChange={handleCollegeSearch}
                        />
                        <CommandList>
                          {isSearchingColleges && (
                            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Searching...
                            </div>
                          )}
                          {!isSearchingColleges &&
                            collegeSearchQuery.length >= 2 &&
                            collegeSearchResults.length === 0 && (
                              <CommandEmpty>No colleges found.</CommandEmpty>
                            )}
                          <CommandGroup>
                            {collegeSearchResults.map((college) => (
                              <CommandItem
                                key={college.id}
                                value={college.id}
                                onSelect={() => {
                                  patch({
                                    collegeId: college.id,
                                    collegeName: college.name,
                                  });
                                  setCollegeSearchQuery("");
                                  setCollegeSearchResults([]);
                                  setCollegeComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    values.collegeId === college.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {college.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {college.city}, {college.state}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Input
                    value={values.collegeName}
                    onChange={(e) =>
                      patch({ collegeName: e.target.value, collegeId: "" })
                    }
                    placeholder="Enter college name"
                    className={cn(errors.college && "border-red-500")}
                  />
                )}
                {errors.college && (
                  <p className="text-xs text-red-500">{errors.college}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reg-collegeSkipped"
                  checked={values.collegeSkipped}
                  onCheckedChange={(checked) => {
                    patch({
                      collegeSkipped: checked === true,
                      collegeId: checked === true ? "" : values.collegeId,
                      collegeName: checked === true ? "" : values.collegeName,
                    });
                  }}
                />
                <Label
                  htmlFor="reg-collegeSkipped"
                  className="font-normal cursor-pointer"
                >
                  My college is not listed
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Current Year</Label>
                  <Select
                    value={values.collegeCurrentYear || undefined}
                    onValueChange={(v) => patch({ collegeCurrentYear: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {["1st", "2nd", "3rd", "4th", "5th", "graduated"].map(
                        (y) => (
                          <SelectItem key={y} value={y}>
                            {y === "graduated" ? "Graduated" : `${y} Year`}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Passout Year</Label>
                  <Input
                    type="number"
                    value={values.collegePassoutYear}
                    onChange={(e) =>
                      patch({ collegePassoutYear: e.target.value })
                    }
                    placeholder="2025"
                    min={2000}
                    max={2035}
                  />
                </div>
              </div>
            </div>
          )}

          {values.userCategory === UserCategoryValue.FRESHER && (
            <p className="text-sm text-neutral-600">
              As a fresher, you can optionally add college details below in the
              registration section.
            </p>
          )}

          {values.userCategory === UserCategoryValue.WORKING_PROFESSIONAL && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={values.companyName}
                  onChange={(e) => patch({ companyName: e.target.value })}
                  className={cn(errors.companyName && "border-red-500")}
                  placeholder="Where do you work?"
                />
                {errors.companyName && (
                  <p className="text-xs text-red-500">{errors.companyName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  Job Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={values.jobTitle}
                  onChange={(e) => patch({ jobTitle: e.target.value })}
                  className={cn(errors.jobTitle && "border-red-500")}
                  placeholder="e.g. Software Engineer"
                />
                {errors.jobTitle && (
                  <p className="text-xs text-red-500">{errors.jobTitle}</p>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Step 3: Location */}
      <section className={sectionClass}>
        <SectionHeader index={2} title={REGISTRATION_ONBOARDING_SECTIONS[2]} />
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>City</Label>
            <div className="relative" ref={locationDropdownRef}>
              <Input
                value={values.locationCoords}
                onChange={(e) => {
                  patch({
                    locationCoords: e.target.value,
                    locationPlaceId: "",
                  });
                  ignoreLocationQueryRef.current = "";
                  setShowLocationDropdown(true);
                }}
                onFocus={() => setShowLocationDropdown(true)}
                placeholder="Enter your city"
                autoComplete="off"
              />
              {showLocationDropdown &&
                (locationSuggestions.length > 0 || isSearchingLocation) && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {isSearchingLocation ? (
                      <div className="p-3 text-xs text-muted-foreground text-center">
                        Searching...
                      </div>
                    ) : (
                      locationSuggestions.map((suggestion, index) => (
                        <button
                          type="button"
                          key={suggestion.placeId}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectLocation(suggestion)}
                          className={cn(
                            "w-full text-left px-4 py-2 text-sm hover:bg-neutral-50",
                            focusedLocationIndex === index && "bg-primary-50",
                          )}
                        >
                          <span className="font-medium block">
                            {suggestion.mainText}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {suggestion.secondaryText}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={values.locationState}
                onChange={(e) => patch({ locationState: e.target.value })}
                placeholder="State"
              />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={values.locationCountry}
                onChange={(e) => patch({ locationCountry: e.target.value })}
                placeholder="Country"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Team preference (hackathons) */}
      {showTeamPreference && (
        <section className={sectionClass}>
          <SectionHeader
            index={3}
            title={REGISTRATION_ONBOARDING_SECTIONS[3]}
          />
          <div className="grid grid-cols-2 gap-2">
            {REGISTRATION_TEAM_PREFERENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cn(
                  "p-3 rounded-xl border text-left text-sm transition-colors",
                  values.teamPreference === opt.value
                    ? "border-primary-600 bg-primary-50"
                    : "border-neutral-200 hover:border-primary-200",
                )}
                onClick={() => patch({ teamPreference: opt.value })}
              >
                <div className="font-medium">{opt.label}</div>
                <div className="text-xs text-muted-foreground">
                  {opt.description}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
