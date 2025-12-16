"use client";

import { Button } from "@/components/ui/button";
import { Plus, Trophy, Edit2, Trash2, AlertTriangle } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { FormData } from "../page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PrizesProps {
    formData: FormData;
    setFormData: (data: React.SetStateAction<FormData>) => void;
}

export default function Prizes({ formData, setFormData }: PrizesProps) {
    // Local state for the UI demo using placeholders mostly
    const [description, setDescription] = useState("");
    const [certificateProvided, setCertificateProvided] = useState<boolean | null>(null);
    const [prizes, setPrizes] = useState([
        { id: "1", name: "1st Prize", amount: "₹ 50,000", description: "Cash Prize + Swags" }
    ]);

    return (
        <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div>
                <h2 className="text-2xl font-bold">Prizes</h2>
            </div>

            {/* Main Details Card */}
            <div className="w-full border rounded-2xl p-6 bg-card shadow-sm">
                <h3 className="text-lg font-bold">What Do Participants Receive ?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                    Mention awards and prizes, perks and other important details for this opportunity.
                </p>

                <div className="flex flex-col gap-2 mb-6">
                    <Label className="text-muted-foreground font-normal">One liner description about prizes</Label>
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Place Holder Text"
                        className="bg-background"
                        maxLength={100}
                    />
                    <div className="flex items-center gap-1 text-destructive text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Cannot exceed 100 characters</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <Label className="text-muted-foreground font-normal">Participation Certificate will be provided ?</Label>
                    <div className="flex gap-4 mt-1">
                        <button
                            onClick={() => setCertificateProvided(true)}
                            className={cn(
                                "px-8 py-2 rounded-full border text-sm transition-all",
                                certificateProvided === true
                                    ? "bg-secondary text-secondary-foreground border-secondary font-semibold"
                                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                            )}
                        >
                            Yes
                        </button>
                        <button
                            onClick={() => setCertificateProvided(false)}
                            className={cn(
                                "px-8 py-2 rounded-full border text-sm transition-all",
                                certificateProvided === false
                                    ? "bg-secondary text-secondary-foreground border-secondary font-semibold"
                                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                            )}
                        >
                            No
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Prizes Card */}
            <div className="w-full border rounded-2xl p-6 bg-card shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-bold">Add Prizes</h3>
                        <p className="text-muted-foreground text-sm">
                            Create prizes and seamlessly send participation or winning certificates via Unstop after your opportunity ends.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full h-10 w-10 border-dashed border-2 hover:bg-secondary/20"
                    >
                        <Plus className="w-5 h-5" />
                    </Button>
                </div>

                {prizes.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {prizes.map((prize) => (
                            <div
                                key={prize.id}
                                className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-secondary/30"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                        <Trophy className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-base">{prize.name}</h4>
                                        <p className="text-sm text-muted-foreground">{prize.amount} • {prize.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 gap-1 h-8">
                                        <Edit2 className="w-3 h-3" />
                                        <span className="text-xs">Edit</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-primary hover:text-destructive hover:bg-destructive/10 gap-1 h-8">
                                        <Trash2 className="w-3 h-3" />
                                        <span className="text-xs">Delete</span>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
