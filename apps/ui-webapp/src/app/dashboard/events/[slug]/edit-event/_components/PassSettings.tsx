"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { FormData } from "../page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { searchColleges, getCollegesByIds } from "@/lib/api/collegesApi";
import { Container } from "./Container";

interface PassSettingsProps {
  formData: FormData;
  setFormData: (data: React.SetStateAction<FormData>) => void;
}

export default function PassSettings({
  formData,
  setFormData,
}: PassSettingsProps) {
  const { getToken } = useAuth();
  const [collegeSearch, setCollegeSearch] = useState("");
  // Store college ID -> name mapping for selected colleges
  const [collegeNamesMap, setCollegeNamesMap] = useState<Record<string, string>>({});
  // Track which IDs we're currently fetching to avoid duplicate requests
  const fetchingRef = useRef<Set<string>>(new Set());

  const { data: colleges } = useQuery({
    queryKey: ["colleges", collegeSearch],
    queryFn: async () => {
      const token = await getToken();
      if (!token || collegeSearch.length < 2) return [];
      return searchColleges(token, collegeSearch);
    },
    enabled: collegeSearch.length >= 2,
  });

  // Fetch college names for selected college IDs that don't have names yet
  useEffect(() => {
    const fetchMissingCollegeNames = async () => {
      const selectedIds = formData.passSettings.allowedCollegeIds;
      if (selectedIds.length === 0) return;

      // Find IDs that don't have names and aren't currently being fetched
      const missingIds = selectedIds.filter(
        (id) => !collegeNamesMap[id] && !fetchingRef.current.has(id)
      );
      if (missingIds.length === 0) return;

      const token = await getToken();
      if (!token) return;

      // Mark as fetching
      missingIds.forEach((id) => fetchingRef.current.add(id));

      try {
        const colleges = await getCollegesByIds(token, missingIds);
        const namesMap: Record<string, string> = {};
        colleges.forEach((college) => {
          namesMap[college.id] = college.name;
          fetchingRef.current.delete(college.id);
        });
        setCollegeNamesMap((prev) => ({ ...prev, ...namesMap }));
      } catch (error) {
        console.error("Failed to fetch college names:", error);
        // Remove from fetching set on error
        missingIds.forEach((id) => fetchingRef.current.delete(id));
      }
    };

    fetchMissingCollegeNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.passSettings.allowedCollegeIds]); // Only depend on selected IDs

  const updatePassSettings = (
    updates: Partial<FormData["passSettings"]>
  ) => {
    setFormData((prev) => ({
      ...prev,
      passSettings: {
        ...prev.passSettings,
        ...updates,
      },
    }));
  };

  const addCollege = (collegeId: string, collegeName: string) => {
    if (!formData.passSettings.allowedCollegeIds.includes(collegeId)) {
      updatePassSettings({
        allowedCollegeIds: [
          ...formData.passSettings.allowedCollegeIds,
          collegeId,
        ],
      });
      // Store the college name in the mapping
      setCollegeNamesMap((prev) => ({
        ...prev,
        [collegeId]: collegeName,
      }));
    }
  };

  const removeCollege = (collegeId: string) => {
    updatePassSettings({
      allowedCollegeIds: formData.passSettings.allowedCollegeIds.filter(
        (id) => id !== collegeId
      ),
    });
    // Remove the college name from the mapping
    setCollegeNamesMap((prev) => {
      const updated = { ...prev };
      delete updated[collegeId];
      return updated;
    });
  };

  const addEmailDomain = (domain: string) => {
    const trimmed = domain.trim();
    if (trimmed && !formData.passSettings.allowedEmailDomains.includes(trimmed)) {
      updatePassSettings({
        allowedEmailDomains: [
          ...formData.passSettings.allowedEmailDomains,
          trimmed,
        ],
      });
    }
  };

  const removeEmailDomain = (domain: string) => {
    updatePassSettings({
      allowedEmailDomains: formData.passSettings.allowedEmailDomains.filter(
        (d) => d !== domain
      ),
    });
  };

  const profileMatchingEnabled = [
    "PROFILE_ONLY",
    "EITHER_OR",
    "BOTH_REQUIRED",
  ].includes(formData.passSettings.collegeMatchMode);

  const emailMatchingEnabled = [
    "EMAIL_ONLY",
    "EITHER_OR",
    "BOTH_REQUIRED",
  ].includes(formData.passSettings.collegeMatchMode);

  return (
    <Container
      heading="Event Pass Settings"
      description="Configure how event passes are sent to participants and restrict registrations by college or email domain."
    >
      <div className="space-y-6 py-2">
        {/* Pass Sending Mode */}
        <div className="space-y-4">
          <Label className="text-base font-bold poppins text-neutral-800">Pass Sending Mode</Label>
          <RadioGroup
            value={formData.passSettings.passSendingMode}
            onValueChange={(value) =>
              updatePassSettings({
                passSendingMode: value as "IMMEDIATE" | "APPROVAL",
              })
            }
            className="flex flex-col gap-3"
          >
            <div className={cn(
              "flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer",
              formData.passSettings.passSendingMode === "IMMEDIATE"
                ? "bg-primary-50/30 border-primary-200"
                : "border-transparent hover:bg-neutral-50"
            )}>
              <RadioGroupItem value="IMMEDIATE" id="immediate" className="border-primary-500 text-primary-600" />
              <Label htmlFor="immediate" className="font-medium text-neutral-700 cursor-pointer inter">
                Send pass immediately after registration
              </Label>
            </div>
            <div className={cn(
              "flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer",
              formData.passSettings.passSendingMode === "APPROVAL"
                ? "bg-primary-50/30 border-primary-200"
                : "border-transparent hover:bg-neutral-50"
            )}>
              <RadioGroupItem value="APPROVAL" id="approval" className="border-primary-500 text-primary-600" />
              <Label htmlFor="approval" className="font-medium text-neutral-700 cursor-pointer inter">
                Send pass after organizer approval
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator className="bg-primary-50" />

        {/* College Restrictions */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
            <Checkbox
              id="collegeRestrictions"
              checked={formData.passSettings.collegeRestrictionEnabled}
              onCheckedChange={(checked) =>
                updatePassSettings({
                  collegeRestrictionEnabled: !!checked,
                })
              }
              className="border-neutral-400 data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600"
            />
            <Label
              htmlFor="collegeRestrictions"
              className="font-bold text-neutral-800 cursor-pointer inter"
            >
              Restrict registration to specific colleges
            </Label>
          </div>

          {formData.passSettings.collegeRestrictionEnabled && (
            <div className="space-y-6 pl-4 border-l-2 border-primary-100 mt-4 animate-in slide-in-from-left-2 duration-300">
              {(() => {
                const {
                  allowedCollegeIds,
                  allowedEmailDomains,
                  collegeMatchMode,
                } = formData.passSettings;
                const hasColleges = allowedCollegeIds.length > 0;
                const hasDomains = allowedEmailDomains.length > 0;
                let isMissingCriteria = false;
                let message = "";

                if (
                  collegeMatchMode === "PROFILE_ONLY" ||
                  collegeMatchMode === "BOTH_REQUIRED"
                ) {
                  if (!hasColleges) {
                    isMissingCriteria = true;
                    message = "Please select at least one college.";
                  }
                }

                if (
                  !isMissingCriteria &&
                  (collegeMatchMode === "EMAIL_ONLY" ||
                    collegeMatchMode === "BOTH_REQUIRED")
                ) {
                  if (!hasDomains) {
                    isMissingCriteria = true;
                    message = "Please add at least one email domain.";
                  }
                }

                if (
                  !isMissingCriteria &&
                  collegeMatchMode === "EITHER_OR"
                ) {
                  if (!hasColleges && !hasDomains) {
                    isMissingCriteria = true;
                    message =
                      "Please add at least one college or email domain.";
                  }
                }

                if (isMissingCriteria) {
                  return (
                    <div className="flex items-center gap-2 p-3 text-sm rounded-lg bg-amber-50 text-amber-700 border border-amber-200 animate-in fade-in zoom-in duration-300">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span className="inter font-medium">{message}</span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Match Mode */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-neutral-700 inter uppercase tracking-wider">Verification Method</Label>
                <Select
                  value={formData.passSettings.collegeMatchMode}
                  onValueChange={(value) =>
                    updatePassSettings({
                      collegeMatchMode: value as any,
                    })
                  }
                >
                  <SelectTrigger className="rounded-xl border-neutral-200 bg-white poppins font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-neutral-200 shadow-xl">
                    <SelectItem value="EITHER_OR" className="inter">
                      Either college profile OR email domain
                    </SelectItem>
                    <SelectItem value="PROFILE_ONLY" className="inter">
                      College profile only
                    </SelectItem>
                    <SelectItem value="EMAIL_ONLY" className="inter">
                      Email domain only
                    </SelectItem>
                    <SelectItem value="BOTH_REQUIRED" className="inter">
                      Both profile AND email must match
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Allowed Colleges */}
              {profileMatchingEnabled && (
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-neutral-700 inter uppercase tracking-wider">Allowed Colleges</Label>
                  <Input
                    placeholder="Search colleges..."
                    value={collegeSearch}
                    onChange={(e) => setCollegeSearch(e.target.value)}
                    className="rounded-xl border-neutral-200 focus:border-primary-500 transition-all inter"
                  />
                  {colleges && colleges.length > 0 && (
                    <div className="border border-neutral-100 rounded-xl max-h-40 overflow-y-auto bg-white shadow-lg mt-2 p-1">
                      {colleges.map((college) => (
                        <div
                          key={college.id}
                          className="p-3 hover:bg-primary-50 rounded-lg cursor-pointer transition-colors text-sm inter font-medium text-neutral-700"
                          onClick={() => addCollege(college.id, college.name)}
                        >
                          {college.name} • <span className="text-neutral-400 font-normal">{college.city}, {college.state}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Selected Colleges */}
                  {formData.passSettings.allowedCollegeIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.passSettings.allowedCollegeIds.map((collegeId) => {
                        const collegeName = collegeNamesMap[collegeId] || collegeId;
                        return (
                          <Badge key={collegeId} variant="secondary" className="bg-primary-100 text-primary-700 hover:bg-primary-200 border-none px-3 py-1 rounded-full poppins text-xs transition-all">
                            {collegeName}
                            <button
                              onClick={() => removeCollege(collegeId)}
                              className="ml-2 hover:text-destructive transition-colors text-lg leading-none"
                            >
                              ×
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Email Domains */}
              {emailMatchingEnabled && (
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-neutral-700 inter uppercase tracking-wider">Allowed Email Domains</Label>
                  <div className="text-xs text-neutral-400 inter italic">
                    Enter email domains (e.g., galgotiascollege.edu)
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., iitd.ac.in"
                      className="rounded-xl border-neutral-200 focus:border-primary-500 inter"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          const value = e.currentTarget.value.trim();
                          if (value) {
                            addEmailDomain(value);
                            e.currentTarget.value = "";
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-primary-500 text-primary-600 hover:bg-primary-50 font-bold px-6"
                      onClick={(e) => {
                        const input = e.currentTarget
                          .previousSibling as HTMLInputElement;
                        const value = input.value.trim();
                        if (value) {
                          addEmailDomain(value);
                          input.value = "";
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {/* Selected Domains */}
                  {formData.passSettings.allowedEmailDomains.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.passSettings.allowedEmailDomains.map((domain) => (
                        <Badge key={domain} variant="secondary" className="bg-primary-100 text-primary-700 hover:bg-primary-200 border-none px-3 py-1 rounded-full poppins text-xs transition-all">
                          @{domain}
                          <button
                            onClick={() => removeEmailDomain(domain)}
                            className="ml-2 hover:text-destructive transition-colors text-lg leading-none"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

