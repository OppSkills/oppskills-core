"use client";

import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  FileEdit,
  Plus,
  Save,
  X,
  Upload,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import RichTextEditor from "@/components/ui/editor/RichtextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatToIST } from "@/lib/date-utils";
import { format } from "date-fns";
import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FormData, Round } from "../page";
import { Container } from "@/app/dashboard/_components/Container";
import DOMPurify from "isomorphic-dompurify";

import { Textarea } from "@/components/ui/textarea";

interface RoundsAndStagesProps {
  formData: FormData;
  setFormData: (data: React.SetStateAction<FormData>) => void;
}

export default function RoundsAndStages({
  formData,
  setFormData,
}: RoundsAndStagesProps) {
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [tempRoundData, setTempRoundData] = useState<Round | null>(null);
  const editCardRef = useRef<HTMLDivElement>(null);

  // Scroll to edit card when editing starts
  useEffect(() => {
    if (editingRoundId && editCardRef.current) {
      editCardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [editingRoundId]);

  const handleAddRound = () => {
    const newRound: Round = {
      id: `new-${crypto.randomUUID()}`,
      name: `Round ${formData.rounds.length + 1}`,
      description: "Enter round details here...",
      startDate: new Date(),
      endDate: new Date(),
      startTime: "09:00",
      endTime: "18:00",
      roundType: "ONLINE",
      submissionConfig: {
        enabled: false,
        allowedFileTypes: [],
        maxFiles: 3,
        maxFileSizeBytes: 52428800,
        allowResubmission: true,
        instructions: "",
      },
    };
    // Automatically enter edit mode for new round WITHOUT updating formData yet
    setEditingRoundId(newRound.id);
    setTempRoundData(newRound);
  };

  const handleEditRound = (round: Round) => {
    setEditingRoundId(round.id);
    setTempRoundData({ ...round });
  };

  const handleCancelEdit = () => {
    setEditingRoundId(null);
    setTempRoundData(null);
  };

  const handleSaveRound = () => {
    if (!tempRoundData) return;

    if (!tempRoundData.name || tempRoundData.name.trim() === "") {
      toast.error("Round name cannot be empty");
      return;
    }

    // Ensure dates are valid Date objects
    const validatedRound: Round = {
      ...tempRoundData,
      startDate: tempRoundData.startDate instanceof Date ? tempRoundData.startDate : new Date(tempRoundData.startDate),
      endDate: tempRoundData.endDate instanceof Date ? tempRoundData.endDate : new Date(tempRoundData.endDate),
    };

    setFormData((prev) => {
      const roundExists = prev.rounds.some((r) => r.id === validatedRound.id);
      if (roundExists) {
        return {
          ...prev,
          rounds: prev.rounds.map((r) =>
            r.id === validatedRound.id ? validatedRound : r,
          ),
        };
      } else {
        return {
          ...prev,
          rounds: [...prev.rounds, validatedRound],
        };
      }
    });
    setEditingRoundId(null);
    setTempRoundData(null);
  };

  const handleDeleteRound = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      rounds: prev.rounds.filter((r) => r.id !== id),
    }));
    if (editingRoundId === id) {
      handleCancelEdit();
    }
    toast.success("Round deleted");
  };

  const handleClearAllRounds = () => {
    if (formData.rounds.length === 0) return;
    setFormData((prev) => ({ ...prev, rounds: [] }));
    toast.success("All rounds cleared");
    handleCancelEdit();
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-5 duration-500 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
      <Container
        heading="Rounds And Stages"
        description="Create different rounds which will represent each stage of opportunity. Add rounds in order."
      >
        <div className="flex justify-end gap-2 mb-4">
          {formData.rounds.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClearAllRounds}
              className="rounded-full border-neutral-300 text-neutral-600 hover:bg-neutral-50 font-bold px-6"
            >
              Clear all
            </Button>
          )}
          <Button
            onClick={handleAddRound}
            className="bg-primary-500 text-background hover:bg-primary-600 font-bold gap-2 rounded-full shadow-lg shadow-primary-500/20 px-6"
          >
            <Plus className="w-4 h-4" />
            Add Round
          </Button>
        </div>
      </Container>

      <div className="flex flex-col gap-0 w-full">
        {formData.rounds.length === 0 && (
          <div className="w-full flex justify-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
            No rounds added yet. Click &quot;Add Round&quot; to begin.
          </div>
        )}
        {formData.rounds.map((round, index) => {
          const isEditing = editingRoundId === round.id;
          const currentRound =
            isEditing && tempRoundData ? tempRoundData : round;

          return (
            <div key={round.id} className="flex gap-4 relative">
              {/* Timeline Line */}
              {index !== formData.rounds.length - 1 && (
                <div className="absolute left-[24px] top-[48px] bottom-[-24px] w-[2px] bg-secondary/50" />
              )}

              {/* Round Badge */}
              <div className="flex-shrink-0 z-10 pt-1">
                <div
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center border font-bold text-lg transition-colors",
                    isEditing
                      ? "bg-primary-500 text-background border-primary"
                      : "bg-secondary/50 text-secondary-foreground border-secondary",
                  )}
                >
                  R{index + 1}
                </div>
              </div>

              {/* Round Card */}
              <div
                ref={isEditing ? editCardRef : null}
                className={cn(
                  "flex-1 border rounded-xl p-6 mb-6 shadow-sm transition-all relative overflow-hidden",
                  isEditing
                    ? "bg-card ring-2 ring-primary-500 border-transparent"
                    : "bg-card border-border/50 hover:shadow-md",
                )}
              >
                {isEditing && tempRoundData ? (
                  // EDIT MODE
                  <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b pb-2">
                      <div className="text-sm font-semibold text-primary">
                        Editing Round {index + 1}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive-foreground"
                        onClick={() => handleDeleteRound(round.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label>Round Name</Label>
                        <Input
                          value={tempRoundData.name}
                          onChange={(e) =>
                            setTempRoundData({
                              ...tempRoundData,
                              name: e.target.value,
                            })
                          }
                          placeholder="e.g. Qualification Round"
                          className="font-semibold text-lg"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Round Type</Label>
                        <Select
                          value={tempRoundData.roundType}
                          onValueChange={(
                            value: "ONLINE" | "OFFLINE" | "PRESENTATION",
                          ) =>
                            setTempRoundData({
                              ...tempRoundData,
                              roundType: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select round type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ONLINE">Online</SelectItem>
                            <SelectItem value="OFFLINE">Offline</SelectItem>
                            <SelectItem value="PRESENTATION">
                              Presentation
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Start Date & Time */}
                      <div className="flex flex-col gap-2">
                        <Label>Start Date & Time</Label>
                        <div className="flex gap-2 flex-col">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !tempRoundData.startDate &&
                                  "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {tempRoundData.startDate ? (
                                  formatToIST(tempRoundData.startDate, { formatType: "full_date", showSuffix: false })
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={tempRoundData.startDate}
                                onSelect={(date) =>
                                  date &&
                                  setTempRoundData({
                                    ...tempRoundData,
                                    startDate: date,
                                  })
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <Input
                            type="time"
                            className="w-[120px]"
                            value={tempRoundData.startTime}
                            onChange={(e) =>
                              setTempRoundData({
                                ...tempRoundData,
                                startTime: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* End Date & Time */}
                      <div className="flex flex-col gap-2">
                        <Label>End Date & Time</Label>
                        <div className="flex gap-2 flex-col">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !tempRoundData.endDate &&
                                  "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {tempRoundData.endDate ? (
                                  formatToIST(tempRoundData.endDate, { formatType: "full_date", showSuffix: false })
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={tempRoundData.endDate}
                                onSelect={(date) =>
                                  date &&
                                  setTempRoundData({
                                    ...tempRoundData,
                                    endDate: date,
                                  })
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <Input
                            type="time"
                            className="w-[120px]"
                            value={tempRoundData.endTime}
                            onChange={(e) =>
                              setTempRoundData({
                                ...tempRoundData,
                                endTime: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                      <Label>Description</Label>
                      <div className="min-h-[150px] border rounded-md">
                        <RichTextEditor
                          value={tempRoundData.description}
                          onChange={(content: string) =>
                            setTempRoundData({
                              ...tempRoundData,
                              description: content,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 mt-4 p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-semibold">
                            Enable Submissions
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Allow participants to submit files for this round
                          </p>
                        </div>
                        <Switch
                          checked={
                            tempRoundData.submissionConfig?.enabled ?? false
                          }
                          onCheckedChange={(checked) =>
                            setTempRoundData({
                              ...tempRoundData,
                              submissionConfig: {
                                ...tempRoundData.submissionConfig,
                                enabled: checked,
                                allowedFileTypes:
                                  tempRoundData.submissionConfig
                                    ?.allowedFileTypes ?? [],
                                maxFiles:
                                  tempRoundData.submissionConfig?.maxFiles ?? 3,
                                maxFileSizeBytes:
                                  tempRoundData.submissionConfig
                                    ?.maxFileSizeBytes ?? 52428800,
                                allowResubmission:
                                  tempRoundData.submissionConfig
                                    ?.allowResubmission ?? true,
                                instructions:
                                  tempRoundData.submissionConfig
                                    ?.instructions ?? "",
                              },
                            })
                          }
                        />
                      </div>

                      {tempRoundData.submissionConfig?.enabled && (
                        <div className="flex flex-col gap-4 pt-2 border-t">
                          <div className="flex flex-col gap-2">
                            <Label>Allowed File Types</Label>
                            <div className="flex flex-wrap gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={
                                    tempRoundData.submissionConfig.allowedFileTypes?.includes(
                                      "pdf",
                                    ) ?? false
                                  }
                                  onCheckedChange={(checked) => {
                                    const current =
                                      tempRoundData.submissionConfig
                                        ?.allowedFileTypes ?? [];
                                    const updated = checked
                                      ? [...current, "pdf" as const]
                                      : current.filter((t) => t !== "pdf");
                                    setTempRoundData({
                                      ...tempRoundData,
                                      submissionConfig: {
                                        ...tempRoundData.submissionConfig!,
                                        allowedFileTypes: updated,
                                      },
                                    });
                                  }}
                                />
                                <span className="text-sm">PDF</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={
                                    tempRoundData.submissionConfig.allowedFileTypes?.includes(
                                      "ppt",
                                    ) ?? false
                                  }
                                  onCheckedChange={(checked) => {
                                    const current =
                                      tempRoundData.submissionConfig
                                        ?.allowedFileTypes ?? [];
                                    const updated = checked
                                      ? [...current, "ppt" as const]
                                      : current.filter((t) => t !== "ppt");
                                    setTempRoundData({
                                      ...tempRoundData,
                                      submissionConfig: {
                                        ...tempRoundData.submissionConfig!,
                                        allowedFileTypes: updated,
                                      },
                                    });
                                  }}
                                />
                                <span className="text-sm">PPT/PPTX</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={
                                    tempRoundData.submissionConfig.allowedFileTypes?.includes(
                                      "image",
                                    ) ?? false
                                  }
                                  onCheckedChange={(checked) => {
                                    const current =
                                      tempRoundData.submissionConfig
                                        ?.allowedFileTypes ?? [];
                                    const updated = checked
                                      ? [...current, "image" as const]
                                      : current.filter((t) => t !== "image");
                                    setTempRoundData({
                                      ...tempRoundData,
                                      submissionConfig: {
                                        ...tempRoundData.submissionConfig!,
                                        allowedFileTypes: updated,
                                      },
                                    });
                                  }}
                                />
                                <span className="text-sm">Images</span>
                              </label>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                              <Label className="text-sm text-muted-foreground">
                                Max Files
                              </Label>
                              <div className="text-sm font-medium">3 files</div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label className="text-sm text-muted-foreground">
                                Max Size per File
                              </Label>
                              <div className="text-sm font-medium">50 MB</div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Label>Submission Instructions (Optional)</Label>
                            <Input
                              value={
                                tempRoundData.submissionConfig.instructions ??
                                ""
                              }
                              onChange={(e) =>
                                setTempRoundData({
                                  ...tempRoundData,
                                  submissionConfig: {
                                    ...tempRoundData.submissionConfig!,
                                    instructions: e.target.value,
                                  },
                                })
                              }
                              placeholder="e.g., Submit your pitch deck in PDF format"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 mt-2 pt-4 border-t">
                      <Button variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveRound} className="gap-2">
                        <Save className="w-4 h-4" /> Save Round
                      </Button>
                    </div>
                  </div>
                ) : (
                  // VIEW MODE
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold">{round.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={cn(
                              "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border",
                              round.roundType === "ONLINE"
                                ? "bg-blue-50 text-blue-600 border-blue-200"
                                : round.roundType === "OFFLINE"
                                  ? "bg-orange-50 text-orange-600 border-orange-200"
                                  : "bg-purple-50 text-purple-600 border-purple-200",
                            )}
                          >
                            {round.roundType}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-2">
                        <div className="bg-secondary/30 rounded-lg px-4 py-2 text-center border border-secondary/50">
                          <div className="text-[10px] uppercase tracking-wider text-secondary-foreground font-semibold mb-1">
                            Starts
                          </div>
                          <div className="text-sm font-medium whitespace-nowrap">
                            {formatToIST(round.startDate, { formatType: "full_date", showSuffix: false })},{" "}
                            {round.startTime}
                          </div>
                        </div>
                        <div className="bg-secondary/30 rounded-lg px-4 py-2 text-center border border-secondary/50">
                          <div className="text-[10px] uppercase tracking-wider text-secondary-foreground font-semibold mb-1">
                            Ends
                          </div>
                          <div className="text-sm font-medium whitespace-nowrap">
                            {formatToIST(round.endDate, { formatType: "full_date", showSuffix: false })},{" "}
                            {round.endTime}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="prose prose-sm max-w-none text-muted-foreground w-full break-words">
                      {/* Safe render of HTML description for preview */}
                      <div
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(round.description),
                        }}
                      />
                    </div>

                    <div className="mt-2 pt-4 border-t border-border/50 flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => handleEditRound(round)}
                        className="text-primary-500 border-primary/20 hover:bg-primary/5 rounded-full h-9 text-xs gap-1.5 px-4"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        Edit Round
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Render a new round being created but not yet saved */}
        {editingRoundId &&
          !formData.rounds.find((r) => r.id === editingRoundId) &&
          tempRoundData && (
            <div className="flex gap-4 relative">
              {/* Round Badge */}
              <div className="flex-shrink-0 z-10 pt-1">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center border font-bold text-lg transition-colors bg-primary-500 text-background border-primary">
                  R{formData.rounds.length + 1}
                </div>
              </div>

              {/* Round Card (Edit Form) */}
              <div
                ref={editCardRef}
                className="flex-1 border rounded-xl p-6 mb-6 shadow-sm transition-all relative overflow-hidden bg-card ring-2 ring-primary-500 border-transparent"
              >
                <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div className="text-sm font-semibold text-primary">
                      Creating New Round
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive-foreground"
                      onClick={() => handleCancelEdit()}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label>Round Name</Label>
                      <Input
                        value={tempRoundData.name}
                        onChange={(e) =>
                          setTempRoundData({
                            ...tempRoundData,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g. Qualification Round"
                        className="font-semibold text-lg"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Round Type</Label>
                      <Select
                        value={tempRoundData.roundType}
                        onValueChange={(
                          value: "ONLINE" | "OFFLINE" | "PRESENTATION",
                        ) =>
                          setTempRoundData({
                            ...tempRoundData,
                            roundType: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select round type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ONLINE">Online</SelectItem>
                          <SelectItem value="OFFLINE">Offline</SelectItem>
                          <SelectItem value="PRESENTATION">
                            Presentation
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label>Starts At</Label>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !tempRoundData.startDate &&
                                "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {tempRoundData.startDate ? (
                                format(tempRoundData.startDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={tempRoundData.startDate}
                              onSelect={(date) =>
                                date &&
                                setTempRoundData({
                                  ...tempRoundData,
                                  startDate: date,
                                })
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          type="time"
                          className="w-[120px]"
                          value={tempRoundData.startTime}
                          onChange={(e) =>
                            setTempRoundData({
                              ...tempRoundData,
                              startTime: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Ends At</Label>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !tempRoundData.endDate &&
                                "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {tempRoundData.endDate ? (
                                format(tempRoundData.endDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={tempRoundData.endDate}
                              onSelect={(date) =>
                                date &&
                                setTempRoundData({
                                  ...tempRoundData,
                                  endDate: date,
                                })
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          type="time"
                          className="w-[120px]"
                          value={tempRoundData.endTime}
                          onChange={(e) =>
                            setTempRoundData({
                              ...tempRoundData,
                              endTime: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Description</Label>
                    <Textarea
                      value={tempRoundData.description}
                      onChange={(e) =>
                        setTempRoundData({
                          ...tempRoundData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe what happens in this round..."
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Submission Configuration */}
                  <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-secondary/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">
                          Submissions
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Enable participants to upload files for this round.
                        </span>
                      </div>
                      <Switch
                        checked={tempRoundData.submissionConfig?.enabled ?? false}
                        onCheckedChange={(checked) =>
                          setTempRoundData({
                            ...tempRoundData,
                            submissionConfig: {
                              allowedFileTypes: [],
                              maxFiles: 3,
                              maxFileSizeBytes: 50 * 1024 * 1024,
                              allowResubmission: true,
                              instructions: "",
                              ...tempRoundData.submissionConfig,
                              enabled: checked,
                            },
                          })
                        }
                      />
                    </div>

                    {tempRoundData.submissionConfig?.enabled && (
                      <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs">Allowed File Types</Label>
                          <div className="flex flex-wrap gap-2">
                            {(["pdf", "ppt", "image"] as const).map((type) => (
                              <Button
                                key={type}
                                type="button"
                                variant={
                                  tempRoundData.submissionConfig?.allowedFileTypes.includes(
                                    type,
                                  )
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                className="h-7 text-[10px] uppercase tracking-wider"
                                onClick={() => {
                                  const currentTypes =
                                    tempRoundData.submissionConfig
                                      ?.allowedFileTypes || [];
                                  const nextTypes = currentTypes.includes(type)
                                    ? currentTypes.filter((t) => t !== type)
                                    : [...currentTypes, type];
                                  setTempRoundData({
                                    ...tempRoundData,
                                    submissionConfig: {
                                      ...tempRoundData.submissionConfig!,
                                      allowedFileTypes: nextTypes,
                                    },
                                  });
                                }}
                              >
                                {type}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Label className="text-xs">Instructions</Label>
                          <Textarea
                            value={tempRoundData.submissionConfig?.instructions}
                            onChange={(e) =>
                              setTempRoundData({
                                ...tempRoundData,
                                submissionConfig: {
                                  ...tempRoundData.submissionConfig!,
                                  instructions: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g. Upload your project PDF here..."
                            className="min-h-[60px] text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-2">
                    <Button
                      variant="outline"
                      onClick={() => handleCancelEdit()}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => handleSaveRound()}>
                      Save Round
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground flex flex-col gap-2">
        <p>Changes are saved automatically.</p>
      </div>
    </div>
  );
}
