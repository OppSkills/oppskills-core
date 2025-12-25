"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/ui/editor/RichtextEditor"),
  { ssr: false }
);

interface DescriptionEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: string;
  onSave: (value: string) => void;
  title?: string;
}

export default function DescriptionEditorModal({
  open,
  onOpenChange,
  initialValue,
  onSave,
  title = "Description",
}: DescriptionEditorModalProps) {
  const [value, setValue] = useState(initialValue || "");

  // Sync with initialValue when opening
  useEffect(() => {
    if (open) {
      setValue(initialValue || "");
    }
  }, [open, initialValue]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Trying to close
      if (value !== (initialValue || "")) {
        if (
          confirm("You have unsaved changes. Are you sure you want to close?")
        ) {
          onOpenChange(false);
        }
      } else {
        onOpenChange(false);
      }
    } else {
      onOpenChange(true);
    }
  };

  const handleSave = () => {
    onSave(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none flex flex-col bg-background p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden relative bg-gray-50/50 p-4">
          <div className="h-full bg-background rounded-lg shadow-sm border flex flex-col overflow-hidden">
            <RichTextEditor
              value={value}
              onChange={setValue}
              className="h-full max-h-none border-0 rounded-none"
            />
          </div>
        </div>
        <DialogFooter className="p-4 border-t bg-background">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
