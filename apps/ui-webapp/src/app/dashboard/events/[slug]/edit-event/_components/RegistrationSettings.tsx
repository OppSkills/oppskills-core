"use client";

import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Clock,
  Infinity as InfinityIcon,
} from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import { FormData } from "../page";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

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
  // --- Handlers ---
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

  const toggleCandidate = (type: string) => {
    const current = formData.registrationSettings.candidateTypes;
    if (current.includes(type)) {
      updateSettings({ candidateTypes: current.filter((t) => t !== type) });
    } else {
      updateSettings({ candidateTypes: [...current, type] });
    }
  };

  const candidateTypes = [
    "Everyone can apply",
    "School students",
    "College students",
    "Freshers",
    "Professionals",
  ];

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div>
        <h2 className="text-2xl font-bold">Registration Settings</h2>
      </div>

      {/* Who Can Register */}
      <div className="w-full border rounded-2xl p-6 bg-card shadow-sm">
        <h3 className="text-lg font-bold mb-1">Who Can Register</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Select the type(s) of eligible candidates
        </p>

        <div className="flex flex-wrap gap-3">
          {candidateTypes.map((type) => {
            const isSelected =
              formData.registrationSettings.candidateTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => toggleCandidate(type)}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-medium transition-all",
                  isSelected
                    ? "bg-[#F3E8FF] text-[#9333EA] ring-1 ring-[#9333EA]"
                    : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                )}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Registration Timeline */}
      <div className="w-full border rounded-2xl p-6 bg-card shadow-sm">
        <h3 className="text-lg font-bold mb-1">Registration Timeline</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Start and end date of registration can be changed
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Start Date Block */}
          <div className="bg-muted/30 p-4 rounded-xl flex flex-col gap-3">
            <span className="text-xs font-semibold text-muted-foreground">
              Registration Start Date & Time
            </span>
            <div className="flex gap-2 flex-col">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-background border-none shadow-sm text-foreground justify-start px-3"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                    {formData.registrationSettings.startDate
                      ? format(
                          formData.registrationSettings.startDate,
                          "d MMM yyyy"
                        )
                      : "Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.registrationSettings.startDate}
                    onSelect={(date) => updateSettings({ startDate: date })}
                  />
                </PopoverContent>
              </Popover>
              <div className="bg-background rounded-md flex items-center p-3 shadow-sm w-[130px]">
                <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                <input
                  type="time"
                  className="bg-transparent border-none text-sm outline-none w-full font-medium"
                  value={formData.registrationSettings.startTime}
                  onChange={(e) =>
                    updateSettings({ startTime: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Deadline Block */}
          <div className="bg-muted/30 p-4 rounded-xl flex flex-col gap-3">
            <span className="text-xs font-semibold text-muted-foreground">
              Registration Deadline
            </span>
            <div className="flex gap-2 flex-col">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-background border-none shadow-sm text-foreground justify-start px-3"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                    {formData.registrationSettings.endDate
                      ? format(
                          formData.registrationSettings.endDate,
                          "d MMM yyyy"
                        )
                      : "Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.registrationSettings.endDate}
                    onSelect={(date) => updateSettings({ endDate: date })}
                  />
                </PopoverContent>
              </Popover>
              <div className="bg-background rounded-md flex items-center p-3 shadow-sm w-[130px]">
                <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                <input
                  type="time"
                  className="bg-transparent border-none text-sm outline-none w-full font-medium"
                  value={formData.registrationSettings.endTime}
                  onChange={(e) => updateSettings({ endTime: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Event Date Block */}
          <div className="bg-muted/30 p-4 rounded-xl flex flex-col gap-3">
            <span className="text-xs font-semibold text-muted-foreground">
              Event Date & Time
            </span>
            <div className="flex gap-2 flex-col">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-background border-none shadow-sm text-foreground justify-start px-3"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                    {formData.registrationSettings.eventDate
                      ? format(
                          formData.registrationSettings.eventDate,
                          "d MMM yyyy"
                        )
                      : "Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.registrationSettings.eventDate}
                    onSelect={(date) => updateSettings({ eventDate: date })}
                  />
                </PopoverContent>
              </Popover>
              <div className="bg-background rounded-md flex items-center p-3 shadow-sm w-[130px]">
                <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                <input
                  type="time"
                  className="bg-transparent border-none text-sm outline-none w-full font-medium"
                  value={formData.registrationSettings.eventTime}
                  onChange={(e) =>
                    updateSettings({ eventTime: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Max Number of Users */}
      <div className="w-full border rounded-2xl p-6 bg-card shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold mb-1">Max Number Of Users</h3>
          <p className="text-muted-foreground text-sm">
            Restrict the number of teams registering for event
          </p>
        </div>
        <div>
          <button
            onClick={() =>
              updateSettings({
                maxTeamsNoLimit: !formData.registrationSettings.maxTeamsNoLimit,
              })
            }
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-full border transition-all",
              formData.registrationSettings.maxTeamsNoLimit
                ? "border-[#F3E8FF] bg-background shadow-sm"
                : "border-border bg-background text-muted-foreground"
            )}
          >
            <InfinityIcon
              className={cn(
                "w-5 h-5",
                formData.registrationSettings.maxTeamsNoLimit
                  ? "text-purple-600"
                  : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-sm font-semibold",
                formData.registrationSettings.maxTeamsNoLimit
                  ? "text-purple-600"
                  : "text-muted-foreground"
              )}
            >
              {formData.registrationSettings.maxTeamsNoLimit
                ? "No Limit"
                : "Limit set"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
