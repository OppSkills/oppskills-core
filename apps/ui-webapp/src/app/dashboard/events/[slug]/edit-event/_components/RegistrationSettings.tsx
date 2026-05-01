"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar as CalendarIcon,
  Clock,
  Infinity as InfinityIcon,
  AlertTriangle,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { FormData } from "../page";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { CheckCircle } from "@solar-icons/react";
import { Container } from "@/app/dashboard/_components/Container";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { searchColleges, getCollegesByIds } from "@/lib/api/collegesApi";

interface RegistrationSettingsProps {
  formData: FormData;
  setFormData: (data: React.SetStateAction<FormData>) => void;
}

function applyTimeToDate(date: Date, timeHHmm: string): Date {
  const d = new Date(date.getTime());
  const trimmed = timeHHmm.trim();
  const [hhRaw, mmRaw] = trimmed.split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (!Number.isInteger(hh) || !Number.isInteger(mm)) {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  d.setHours(hh, mm, 0, 0);
  return d;
}

export default function RegistrationSettings({
  formData,
  setFormData,
}: RegistrationSettingsProps) {
  const { getToken } = useAuth();
  const [collegeSearch, setCollegeSearch] = useState("");
  const [collegeNamesMap, setCollegeNamesMap] = useState<Record<string, string>>({});
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

  useEffect(() => {
    const fetchMissingCollegeNames = async () => {
      const selectedIds = formData.passSettings?.allowedCollegeIds;
      if (!selectedIds || selectedIds.length === 0) return;

      const missingIds = selectedIds.filter(
        (id) => !collegeNamesMap[id] && !fetchingRef.current.has(id)
      );
      if (missingIds.length === 0) return;

      const token = await getToken();
      if (!token) return;

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
        missingIds.forEach((id) => fetchingRef.current.delete(id));
      }
    };

    fetchMissingCollegeNames();
  }, [formData.passSettings?.allowedCollegeIds]);

  const updateSettings = (
    updates: Partial<FormData["registrationSettings"]>
  ) => {
    setFormData((prev) => {
      const nextRegs: FormData["registrationSettings"] = {
        ...prev.registrationSettings,
        ...updates,
      };
      const next: FormData = {
        ...prev,
        registrationSettings: nextRegs,
      };
      if (updates.endDate !== undefined || updates.endTime !== undefined) {
        if (nextRegs.endDate) {
          next.eventRegisterBy = applyTimeToDate(
            nextRegs.endDate,
            nextRegs.endTime,
          );
        } else {
          next.eventRegisterBy = undefined;
        }
      }
      if (updates.eventDate !== undefined) {
        next.eventDate = nextRegs.eventDate;
      }
      if (updates.eventTime !== undefined) {
        next.eventTimeFrom = nextRegs.eventTime;
      }
      return next;
    });
  };

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
    if (!formData.passSettings?.allowedCollegeIds.includes(collegeId)) {
      updatePassSettings({
        allowedCollegeIds: [
          ...(formData.passSettings?.allowedCollegeIds || []),
          collegeId,
        ],
      });
      setCollegeNamesMap((prev) => ({
        ...prev,
        [collegeId]: collegeName,
      }));
    }
  };

  const removeCollege = (collegeId: string) => {
    updatePassSettings({
      allowedCollegeIds: (formData.passSettings?.allowedCollegeIds || []).filter(
        (id) => id !== collegeId
      ),
    });
    setCollegeNamesMap((prev) => {
      const updated = { ...prev };
      delete updated[collegeId];
      return updated;
    });
  };

  const addEmailDomain = (domain: string) => {
    const trimmed = domain.trim();
    if (trimmed && !formData.passSettings?.allowedEmailDomains.includes(trimmed)) {
      updatePassSettings({
        allowedEmailDomains: [
          ...(formData.passSettings?.allowedEmailDomains || []),
          trimmed,
        ],
      });
    }
  };

  const removeEmailDomain = (domain: string) => {
    updatePassSettings({
      allowedEmailDomains: (formData.passSettings?.allowedEmailDomains || []).filter(
        (d) => d !== domain
      ),
    });
  };

  const profileMatchingEnabled = [
    "PROFILE_ONLY",
    "EITHER_OR",
    "BOTH_REQUIRED",
  ].includes(formData.passSettings?.collegeMatchMode || "");

  const emailMatchingEnabled = [
    "EMAIL_ONLY",
    "EITHER_OR",
    "BOTH_REQUIRED",
  ].includes(formData.passSettings?.collegeMatchMode || "");

  const toggleCandidate = (title: string) => {
    const current = formData.registrationSettings.candidateTypes;
    const isEveryone = title === "Everyone can apply";

    if (current.includes(title)) {
      if (current.length <= 1) return;
      updateSettings({ candidateTypes: current.filter((t) => t !== title) });
    } else {
      if (isEveryone) {
        updateSettings({ candidateTypes: ["Everyone can apply"] });
      } else {
        const filtered = current.filter((t) => t !== "Everyone can apply");
        updateSettings({ candidateTypes: [...filtered, title] });
      }
    }
  };

  const candidateTypes = [
    { title: "Everyone can apply", value: "All Applicants" },
    { title: "School students", value: "Up to grade 12" },
    { title: "College students", value: "UG / PG Students" },
    { title: "Freshers", value: "0-1 Year Experience" },
    { title: "Professionals", value: "1+ Year Experience" },
  ];

  const DateTimeBlock = ({
    label,
    date,
    time,
    onDateSelect,
    onTimeChange,
  }: {
    label: string;
    date: Date | undefined;
    time: string;
    onDateSelect: (date: Date | undefined) => void;
    onTimeChange: (time: string) => void;
  }) => {
    return (
      <div className="w-fit bg-primary-100 border border-primary-200 rounded-2xl p-4 transition-all hover:border-primary-300">
        <p className="text-sm font-medium text-primary-600/70 mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-xl font-semibold text-neutral-800 outline-none w-fit whitespace-nowrap">
                {date ? format(date, "dd MMM yyyy") : "Select Date"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={onDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <div className="h-8 w-px bg-neutral-300" />

          <div className="relative flex items-center group">
            <input
              type="time"
              value={time}
              onChange={(e) => onTimeChange(e.target.value)}
              className="text-base text-primary-600 bg-transparent border-none outline-none font-medium poppins cursor-pointer"
            />
          </div>
        </div>
      </div>
    );
  };

  const [isEditingMaxUsers, setIsEditingMaxUsers] = useState(false);
  const [localMaxUsers, setLocalMaxUsers] = useState<string>(
    formData.registrationSettings.maxUsers?.toString() || "100"
  );

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div>
        <h2 className="text-2xl font-bold">Registration Settings</h2>
      </div>

      {/* Who Can Register */}
      <Container heading="Who Can Register" description="Select the type(s) of eligible candidates">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {candidateTypes.map((type, index) => {
            const isSelected =
              formData.registrationSettings.candidateTypes.includes(type.title);
            return (
              <div
                key={index}
                className={cn(
                  "p-2 flex gap-2 border rounded-lg transition-all",
                  isSelected
                    ? "bg-primary-100 border-primary-500 text-primary-600 cursor-normal"
                    : "border-neutral-500 text-primary-800 cursor-pointer hover:bg-primary-100"
                )}
                onClick={() => toggleCandidate(type.title)}
              >
                <div className="w-6 h-6">
                  <CheckCircle size={"24px"} />
                </div>
                <div className="flex flex-1 flex-col overflow-hidden">
                  <p className={cn("text-base font-medium text-neutral-800 truncate", isSelected && "text-primary-600")}>{type.title}</p>
                  <p className={cn("text-xs text-neutral-700")}>{type.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>

      {/* Registration deadline + event schedule */}
      <Container
        heading="Registration and schedule"
        description="Set when registration closes and when the event runs. Changes autosave."
      >
        <div className="flex flex-wrap gap-4 mt-2">
          {[
            {
              label: "Registration Deadline",
              date: formData.registrationSettings.endDate,
              time: formData.registrationSettings.endTime,
              onDateSelect: (date: Date | undefined) => updateSettings({ endDate: date }),
              onTimeChange: (time: string) => updateSettings({ endTime: time }),
            },
            {
              label: "Event Date & Time",
              date: formData.registrationSettings.eventDate,
              time: formData.registrationSettings.eventTime,
              onDateSelect: (date: Date | undefined) => updateSettings({ eventDate: date }),
              onTimeChange: (time: string) => updateSettings({ eventTime: time }),
            },
          ].map((block, idx) => (
            <DateTimeBlock
              key={idx}
              label={block.label}
              date={block.date}
              time={block.time}
              onDateSelect={block.onDateSelect}
              onTimeChange={block.onTimeChange}
            />
          ))}
        </div>
      </Container>

      {/* Max Number of Users */}
      <Container
        heading="Max Number Of Users"
        description="Restrict registrations"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 mt-2">
          <p className="text-base text-neutral-600 max-w-sm inter leading-relaxed">
            Choose &quot;No Limit&quot; to allow unlimited registrations for this event.
          </p>

          <div className="flex items-center">
            {formData.registrationSettings.maxTeamsNoLimit ? (
              <button
                onClick={() => {
                  updateSettings({
                    maxTeamsNoLimit: false,
                    maxUsers: 100,
                  });
                  setLocalMaxUsers("100");
                  setIsEditingMaxUsers(true);
                }}
                className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-primary-200 bg-primary-50/30 hover:bg-primary-50 transition-all group shadow-sm"
              >
                <InfinityIcon className="w-6 h-6 text-primary-600 group-hover:scale-110 transition-transform" />
                <span className="text-lg font-bold text-primary-600 poppins">No Limit</span>
              </button>
            ) : (
              <div className="flex items-center gap-4 bg-white border-2 border-primary-500 rounded-2xl p-3 px-5 shadow-lg animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-primary-600 uppercase tracking-tight mb-0.5">Participants</span>
                  <div className="flex items-center gap-2">
                    {isEditingMaxUsers ? (
                      <>
                        <input
                          type="number"
                          min={1}
                          value={localMaxUsers}
                          onChange={(e) => setLocalMaxUsers(e.target.value)}
                          className="text-2xl font-bold text-neutral-900 bg-transparent border-none outline-none w-20 poppins"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = parseInt(localMaxUsers);
                              if (!isNaN(val) && val > 0) {
                                updateSettings({ maxUsers: val });
                                setIsEditingMaxUsers(false);
                              }
                            }
                            if (e.key === "Escape") {
                              setLocalMaxUsers(formData.registrationSettings.maxUsers?.toString() || "100");
                              setIsEditingMaxUsers(false);
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const val = parseInt(localMaxUsers);
                            if (!isNaN(val) && val > 0) {
                              updateSettings({ maxUsers: val });
                              setIsEditingMaxUsers(false);
                            }
                          }}
                          className="p-1.5 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-all shadow-sm"
                        >
                          <CheckCircle size="20px" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditingMaxUsers(true)}
                        className="flex items-center gap-2 group"
                      >
                        <span className="text-2xl font-bold text-neutral-900 poppins">
                          {formData.registrationSettings.maxUsers ?? 100}
                        </span>
                        <div className="p-1.5 bg-neutral-100 text-neutral-500 rounded-lg group-hover:bg-primary-100 group-hover:text-primary-600 transition-all">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
                          >
                            <path
                              d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M18.5 2.50001C18.8978 2.10218 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10218 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.00001 21.8978 4.56261 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
                <div className="h-10 w-px bg-neutral-200" />
                <button
                  onClick={() => {
                    updateSettings({
                      maxTeamsNoLimit: true,
                      maxUsers: undefined,
                    });
                    setIsEditingMaxUsers(false);
                  }}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest transition-colors inter"
                >
                  Set Unlimited
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* EVENT PASS & RESTRICTION SETTINGS */}
      {formData.passSettings && (
        <Container
          heading="College Restriction and Pass Sending Preference"
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
                      allowedCollegeIds = [],
                      allowedEmailDomains = [],
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
      )}
    </div>
  );
}
