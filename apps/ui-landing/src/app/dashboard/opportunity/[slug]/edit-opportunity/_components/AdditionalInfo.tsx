"use client";

import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, FileText, Phone, Mail, User } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { FormData } from "../page";

// Define local types for Additional Info items if they don't exist in FormData yet
// For now, I'll extend FormData in the parent, but here I'll just use what I expect
export interface ContactDetail {
    id: string;
    name: string;
    phone: string;
    email: string;
}

export interface Attachment {
    id: string;
    title: string;
    type: string; // "Zip File" | "PDF File" etc.
}

interface AdditionalInfoProps {
    formData: FormData; // We'll assume we add contacts/attachments to FormData
    setFormData: (data: React.SetStateAction<FormData>) => void;
}

export default function AdditionalInfo({ formData, setFormData }: AdditionalInfoProps) {
    // Mocking local management for now since FormData interface might not have these yet
    // Ideally these should be in FormData. I will update page.tsx to include them.

    // Handlers would update central state. For this step, I'll assume they exist or I'll add them to page tsx next.
    // Using direct mutation of a placeholder structure for the UI demo as per user request style

    const [contacts, setContacts] = useState<ContactDetail[]>([
        { id: "1", name: "Team Member Name", phone: "+91 99999 99999", email: "Emailoftheperson@gmail.com" }
    ]);
    const [attachments, setAttachments] = useState<Attachment[]>([
        { id: "1", title: "Sample PPT", type: "Zip File" },
        { id: "2", title: "Sample PDF", type: "PDF File" }
    ]);

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
                                        <span>{contact.phone}</span>
                                        <span className="text-border">|</span>
                                        <span>{contact.email}</span>
                                    </div>
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
            </div>

            {/* Attachments Card */}
            <div className="w-full border rounded-2xl p-6 bg-card shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-lg font-bold">Attachments</h3>
                        <p className="text-muted-foreground text-sm">
                            Add Contact details of key persons related to event.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
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
            </div>
        </div>
    );
}
