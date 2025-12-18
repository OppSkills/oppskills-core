"use client";

import { Button } from "@/components/ui/button";
import {
    Calendar as CalendarIcon,
    Clock,
    Infinity as InfinityIcon,
    Menu,
    CheckCircle2,
    PlusCircle,
    Trash2,
    Lock,
} from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import { FormData, BasicQuestion } from "../page"; // Importing types from page.tsx
import { Input } from "@/components/ui/input";
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

export default function RegistrationSettings({ formData, setFormData }: RegistrationSettingsProps) {

    // --- Handlers ---
    const updateSettings = (updates: Partial<FormData['registrationSettings']>) => {
        setFormData(prev => ({
            ...prev,
            registrationSettings: {
                ...prev.registrationSettings,
                ...updates
            }
        }));
    };

    const toggleCandidate = (type: string) => {
        const current = formData.registrationSettings.candidateTypes;
        if (current.includes(type)) {
            updateSettings({ candidateTypes: current.filter(t => t !== type) });
        } else {
            updateSettings({ candidateTypes: [...current, type] });
        }
    };

    // Questions Handlers
    const handleAddQuestion = () => {
        const newQuestion: BasicQuestion = {
            id: crypto.randomUUID(),
            label: "",
            required: false,
            isStatic: false
        };
        updateSettings({ questions: [...formData.registrationSettings.questions, newQuestion] });
    };

    const handleUpdateQuestion = (id: string, updates: Partial<BasicQuestion>) => {
        const updatedQuestions = formData.registrationSettings.questions.map(q =>
            q.id === id ? { ...q, ...updates } : q
        );
        updateSettings({ questions: updatedQuestions });
    };

    const handleDeleteQuestion = (id: string) => {
        const updatedQuestions = formData.registrationSettings.questions.filter(q => q.id !== id);
        updateSettings({ questions: updatedQuestions });
    };

    const candidateTypes = ["Everyone can apply", "School students", "College students", "Freshers", "Professionals"];

    return (
        <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div>
                <h2 className="text-2xl font-bold">Registration Settings</h2>
            </div>

            {/* Who Can Register */}
            <div className="w-full border rounded-2xl p-6 bg-card shadow-sm">
                <h3 className="text-lg font-bold mb-1">Who Can Register</h3>
                <p className="text-muted-foreground text-sm mb-6">Select the type(s) of eligible candidates</p>

                <div className="flex flex-wrap gap-3">
                    {candidateTypes.map((type) => {
                        const isSelected = formData.registrationSettings.candidateTypes.includes(type);
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
                        )
                    })}
                </div>
            </div>

            {/* Registration Timeline */}
            <div className="w-full border rounded-2xl p-6 bg-card shadow-sm">
                <h3 className="text-lg font-bold mb-1">Registration Timeline</h3>
                <p className="text-muted-foreground text-sm mb-6">Start and end date of registration can be changed</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Start Date Block */}
                    <div className="bg-muted/30 p-4 rounded-xl flex flex-col gap-3">
                        <span className="text-xs font-semibold text-muted-foreground">Registration Start Date & Time</span>
                        <div className="flex gap-2 flex-col">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full bg-white border-none shadow-sm text-foreground justify-start px-3">
                                        <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                                        {formData.registrationSettings.startDate ? format(formData.registrationSettings.startDate, "d MMM yyyy") : "Date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.registrationSettings.startDate} onSelect={(date) => updateSettings({ startDate: date })} /></PopoverContent>
                            </Popover>
                            <div className="bg-white rounded-md flex items-center p-3 shadow-sm w-[130px]">
                                <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                                <input
                                    type="time"
                                    className="bg-transparent border-none text-sm outline-none w-full font-medium"
                                    value={formData.registrationSettings.startTime}
                                    onChange={e => updateSettings({ startTime: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Deadline Block */}
                    <div className="bg-muted/30 p-4 rounded-xl flex flex-col gap-3">
                        <span className="text-xs font-semibold text-muted-foreground">Registration Deadline</span>
                        <div className="flex gap-2 flex-col">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full bg-white border-none shadow-sm text-foreground justify-start px-3">
                                        <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                                        {formData.registrationSettings.endDate ? format(formData.registrationSettings.endDate, "d MMM yyyy") : "Date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.registrationSettings.endDate} onSelect={(date) => updateSettings({ endDate: date })} /></PopoverContent>
                            </Popover>
                            <div className="bg-white rounded-md flex items-center p-3 shadow-sm w-[130px]">
                                <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                                <input
                                    type="time"
                                    className="bg-transparent border-none text-sm outline-none w-full font-medium"
                                    value={formData.registrationSettings.endTime}
                                    onChange={e => updateSettings({ endTime: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Event Date Block */}
                    <div className="bg-muted/30 p-4 rounded-xl flex flex-col gap-3">
                        <span className="text-xs font-semibold text-muted-foreground">Event Date & Time</span>
                        <div className="flex gap-2 flex-col">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full bg-white border-none shadow-sm text-foreground justify-start px-3">
                                        <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                                        {formData.registrationSettings.eventDate ? format(formData.registrationSettings.eventDate, "d MMM yyyy") : "Date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.registrationSettings.eventDate} onSelect={(date) => updateSettings({ eventDate: date })} /></PopoverContent>
                            </Popover>
                            <div className="bg-white rounded-md flex items-center p-3 shadow-sm w-[130px]">
                                <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                                <input
                                    type="time"
                                    className="bg-transparent border-none text-sm outline-none w-full font-medium"
                                    value={formData.registrationSettings.eventTime}
                                    onChange={e => updateSettings({ eventTime: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Max Number of Teams */}
            <div className="w-full border rounded-2xl p-6 bg-card shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold mb-1">Max Number Of Teams</h3>
                    <p className="text-muted-foreground text-sm">Restrict the number of teams registering for event</p>
                </div>
                <div>
                    <button
                        onClick={() => {
                            const next = !formData.registrationSettings.maxTeamsNoLimit;
                            updateSettings({
                                maxTeamsNoLimit: next,
                                maxTeams: next
                                    ? undefined
                                    : (typeof formData.registrationSettings.maxTeams === "number"
                                        ? formData.registrationSettings.maxTeams
                                        : 1),
                            });
                        }}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-full border transition-all",
                            formData.registrationSettings.maxTeamsNoLimit
                                ? "border-[#F3E8FF] bg-white shadow-sm"
                                : "border-border bg-white text-muted-foreground"
                        )}
                    >
                        <InfinityIcon className={cn("w-5 h-5", formData.registrationSettings.maxTeamsNoLimit ? "text-purple-600" : "text-muted-foreground")} />
                        <span className={cn("text-sm font-semibold", formData.registrationSettings.maxTeamsNoLimit ? "text-purple-600" : "text-muted-foreground")}>
                            {formData.registrationSettings.maxTeamsNoLimit ? "No Limit" : "Limit set"}
                        </span>
                    </button>
                </div>
            </div>

            {!formData.registrationSettings.maxTeamsNoLimit && (
                <div className="w-full border rounded-2xl p-6 bg-card shadow-sm">
                    <div className="flex flex-col gap-2 max-w-sm">
                        <span className="text-sm font-semibold text-foreground">Set max teams</span>
                        <Input
                            type="number"
                            min={1}
                            step={1}
                            value={
                                typeof formData.registrationSettings.maxTeams === "number"
                                    ? String(formData.registrationSettings.maxTeams)
                                    : ""
                            }
                            onChange={(e) => {
                                const raw = e.target.value;
                                if (raw.trim().length === 0) {
                                    updateSettings({ maxTeams: undefined });
                                    return;
                                }
                                const parsed = Number(raw);
                                if (!Number.isInteger(parsed) || parsed < 1) {
                                    updateSettings({ maxTeams: undefined });
                                    return;
                                }
                                updateSettings({ maxTeams: parsed });
                            }}
                            placeholder="e.g. 200"
                            className="bg-background"
                        />
                        <p className="text-xs text-muted-foreground">
                            Must be at least 1. Choose “No Limit” for infinite teams.
                        </p>
                    </div>
                </div>
            )}

            {/* Basic Questions */}
            <div className="w-full border rounded-2xl p-6 bg-card shadow-sm">
                <h3 className="text-lg font-bold mb-1">Basic Questions</h3>
                <p className="text-muted-foreground text-sm mb-6">Filled by all team members</p>

                <div className="flex flex-col gap-3">
                    {formData.registrationSettings.questions.map((question) => {
                        if (question.isStatic) {
                            return (
                                <div key={question.id} className="group flex items-center gap-3 bg-muted/30 p-3 rounded-lg border border-transparent">
                                    <div className="text-muted-foreground/50 p-1 cursor-default">
                                        <Menu className="w-4 h-4" />
                                    </div>

                                    <div className="flex-1">
                                        <span className="font-medium text-sm text-foreground">{question.label}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="bg-white px-3 py-1 rounded text-xs font-medium text-muted-foreground shadow-sm flex items-center gap-1">
                                            Required
                                            <Lock className="w-3 h-3 text-muted-foreground/50" />
                                        </div>
                                        <div className="p-1">
                                            <CheckCircle2 className="w-6 h-6 text-green-600 fill-green-100" />
                                        </div>
                                    </div>
                                </div>
                            );
                        } else {
                            return (
                                <div key={question.id} className="group flex items-center gap-3 bg-white p-3 rounded-lg border border-border/60 hover:border-primary/30 transition-all shadow-sm">
                                    <div className="text-muted-foreground cursor-grab active:cursor-grabbing p-1">
                                        <Menu className="w-4 h-4" />
                                    </div>

                                    <div className="flex-1">
                                        <Input
                                            value={question.label}
                                            onChange={(e) => handleUpdateQuestion(question.id, { label: e.target.value })}
                                            placeholder="Type your question here..."
                                            className="bg-transparent border-0 border-b rounded-none px-0 h-8 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50"
                                            autoFocus={!question.label}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleUpdateQuestion(question.id, { required: !question.required })}
                                            className={cn(
                                                "px-3 py-1 rounded text-xs font-medium border transition-colors",
                                                question.required
                                                    ? "bg-white text-foreground border-border shadow-sm"
                                                    : "bg-transparent text-muted-foreground/50 border-transparent hover:bg-muted"
                                            )}
                                        >
                                            Required?
                                        </button>
                                        <button
                                            onClick={() => handleUpdateQuestion(question.id, { required: !question.required })}
                                            className="focus:outline-none"
                                            title="Toggle Required"
                                        >
                                            <CheckCircle2 className={cn(
                                                "w-6 h-6 transition-colors",
                                                question.required ? "text-green-600 fill-green-100" : "text-muted-foreground/30"
                                            )} />
                                        </button>
                                        <div className="w-[1px] h-6 bg-border mx-1"></div>
                                        <button
                                            onClick={() => handleDeleteQuestion(question.id)}
                                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                            title="Delete Question"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        }
                    })}

                    {/* Add Additional Questions Button */}
                    <Button
                        variant="outline"
                        onClick={handleAddQuestion}
                        className="w-full mt-2 h-12 bg-white border hover:bg-muted/20 gap-2 text-muted-foreground font-normal justify-start px-4"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Add Additional Questions
                    </Button>
                </div>
            </div>
        </div>
    );
}
