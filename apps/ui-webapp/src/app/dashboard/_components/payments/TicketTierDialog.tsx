import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import {
  useCreateHackathonTicketTier,
  useUpdateHackathonTicketTier,
  useCreateEventTicketTier,
  useUpdateEventTicketTier,
} from "@/hooks/usePayments";

interface TicketTierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityType: "Event" | "Hackathon";
  slug: string;
  editingTier?: {
    id: string;
    name?: string;
    description?: string | null;
    price?: string | number;
    capacity?: number | null;
    isActive?: boolean;
  };
}

export default function TicketTierDialog({
  isOpen,
  onClose,
  opportunityType,
  slug,
  editingTier,
}: TicketTierDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isActive, setIsActive] = useState(true);

  const isEvent = opportunityType === "Event";

  const createEventTier = useCreateEventTicketTier(slug);
  const updateEventTier = useUpdateEventTicketTier(slug);
  const createHackTier = useCreateHackathonTicketTier(slug);
  const updateHackTier = useUpdateHackathonTicketTier(slug);

  const isSubmitting =
    createEventTier.isPending ||
    updateEventTier.isPending ||
    createHackTier.isPending ||
    updateHackTier.isPending;

  useEffect(() => {
    if (!isOpen) return;
    if (editingTier) {
      setName(editingTier.name || "");
      setDescription(editingTier.description || "");
      setPrice(
        editingTier.price !== undefined && editingTier.price !== null
          ? String(editingTier.price)
          : "",
      );
      setCapacity(
        editingTier.capacity != null ? String(editingTier.capacity) : "",
      );
      setIsActive(editingTier.isActive ?? true);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setCapacity("");
      setIsActive(true);
    }
  }, [isOpen, editingTier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const priceNum = parseFloat(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      toast.error("Please enter a valid price (0 or more).");
      return;
    }

    const capRaw = capacity.trim();
    let capacityNum: number | undefined;
    if (capRaw !== "") {
      capacityNum = parseInt(capRaw, 10);
      if (Number.isNaN(capacityNum) || capacityNum < 1) {
        toast.error("Capacity must be a positive integer or left blank.");
        return;
      }
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: priceNum,
      capacity: capacityNum,
      isActive,
    };

    try {
      if (editingTier) {
        if (isEvent) {
          await updateEventTier.mutateAsync({
            tierId: editingTier.id,
            params: payload,
          });
        } else {
          await updateHackTier.mutateAsync({
            tierId: editingTier.id,
            params: payload,
          });
        }
      } else {
        if (isEvent) {
          await createEventTier.mutateAsync(payload);
        } else {
          await createHackTier.mutateAsync(payload);
        }
      }
      toast.success(editingTier ? "Ticket updated" : "Ticket created");
      onClose();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Could not save ticket. Try again."),
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[95vw] p-6 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold poppins text-neutral-900 border-b pb-4">
            {editingTier ? "Edit ticket type" : "New ticket type"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold poppins text-neutral-700">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. General admission, VIP"
              required
              className="inter"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold poppins text-neutral-700">
              Description{" "}
              <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is included?"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 inter min-h-[80px]"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-semibold poppins text-neutral-700">
                Price (INR) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">
                  ₹
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  required
                  className="pl-8 inter font-medium"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-semibold poppins text-neutral-700">
                Capacity{" "}
                <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <Input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Unlimited"
                className="inter"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="isActiveOption"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
            />
            <label
              htmlFor="isActiveOption"
              className="text-sm poppins font-medium text-neutral-700"
            >
              Active (shown to participants)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="poppins font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-600 hover:bg-primary-700 text-white poppins font-bold min-w-[120px]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingTier ? (
                "Save"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
