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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { searchColleges, getCollegesByIds } from "@/lib/api/collegesApi";
import RegistrationQuestionsModal, {
  RegistrationQuestion,
} from "@/components/ui/hackathon/RegistrationQuestionsModal";
import { Check, Plus, Menu } from "lucide-react";

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
  const { getToken } = useAuth();
  const [collegeSearch, setCollegeSearch] = React.useState("");
  const [collegeNamesMap, setCollegeNamesMap] = React.useState<Record<string, string>>({});
  const fetchingRef = React.useRef<Set<string>>(new Set());

  const { data: colleges } = useQuery({
    queryKey: ["colleges", collegeSearch],
    queryFn: async () => {
      const token = await getToken();
      if (!token || collegeSearch.length < 2) return [];
      return searchColleges(token, collegeSearch);
    },
    enabled: collegeSearch.length >= 2,
  });

  // Fetch college names for selected college IDs
  React.useEffect(() => {
    const fetchMissingCollegeNames = async () => {
      const selectedIds = formData.registrationSettings.allowedCollegeIds;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.registrationSettings.allowedCollegeIds]);

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
      if ("endDate" in updates || "endTime" in updates) {
        if (nextRegs.endDate) {
          next.eventRegisterBy = applyTimeToDate(
            nextRegs.endDate,
            nextRegs.endTime,
          );
        } else {
          next.eventRegisterBy = undefined;
        }
      }
      if ("eventDate" in updates) {
        next.eventDate = nextRegs.eventDate;
      }
      if ("eventTime" in updates) {
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
      if (title === "College students") {
        updateSettings({ collegeRestrictionEnabled: false });
      }
    } else {
      if (isEveryone) {
        updateSettings({ candidateTypes: ["Everyone can apply"] });
      } else {
        const filtered = current.filter((t) => t !== "Everyone can apply");
        updateSettings({ candidateTypes: [...filtered, title] });
      }
    }
  };

  const addCollege = (collegeId: string, collegeName: string) => {
    const current = formData.registrationSettings.allowedCollegeIds || [];
    if (!current.includes(collegeId)) {
      updateSettings({
        allowedCollegeIds: [...current, collegeId],
      });
      setCollegeNamesMap((prev) => ({ ...prev, [collegeId]: collegeName }));
    }
  };

  const removeCollege = (collegeId: string) => {
    const current = formData.registrationSettings.allowedCollegeIds || [];
    updateSettings({
      allowedCollegeIds: current.filter((id) => id !== collegeId),
    });
    setCollegeNamesMap((prev) => {
      const updated = { ...prev };
      delete updated[collegeId];
      return updated;
    });
  };

  const addEmailDomain = (domain: string) => {
    const trimmed = domain.trim();
    const current = formData.registrationSettings.allowedEmailDomains || [];
    if (trimmed && !current.includes(trimmed)) {
      updateSettings({
        allowedEmailDomains: [...current, trimmed],
      });
    }
  };

  const removeEmailDomain = (domain: string) => {
    const current = formData.registrationSettings.allowedEmailDomains || [];
    updateSettings({
      allowedEmailDomains: current.filter((d) => d !== domain),
    });
  };

  const profileMatchingEnabled = [
    "PROFILE_ONLY",
    "EITHER_OR",
    "BOTH_REQUIRED",
  ].includes(formData.registrationSettings.collegeMatchMode);

  const emailMatchingEnabled = [
    "EMAIL_ONLY",
    "EITHER_OR",
    "BOTH_REQUIRED",
  ].includes(formData.registrationSettings.collegeMatchMode);

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

  const VerificationAlert = ({ message }: { message: string }) => (
    <div className="flex items-center gap-2 p-3 text-sm rounded-lg bg-amber-50 text-amber-700 border border-amber-200 animate-in fade-in zoom-in duration-300">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span className="inter font-medium">{message}</span>
    </div>
  );

  const QuestionItem = ({ label, required }: { label: string; required: boolean }) => (
    <div className="bg-neutral-200 rounded-lg p-2 flex items-center justify-between border border-neutral-100 shadow-sm">
      <div className="flex items-center gap-4">
        <Menu className="w-4 h-4 text-neutral-900" />
        <span className="text-base text-neutral-900">{label}</span>
      </div>
      {required && (
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-neutral-100 text-neutral-700 border-neutral-100 font-normal px-2 py-1 h-auto text-sm rounded-lg">
            Required
          </Badge>
          <div className="w-6 h-6 rounded-full bg-UI-success flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
      {!required && (
        <Badge variant="secondary" className="bg-white text-neutral-400 border-neutral-100 font-normal px-4 py-1.5 h-auto text-sm italic">
          Optional
        </Badge>
      )}
    </div>
  );

  const AddQuestionButton = ({ onClick }: { onClick: () => void }) => (
    <Button
      onClick={onClick}
      className="mt-6 bg-primary-700 hover:bg-primary-800 text-neutral-100 rounded-full px-6 py-3 h-auto font-medium flex items-center gap-3 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10">
        <Plus className="w-5 h-5 text-white" />
      </div>
      <span className="text-lg poppins">Add New Question</span>
    </Button>
  );

  const CandidateCard = ({
    title,
    value,
    isSelected,
    onClick,
  }: {
    title: string;
    value: string;
    isSelected: boolean;
    onClick: () => void;
  }) => (
    <div
      className={cn(
        "p-2 flex gap-2 border rounded-lg transition-all",
        isSelected
          ? "bg-primary-100 border-primary-500 text-primary-600 cursor-normal"
          : "border-neutral-500 text-primary-800 cursor-pointer hover:bg-primary-100"
      )}
      onClick={onClick}
    >
      <div className="w-6 h-6">
        <CheckCircle size={"24px"} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <p
          className={cn(
            "text-base font-medium text-neutral-800 truncate",
            isSelected && "text-primary-600"
          )}
        >
          {title}
        </p>
        <p className={cn("text-xs text-neutral-700")}>{value}</p>
      </div>
    </div>
  );

  const [isEditingMaxTeams, setIsEditingMaxTeams] = React.useState(false);
  const [localMaxTeams, setLocalMaxTeams] = React.useState<string>(
    formData.registrationSettings.maxTeams?.toString() || ""
  );

  const [showRegistrationModal, setShowRegistrationModal] = React.useState(false);

  const defaultFixedQuestions: RegistrationQuestion[] = React.useMemo(
    () => [
      { id: "fixed-1", label: "Name", type: "Text", required: true, fixed: true },
      { id: "fixed-3", label: "Email", type: "Email", required: true, fixed: true },
      { id: "fixed-2", label: "Mobile Number", type: "Phone No.", required: true, fixed: true },
      { id: "fixed-4", label: "Gender", type: "Options", required: true, fixed: true, options: ["Male", "Female", "Other", "Prefer not to say"] },
      { id: "fixed-5", label: "Current College / Organization", type: "Text", required: true, fixed: true },
      { id: "fixed-6", label: "User Type", type: "Options", required: true, fixed: true, options: ["Student", "Professional"] },
    ],
    []
  );

  const allQuestions = React.useMemo(() => {
    return [...defaultFixedQuestions, ...formData.registrationQuestions];
  }, [formData.registrationQuestions, defaultFixedQuestions]);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div>
        <h2 className="text-2xl font-bold">Registration Settings</h2>
      </div>

      {/* Who Can Register */}
      <Container heading="Who Can Register" description="Select the type(s) of eligible candidates">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {candidateTypes.map((type, index) => (
            <CandidateCard
              key={index}
              title={type.title}
              value={type.value}
              isSelected={formData.registrationSettings.candidateTypes.includes(type.title)}
              onClick={() => toggleCandidate(type.title)}
            />
          ))}
        </div>
        {formData.registrationSettings.candidateTypes.includes("College students") && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <Checkbox
                id="collegeRestrictions"
                checked={formData.registrationSettings.collegeRestrictionEnabled}
                onCheckedChange={(checked) =>
                  updateSettings({
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

            {formData.registrationSettings.collegeRestrictionEnabled && (
              <div className="space-y-6 pl-4 border-l-2 border-primary-100 mt-4 animate-in slide-in-from-left-2 duration-300">
                {(() => {
                  const {
                    allowedCollegeIds = [],
                    allowedEmailDomains = [],
                    collegeMatchMode,
                  } = formData.registrationSettings;
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
                    return <VerificationAlert message={message} />;
                  }
                  return null;
                })()}

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-neutral-700 inter uppercase tracking-wider">Verification Method</Label>
                  <Select
                    value={formData.registrationSettings.collegeMatchMode}
                    onValueChange={(value) =>
                      updateSettings({
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
                    {formData.registrationSettings.allowedCollegeIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.registrationSettings.allowedCollegeIds.map((collegeId) => {
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

                {emailMatchingEnabled && (
                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-neutral-700 inter uppercase tracking-wider">Allowed Email Domains</Label>
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
                    {formData.registrationSettings.allowedEmailDomains.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.registrationSettings.allowedEmailDomains.map((domain) => (
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
        )}
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
              {formData.registrationSettings.maxTeamsNoLimit || formData.registrationSettings.maxTeams === null || formData.registrationSettings.maxTeams === undefined ? (
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
                      updateSettings({ maxTeams: val, maxTeamsNoLimit: false });
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
                    updateSettings({ maxTeams: null, maxTeamsNoLimit: true });
                    setIsEditingMaxTeams(false);
                  }}
                  className="rounded-full border-primary-200 text-primary-600 font-bold px-6 flex-1 sm:flex-none"
                >
                  Set No Limit
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setLocalMaxTeams(formData.registrationSettings.maxTeams?.toString() || "");
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

      {/* Basic Questions */}
      <Container
        heading="Basic Questions"
        description="Filled by all team members"
      >
        <div className="space-y-3">
          {allQuestions.map((q) => (
            <QuestionItem key={q.id} label={q.label} required={q.required} />
          ))}

          <AddQuestionButton onClick={() => setShowRegistrationModal(true)} />
        </div>
      </Container>

      <RegistrationQuestionsModal
        open={showRegistrationModal}
        onOpenChange={setShowRegistrationModal}
        questions={formData.registrationQuestions}
        onSave={(questions) => setFormData(prev => ({ ...prev, registrationQuestions: questions }))}
      />
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
