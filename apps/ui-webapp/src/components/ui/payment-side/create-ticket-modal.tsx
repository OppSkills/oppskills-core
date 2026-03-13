"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface TicketData {
  title: string;
  amount: string;
  limit: string;
  feeType: string;
  requirement: string;
}

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (ticket: TicketData) => void;
}

export default function CreateTicketModal({
  isOpen,
  onClose,
  onCreate,
}: CreateTicketModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [limit, setLimit] = useState("");
  const [feeType, setFeeType] = useState("Team fee");
  const [requirement, setRequirement] = useState("Required");

  const handleCreate = () => {
    if (!title || !amount) {
      // Basic validation
      return;
    }
    onCreate({
      title,
      amount,
      limit,
      feeType,
      requirement,
    });
    // Reset form
    setTitle("");
    setAmount("");
    setLimit("");
    setFeeType("Team fee");
    setRequirement("Required");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[600px] p-0 gap-0 rounded-[16px] overflow-hidden bg-background border-none shadow-xl focus:outline-none [&>button]:hidden">
        <DialogTitle className="sr-only">Create A Ticket</DialogTitle>
        {/* --- HEADER --- */}
        <div className="flex px-6 py-5 justify-between items-center bg-muted">
          <h5 className="font-poppins text-foreground text-2xl font-semibold leading-[125%] capitalize">
            Create A Ticket
          </h5>
          <button
            onClick={onClose}
            className="flex w-8 h-8 justify-center items-center flex-shrink-0 cursor-pointer hover:bg-background/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-muted-foreground" strokeWidth={2} />
          </button>
        </div>

        {/* --- BODY --- */}
        <div className="flex flex-col p-6 gap-4 bg-background">
          {/* Ticket Title */}
          <div className="flex flex-col items-start gap-1 self-stretch">
            <Label className="font-inter text-muted-foreground text-xs font-normal leading-[150%]">
              Ticket Title *
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter Title"
              className="flex h-[48px] px-4 items-center self-stretch rounded-[24px] border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary"
            />
          </div>

          {/* Ticket Fee */}
          <div className="flex flex-col items-start gap-1 self-stretch">
            <Label className="font-inter text-muted-foreground text-xs font-normal leading-[150%]">
              Ticket Fee/ Amount *
            </Label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="in INR"
              className="flex h-[48px] px-4 items-center self-stretch rounded-[24px] border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary"
            />
          </div>

          {/* Ticket Limit */}
          <div className="flex flex-col items-start gap-1 self-stretch">
            <div className="flex justify-between items-end w-full">
              <Label className="font-inter text-muted-foreground text-xs font-normal leading-[150%]">
                Ticket Limit
              </Label>
            </div>

            <Input
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="Enter no. of tickets"
              className="flex h-[48px] px-4 items-center self-stretch rounded-[24px] border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary"
            />
            <span className="font-inter text-muted-foreground text-xs font-normal leading-[150%]">
              Leave empty for no limit
            </span>
          </div>

          {/* Fee Type Dropdown */}
          <div className="flex justify-between items-center self-stretch pt-2">
            <span className="font-inter text-muted-foreground text-base font-normal leading-[150%]">
              Fee Type
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-[140px] px-4 py-2 justify-center items-center gap-3 rounded-[37px] border border-primary/20 bg-transparent outline-none hover:bg-muted/50">
                  <span className="font-inter text-primary-500 text-xs font-medium leading-[150%]">
                    {feeType}
                  </span>
                  <ChevronDown className="w-4 h-4 text-primary" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                <DropdownMenuItem onClick={() => setFeeType("Team fee")}>
                  Team fee
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFeeType("Individual fee")}>
                  Individual fee
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Ticket Purchase Requirement Dropdown */}
          <div className="flex justify-between items-center self-stretch">
            <span className="font-inter text-muted-foreground text-base font-normal leading-[150%]">
              Ticket Purchase Requirement
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-[140px] px-4 py-2 justify-center items-center gap-3 rounded-[37px] border border-primary/20 bg-transparent outline-none hover:bg-muted/50">
                  <span className="font-inter text-primary-500 text-xs font-medium leading-[150%] whitespace-nowrap">
                    {requirement}
                  </span>
                  <ChevronDown className="w-4 h-4 text-primary" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                <DropdownMenuItem onClick={() => setRequirement("Required")}>
                  Required
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setRequirement("Not compulsory")}
                >
                  Not compulsory
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* --- FOOTER --- */}
        <div className="flex px-5 py-4 justify-end items-center bg-muted">
          <Button
            className="flex px-5 py-2.5 justify-center items-center gap-3 rounded-[37px] bg-primary-500 hover:bg-primary/90 text-primary-foreground font-inter text-base font-medium leading-[150%]"
            onClick={handleCreate}
          >
            Create ticket
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
