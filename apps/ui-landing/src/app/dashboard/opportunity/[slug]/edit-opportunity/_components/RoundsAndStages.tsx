"use client";

import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  FileEdit,
  Plus,
  Save,
  X,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/ui/editor/RichtextEditor";
import { format } from "date-fns";
import React, { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FormData, Round } from "../page";

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

  const handleAddRound = () => {
    const newRound: Round = {
      id: crypto.randomUUID(),
      name: `Round ${formData.rounds.length + 1}`,
      description: "Enter round details here...",
      startDate: new Date(),
      endDate: new Date(),
      startTime: "09:00",
      endTime: "18:00",
    };
    setFormData((prev) => ({
      ...prev,
      rounds: [...prev.rounds, newRound],
    }));
    // Automatically enter edit mode for new round
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
    setFormData((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r) =>
        r.id === tempRoundData.id ? tempRoundData : r
      ),
    }));
    setEditingRoundId(null);
    setTempRoundData(null);
    toast.success("Round updated successfully");
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
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Rounds And Stages</h2>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Create different rounds which will represent each stage of
            opportunity. Add rounds in order.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {formData.rounds.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClearAllRounds}
              className="rounded-full"
            >
              Clear all
            </Button>
          )}
          <Button
            onClick={handleAddRound}
            className="bg-primary-500 text-white hover:bg-primary/90 font-semibold gap-2 rounded-full shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Add Round
          </Button>
        </div>
      </div>

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
                      ? "bg-primary-500 text-white border-primary"
                      : "bg-secondary/50 text-secondary-foreground border-secondary"
                  )}
                >
                  R{index + 1}
                </div>
              </div>

              {/* Round Card */}
              <div
                className={cn(
                  "flex-1 border rounded-xl p-6 mb-6 shadow-sm transition-all relative overflow-hidden",
                  isEditing
                    ? "bg-card ring-2 ring-primary-500 border-transparent"
                    : "bg-card border-border/50 hover:shadow-md"
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
                                    "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {tempRoundData.startDate ? (
                                  format(tempRoundData.startDate, "d MMM yyyy")
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
                                    "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {tempRoundData.endDate ? (
                                  format(tempRoundData.endDate, "d MMM yyyy")
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
                      </div>
                      <div className="flex flex-col md:flex-row gap-2">
                        <div className="bg-secondary/30 rounded-lg px-4 py-2 text-center border border-secondary/50">
                          <div className="text-[10px] uppercase tracking-wider text-secondary-foreground font-semibold mb-1">
                            Starts
                          </div>
                          <div className="text-sm font-medium whitespace-nowrap">
                            {format(round.startDate, "d MMM yyyy")},{" "}
                            {round.startTime}
                          </div>
                        </div>
                        <div className="bg-secondary/30 rounded-lg px-4 py-2 text-center border border-secondary/50">
                          <div className="text-[10px] uppercase tracking-wider text-secondary-foreground font-semibold mb-1">
                            Ends
                          </div>
                          <div className="text-sm font-medium whitespace-nowrap">
                            {format(round.endDate, "d MMM yyyy")},{" "}
                            {round.endTime}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="prose prose-sm max-w-none text-muted-foreground w-full break-words">
                      {/* Safe render of HTML description for preview */}
                      <div
                        dangerouslySetInnerHTML={{
                          __html: round.description,
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
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        Changes are saved automatically.
      </div>
    </div>
  );
}
