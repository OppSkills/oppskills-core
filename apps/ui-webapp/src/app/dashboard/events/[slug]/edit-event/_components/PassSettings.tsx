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
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { searchColleges, getCollegesByIds } from "@/lib/api/collegesApi";

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
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div>
        <h2 className="text-2xl font-bold">Event Pass Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Configure how event passes are sent to participants
        </p>
      </div>

      <div className="w-full border rounded-2xl p-6 bg-card shadow-sm">
        {/* Pass Sending Mode */}
        <div className="space-y-4 mb-6">
          <Label className="text-base font-semibold">Pass Sending Mode</Label>
          <RadioGroup
            value={formData.passSettings.passSendingMode}
            onValueChange={(value) =>
              updatePassSettings({
                passSendingMode: value as "IMMEDIATE" | "APPROVAL",
              })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="IMMEDIATE" id="immediate" />
              <Label htmlFor="immediate" className="font-normal cursor-pointer">
                Send pass immediately after registration
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="APPROVAL" id="approval" />
              <Label htmlFor="approval" className="font-normal cursor-pointer">
                Send pass after organizer approval
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator className="my-6" />

        {/* College Restrictions */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="collegeRestrictions"
              checked={formData.passSettings.collegeRestrictionEnabled}
              onCheckedChange={(checked) =>
                updatePassSettings({
                  collegeRestrictionEnabled: !!checked,
                })
              }
            />
            <Label
              htmlFor="collegeRestrictions"
              className="font-normal cursor-pointer"
            >
              Restrict registration to specific colleges
            </Label>
          </div>

          {formData.passSettings.collegeRestrictionEnabled && (
            <>
              {/* Match Mode */}
              <div className="space-y-2">
                <Label>Verification Method</Label>
                <Select
                  value={formData.passSettings.collegeMatchMode}
                  onValueChange={(value) =>
                    updatePassSettings({
                      collegeMatchMode: value as any,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EITHER_OR">
                      Either college profile OR email domain
                    </SelectItem>
                    <SelectItem value="PROFILE_ONLY">
                      College profile only
                    </SelectItem>
                    <SelectItem value="EMAIL_ONLY">
                      Email domain only
                    </SelectItem>
                    <SelectItem value="BOTH_REQUIRED">
                      Both profile AND email must match
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Allowed Colleges */}
              {profileMatchingEnabled && (
                <div className="space-y-2">
                  <Label>Allowed Colleges</Label>
                  <Input
                    placeholder="Search colleges..."
                    value={collegeSearch}
                    onChange={(e) => setCollegeSearch(e.target.value)}
                  />
                  {colleges && colleges.length > 0 && (
                    <div className="border rounded-md max-h-40 overflow-y-auto">
                      {colleges.map((college) => (
                        <div
                          key={college.id}
                          className="p-2 hover:bg-accent cursor-pointer"
                          onClick={() => addCollege(college.id, college.name)}
                        >
                          {college.name} - {college.city}, {college.state}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Selected Colleges */}
                  {formData.passSettings.allowedCollegeIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.passSettings.allowedCollegeIds.map((collegeId) => {
                        const collegeName = collegeNamesMap[collegeId] || collegeId;
                        return (
                          <Badge key={collegeId} variant="secondary">
                            {collegeName}
                            <button
                              onClick={() => removeCollege(collegeId)}
                              className="ml-2 hover:text-destructive"
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
                <div className="space-y-2">
                  <Label>Allowed Email Domains</Label>
                  <div className="text-sm text-muted-foreground mb-2">
                    Enter email domains (e.g., galgotiascollege.edu)
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., iitd.ac.in"
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
                        <Badge key={domain} variant="secondary">
                          @{domain}
                          <button
                            onClick={() => removeEmailDomain(domain)}
                            className="ml-2 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

