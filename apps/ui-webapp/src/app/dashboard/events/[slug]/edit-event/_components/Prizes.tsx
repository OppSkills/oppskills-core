"use client";

import { Button } from "@/components/ui/button";
import { Plus, Trophy, Edit2, Trash2, AlertTriangle } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { FormData, Prize } from "../page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container } from "@/app/dashboard/_components/Container";

interface PrizesProps {
  formData: FormData;
  setFormData: (data: React.SetStateAction<FormData>) => void;
}

export default function Prizes({ formData, setFormData }: PrizesProps) {
  const updatePrizes = (updates: Partial<FormData["prizes"]>) => {
    setFormData((prev) => ({
      ...prev,
      prizes: {
        ...prev.prizes,
        ...updates,
      },
    }));
  };

  const handleAddPrize = () => {
    // Ideally open a modal, but for now let's add a placeholder prize to edit
    const newPrize: Prize = {
      id: crypto.randomUUID(),
      name: "New Prize",
      amount: "0",
      description: "Description",
    };
    updatePrizes({ list: [...formData.prizes.list, newPrize] });
  };

  const handleDeletePrize = (id: string) => {
    updatePrizes({ list: formData.prizes.list.filter((p) => p.id !== id) });
  };

  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEditPrize = (id: string) => {
    setEditingId(id);
  };

  const handleUpdatePrize = (id: string, updates: Partial<Prize>) => {
    updatePrizes({
      list: formData.prizes.list.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    });
  };

  const handleSaveEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div>
        <h2 className="text-2xl font-bold">Prizes</h2>
      </div>

      {/* Main Details Card */}
      <Container
        heading="What Do Participants Receive ?"
        description="Mention awards and prizes, perks and other important details for this opportunity."
      >
        <div className="flex flex-col gap-2 mb-6 mt-2">
          <Label className="text-muted-foreground font-normal inter">
            One liner description about prizes
          </Label>
          <Input
            value={formData.prizes.description}
            onChange={(e) => updatePrizes({ description: e.target.value })}
            placeholder="Place Holder Text"
            className="bg-background"
            maxLength={100}
          />
          <div className="flex items-center gap-1 text-destructive-foreground text-xs inter">
            <AlertTriangle className="w-3 h-3" />
            <span>Cannot exceed 100 characters</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground font-normal inter">
            Participation Certificate will be provided ?
          </Label>
          <div className="flex gap-4 mt-1">
            <button
              onClick={() => updatePrizes({ certificateProvided: true })}
              className={cn(
                "px-8 py-2 rounded-full border text-sm transition-all inter font-semibold",
                formData.prizes.certificateProvided === true
                  ? "bg-primary-100 text-primary-600 border-primary-500 shadow-sm"
                  : "bg-background text-neutral-500 border-border hover:bg-muted",
              )}
            >
              Yes
            </button>
            <button
              onClick={() => updatePrizes({ certificateProvided: false })}
              className={cn(
                "px-8 py-2 rounded-full border text-sm transition-all inter font-semibold",
                formData.prizes.certificateProvided === false
                  ? "bg-primary-100 text-primary-600 border-primary-500 shadow-sm"
                  : "bg-background text-neutral-500 border-border hover:bg-muted",
              )}
            >
              No
            </button>
          </div>
        </div>
      </Container>

      {/* Add Prizes Card */}
      <Container
        heading="Add Prizes"
        description="Create prizes and seamlessly send participation or winning certificates via Unstop after your opportunity ends."
      >
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddPrize}
            className="rounded-full border-primary-500 text-primary-600 hover:bg-primary-50 gap-2 font-bold px-6"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Prize</span>
          </Button>
        </div>

        {formData.prizes.list.length > 0 && (
          <div className="flex flex-col gap-3">
            {formData.prizes.list.map((prize) => (
              <div
                key={prize.id}
                className={cn(
                  "flex flex-col p-4 rounded-xl transition-all border",
                  editingId === prize.id
                    ? "bg-white border-primary-500 shadow-md ring-1 ring-primary-500"
                    : "bg-primary-50/30 border-primary-100 hover:border-primary-300",
                )}
              >
                {editingId === prize.id ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-neutral-500 inter uppercase tracking-wider">
                          Prize Name
                        </Label>
                        <Input
                          value={prize.name}
                          onChange={(e) =>
                            handleUpdatePrize(prize.id, {
                              name: e.target.value,
                            })
                          }
                          className="rounded-lg h-9 inter"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-neutral-500 inter uppercase tracking-wider">
                          Amount (₹)
                        </Label>
                        <Input
                          value={prize.amount}
                          onChange={(e) =>
                            handleUpdatePrize(prize.id, {
                              amount: e.target.value,
                            })
                          }
                          className="rounded-lg h-9 inter"
                          placeholder="e.g., 5000"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-neutral-500 inter uppercase tracking-wider">
                        Description
                      </Label>
                      <Input
                        value={prize.description}
                        onChange={(e) =>
                          handleUpdatePrize(prize.id, {
                            description: e.target.value,
                          })
                        }
                        className="rounded-lg h-9 inter"
                        placeholder="e.g., Cash prize for winners"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveEdit()}
                        className="text-primary-600 font-bold hover:bg-primary-50"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-neutral-800 poppins">
                          {prize.name}
                        </h4>
                        <p className="text-sm text-neutral-600 inter">
                          ₹ {prize.amount} • {prize.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPrize(prize.id)}
                        className="text-primary-600 hover:text-primary-700 hover:bg-primary-100 gap-1 h-8 font-bold"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span className="text-xs">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePrize(prize.id)}
                        className="text-neutral-400 hover:text-destructive hover:bg-destructive/10 gap-1 h-8 font-bold"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="text-xs">Delete</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
