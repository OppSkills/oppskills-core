"use client";

import { Button } from "@/components/ui/button";
import { Plus, Trophy, Edit2, Trash2, AlertTriangle } from "lucide-react";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { FormData, Prize } from "../page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface PrizesProps {
  formData: FormData;
  setFormData: (data: React.SetStateAction<FormData>) => void;
}

export default function Prizes({ formData, setFormData }: PrizesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);

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
    const newPrize: Prize = {
      id: crypto.randomUUID(),
      name: "",
      amount: "₹ 0",
      description: "",
    };
    setEditingPrize(newPrize);
    setIsModalOpen(true);
  };

  const handleDeletePrize = (id: string) => {
    updatePrizes({ list: formData.prizes.list.filter((p) => p.id !== id) });
  };

  const handleClearAllPrizes = () => {
    if (formData.prizes.list.length === 0) return;
    updatePrizes({ list: [] });
  };

  const handleEditPrize = (id: string) => {
    const prize = formData.prizes.list.find((p) => p.id === id);
    if (prize) {
      setEditingPrize({ ...prize });
      setIsModalOpen(true);
    }
  };

  const handleSavePrize = () => {
    if (!editingPrize) return;

    const exists = formData.prizes.list.some((p) => p.id === editingPrize.id);
    if (exists) {
      updatePrizes({
        list: formData.prizes.list.map((p) =>
          p.id === editingPrize.id ? editingPrize : p
        ),
      });
    } else {
      updatePrizes({
        list: [...formData.prizes.list, editingPrize],
      });
    }
    setIsModalOpen(false);
    setEditingPrize(null);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div>
        <h2 className="text-2xl font-bold">Prizes</h2>
      </div>

      {/* Main Details Card */}
      <div className="w-full border rounded-2xl p-6 bg-card shadow-sm">
        <h3 className="text-lg font-bold">What Do Participants Receive ?</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Mention awards and prizes, perks and other important details for this
          opportunity.
        </p>

        <div className="flex flex-col gap-2 mb-6">
          <Label className="text-muted-foreground font-normal">
            One liner description about prizes
          </Label>
          <Input
            value={formData.prizes.description}
            onChange={(e) => updatePrizes({ description: e.target.value })}
            placeholder="Place Holder Text"
            className="bg-background"
            maxLength={100}
          />
          <div className="flex items-center gap-1 text-destructive-foreground text-xs">
            <AlertTriangle className="w-3 h-3" />
            <span>Cannot exceed 100 characters</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground font-normal">
            Participation Certificate will be provided ?
          </Label>
          <div className="flex gap-4 mt-1">
            <button
              onClick={() => updatePrizes({ certificateProvided: true })}
              className={cn(
                "px-8 py-2 rounded-full border text-sm transition-all",
                formData.prizes.certificateProvided === true
                  ? "bg-secondary text-secondary-foreground border-secondary font-semibold"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              )}
            >
              Yes
            </button>
            <button
              onClick={() => updatePrizes({ certificateProvided: false })}
              className={cn(
                "px-8 py-2 rounded-full border text-sm transition-all",
                formData.prizes.certificateProvided === false
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
              Create prizes and seamlessly send participation or winning
              certificates via Unstop after your opportunity ends.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {formData.prizes.list.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearAllPrizes}
                className="rounded-full"
              >
                Clear all
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddPrize}
              className="rounded-full h-10 w-10 border-dashed border-2 hover:bg-secondary/20"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {formData.prizes.list.length > 0 && (
          <div className="flex flex-col gap-3">
            {formData.prizes.list.map((prize) => (
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
                    <p className="text-sm text-muted-foreground">
                      {prize.amount} • {prize.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditPrize(prize.id)}
                    className="text-primary-500 hover:text-primary-500 hover:bg-primary/10 gap-1 h-8"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span className="text-xs">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePrize(prize.id)}
                    className="text-primary-500 hover:text-destructive-foreground hover:bg-destructive/10 gap-1 h-8"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="text-xs">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {formData.prizes.list.some((p) => p.id === editingPrize?.id)
                ? "Edit Prize"
                : "Add Prize"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="prize-name">Prize Name</Label>
              <Input
                id="prize-name"
                value={editingPrize?.name ?? ""}
                onChange={(e) =>
                  setEditingPrize((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                placeholder="e.g. Winner, Runner Up"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prize-amount">Prize Amount</Label>
              <Input
                id="prize-amount"
                value={editingPrize?.amount ?? ""}
                onChange={(e) =>
                  setEditingPrize((prev) =>
                    prev ? { ...prev, amount: e.target.value } : null
                  )
                }
                placeholder="₹ 0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prize-description">Description</Label>
              <Textarea
                id="prize-description"
                value={editingPrize?.description ?? ""}
                onChange={(e) =>
                  setEditingPrize((prev) =>
                    prev ? { ...prev, description: e.target.value } : null
                  )
                }
                placeholder="Enter prize description"
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingPrize(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePrize}>Save Prize</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
