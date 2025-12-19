"use client";

import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, FileText, Phone, Mail, User } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import { FormData, Contact, Attachment } from "../page";

interface AdditionalInfoProps {
  formData: FormData;
  setFormData: (data: React.SetStateAction<FormData>) => void;
}

export default function AdditionalInfo({
  formData,
  setFormData,
}: AdditionalInfoProps) {
  // Check if additionalInfo exists, if not, provide defaults safely
  const contacts = formData.additionalInfo?.contacts || [];
  const attachments = formData.additionalInfo?.attachments || [];

  const updateInfo = (updates: Partial<FormData["additionalInfo"]>) => {
    setFormData((prev) => ({
      ...prev,
      additionalInfo: {
        ...prev.additionalInfo,
        ...updates,
      },
    }));
  };

  const handleAddContact = () => {
    const newContact: Contact = {
      id: crypto.randomUUID(),
      name: "New Team Member",
      phone: "",
      email: "",
    };
    updateInfo({ contacts: [...contacts, newContact] });
  };

  const handleDeleteContact = (id: string) => {
    updateInfo({ contacts: contacts.filter((c) => c.id !== id) });
  };

  const handleAddAttachment = () => {
    const newAttachment: Attachment = {
      id: crypto.randomUUID(),
      title: "New Document",
      type: "PDF File",
    };
    updateInfo({ attachments: [...attachments, newAttachment] });
  };

  const handleDeleteAttachment = (id: string) => {
    updateInfo({ attachments: attachments.filter((a) => a.id !== id) });
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div>
        <h2 className="text-2xl font-bold">Additional Info</h2>
      </div>

      {/* Contact Details Card */}
      <div className="w-full border rounded-2xl p-6 bg-card shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold">Contact Details</h3>
            <p className="text-muted-foreground text-sm">
              Add Contact details of key persons related to event.
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleAddContact}
            className="rounded-full h-8 w-8 border-dashed border-2 hover:bg-secondary/20"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-secondary/30"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  {contact.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-base">{contact.name}</h4>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{contact.phone || "No Phone"}</span>
                    <span className="text-border">|</span>
                    <span>{contact.email || "No Email"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary hover:bg-primary/10 gap-1 h-8"
                >
                  <Edit2 className="w-3 h-3" />
                  <span className="text-xs">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteContact(contact.id)}
                  className="text-primary hover:text-destructive-foreground hover:bg-destructive/10 gap-1 h-8"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="text-xs">Delete</span>
                </Button>
              </div>
            </div>
          ))}
          {contacts.length === 0 && (
            <div className="text-center text-muted-foreground text-sm italic py-4">
              No contact details added yet.
            </div>
          )}
        </div>
      </div>

      {/* Attachments Card */}
      <div className="w-full border rounded-2xl p-6 bg-card shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold">Attachments</h3>
            <p className="text-muted-foreground text-sm">
              Upload documents relevant to the event (Rules, Brokerage, etc.)
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleAddAttachment}
            className="rounded-full h-8 w-8 border-dashed border-2 hover:bg-secondary/20"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-secondary/30"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-base">{file.title}</h4>
                  <p className="text-sm text-muted-foreground">{file.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary hover:bg-primary/10 gap-1 h-8"
                >
                  <Edit2 className="w-3 h-3" />
                  <span className="text-xs">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteAttachment(file.id)}
                  className="text-primary hover:text-destructive-foreground hover:bg-destructive/10 gap-1 h-8"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="text-xs">Delete</span>
                </Button>
              </div>
            </div>
          ))}
          {attachments.length === 0 && (
            <div className="text-center text-muted-foreground text-sm italic py-4">
              No attachments added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
