"use client";

import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  ClockCircle as Clock,
  Infinity as InfinityIcon,
  CheckCircle,
} from "@solar-icons/react";
import React from "react";
import { cn } from "@/lib/utils";
import { FormData } from "../page";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatToIST } from "@/lib/date-utils";
import { format } from "date-fns";

import { Container } from "@/app/dashboard/_components/Container";


interface RegistrationSettingsProps {
  formData: FormData;
  setFormData: (data: React.SetStateAction<FormData>) => void;
  savedMaxTeams?: number | null;
}

/** Apply calendar date + HH:mm to a Date (local). */
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
  savedMaxTeams,
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
      // Keep canonical fields in sync so autosave snapshot + basic-details match registration tab.
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

  const [isEditingMaxTeams, setIsEditingMaxTeams] = React.useState(false);
  const [localMaxTeams, setLocalMaxTeams] = React.useState<string>(
    formData.registrationSettings.maxTeams?.toString() || "100"
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

      {/* Registration Timeline */}
      <Container
        heading="Registration Timeline"
        description="Set the start and end dates for registrations"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <DateTimeBlock
            label="Registration Starts"
            date={formData.eventDate}
            time={formData.eventTimeFrom}
            onDateSelect={(d) => updateSettings({ eventDate: d })}
            onTimeChange={(t) => updateSettings({ eventTime: t })}
          />
          <DateTimeBlock
            label="Registration Ends"
            date={formData.registrationSettings.endDate}
            time={formData.registrationSettings.endTime}
            onDateSelect={(d) => updateSettings({ endDate: d })}
            onTimeChange={(t) => updateSettings({ endTime: t })}
          />
        </div>
      </Container>

      {/* Maximum Number Of Teams */}
      <Container
        heading="Max Number Of Users"
        description='Choose "No Limit" to allow unlimited registrations.'
      >
        <div className="flex flex-row items-center gap-4 bg-primary-50/30 p-6 rounded-2xl border border-primary-100 w-full lg:w-fit">
          {!isEditingMaxTeams ? (
            <>
              {formData.registrationSettings.maxTeams === null ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <InfinityIcon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-neutral-800">No Limit</p>
                    <p className="text-sm text-neutral-500 inter">Unlimited registrations allowed</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <UsersGroup className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-neutral-800">
                      {formData.registrationSettings.maxTeams} Teams
                    </p>
                    <p className="text-sm text-neutral-500 inter">Registration limit set</p>
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingMaxTeams(true)}
                className="ml-4 rounded-full hover:bg-primary-100 text-primary-600"
              >
                <Pen className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full animate-in fade-in zoom-in-95 duration-200">
              <div className="relative w-full sm:w-48">
                <Input
                  type="number"
                  value={localMaxTeams}
                  onChange={(e) => setLocalMaxTeams(e.target.value)}
                  className="rounded-xl border-primary-200 focus:ring-primary-500 pr-10 poppins font-bold text-lg"
                  placeholder="Enter limit"
                  autoFocus
                />
                <UsersGroup className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-300" />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => {
                    const val = parseInt(localMaxTeams);
                    if (!isNaN(val) && val > 0) {
                      updateSettings({ maxTeams: val });
                      setIsEditingMaxTeams(false);
                    }
                  }}
                  className="rounded-full bg-primary-500 hover:bg-primary-600 font-bold px-6 flex-1 sm:flex-none"
                >
                  Update
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    updateSettings({ maxTeams: null });
                    setIsEditingMaxTeams(false);
                  }}
                  className="rounded-full border-primary-200 text-primary-600 font-bold px-6 flex-1 sm:flex-none"
                >
                  Set No Limit
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setLocalMaxTeams(formData.registrationSettings.maxTeams?.toString() || "100");
                    setIsEditingMaxTeams(false);
                  }}
                  className="rounded-full text-neutral-400 hover:text-neutral-600 flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

function UsersGroup(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function Pen(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}
