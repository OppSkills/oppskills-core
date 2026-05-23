"use client";

import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  Phone,
  Mail,
  User,
  Upload,
  X,
} from "lucide-react";
import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { FormData, Contact, Attachment } from "../page";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@clerk/nextjs";
import { presignDocumentUpload } from "@/lib/api/mediaApi";
import { uploadDocumentToS3PresignedPost } from "@/lib/uploads/uploadDocumentToS3";
import { toast } from "sonner";

interface AdditionalInfoProps {
  formData: FormData;
  setFormData: (data: React.SetStateAction<FormData>) => void;
}

/**
 * Validates email format using a regex pattern
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number (allows digits, spaces, +, -, and parentheses)
 */
const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s+\-()]+$/;
  return phone.length >= 10 && phoneRegex.test(phone);
};

/**
 * Formats file size in bytes to human-readable format
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

/**
 * Gets file type from file name or mime type
 */
const getFileType = (fileName: string, mimeType?: string): string => {
  if (mimeType) {
    if (mimeType.includes("pdf")) return "PDF File";
    if (mimeType.includes("word")) return "Word Document";
    if (mimeType.includes("image")) return "Image File";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
      return "Spreadsheet";
  }

  const extension = fileName.split(".").pop()?.toUpperCase();
  return extension ? `${extension} File` : "Document";
};

import { Container } from "@/app/dashboard/_components/Container";

export default function AdditionalInfo({
  formData,
  setFormData,
}: AdditionalInfoProps) {
  const { getToken } = useAuth();

  // Check if additionalInfo exists, if not, provide defaults safely
  const contacts = formData.additionalInfo?.contacts || [];
  const attachments = formData.additionalInfo?.attachments || [];

  // State for contact editing dialog
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactForm, setContactForm] = useState<Contact>({
    id: "",
    name: "",
    phone: "",
    email: "",
  });
  const [contactErrors, setContactErrors] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // State for attachment upload dialog
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);
  const [attachmentForm, setAttachmentForm] = useState({
    fileName: "",
    file: null as File | null,
  });
  const [attachmentErrors, setAttachmentErrors] = useState({
    fileName: "",
    file: "",
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateInfo = (updates: Partial<FormData["additionalInfo"]>) => {
    setFormData((prev) => ({
      ...prev,
      additionalInfo: {
        ...prev.additionalInfo,
        ...updates,
      },
    }));
  };

  // Contact handlers
  const handleAddContact = () => {
    setEditingContact(null);
    setContactForm({
      id: crypto.randomUUID(),
      name: "",
      phone: "",
      email: "",
    });
    setContactErrors({ name: "", email: "", phone: "" });
    setIsContactDialogOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setContactForm({ ...contact });
    setContactErrors({ name: "", email: "", phone: "" });
    setIsContactDialogOpen(true);
  };

  const validateContactForm = (): boolean => {
    const errors = { name: "", email: "", phone: "" };
    let isValid = true;

    // Validate name
    if (!contactForm.name.trim()) {
      errors.name = "Name is required";
      isValid = false;
    } else if (contactForm.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
      isValid = false;
    }

    // Validate email
    if (!contactForm.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!isValidEmail(contactForm.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Validate phone
    if (!contactForm.phone.trim()) {
      errors.phone = "Phone number is required";
      isValid = false;
    } else if (!isValidPhone(contactForm.phone)) {
      errors.phone = "Please enter a valid phone number (min 10 digits)";
      isValid = false;
    }

    setContactErrors(errors);
    return isValid;
  };

  const handleSaveContact = () => {
    if (!validateContactForm()) return;

    if (editingContact) {
      // Update existing contact
      updateInfo({
        contacts: contacts.map((c) =>
          c.id === editingContact.id ? contactForm : c,
        ),
      });
    } else {
      // Add new contact
      updateInfo({ contacts: [...contacts, contactForm] });
    }

    setIsContactDialogOpen(false);
  };

  const handleDeleteContact = (id: string) => {
    updateInfo({ contacts: contacts.filter((c) => c.id !== id) });
  };

  // Attachment handlers
  const handleAddAttachment = () => {
    setAttachmentForm({ fileName: "", file: null });
    setAttachmentErrors({ fileName: "", file: "" });
    setIsAttachmentDialogOpen(true);
  };

  const validateAttachmentForm = (): boolean => {
    const errors = { fileName: "", file: "" };
    let isValid = true;

    // Validate file name
    if (!attachmentForm.fileName.trim()) {
      errors.fileName = "File name is required";
      isValid = false;
    } else if (attachmentForm.fileName.trim().length < 3) {
      errors.fileName = "File name must be at least 3 characters";
      isValid = false;
    }

    // Validate file
    if (!attachmentForm.file) {
      errors.file = "Please select a file to upload";
      isValid = false;
    }

    setAttachmentErrors(errors);
    return isValid;
  };

  const handleFileSelect = (file: File) => {
    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setAttachmentErrors((prev) => ({
        ...prev,
        file: "File size must be less than 100MB",
      }));
      return;
    }

    setAttachmentForm((prev) => ({ ...prev, file }));
    setAttachmentErrors((prev) => ({ ...prev, file: "" }));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSaveAttachment = async () => {
    if (!validateAttachmentForm()) return;

    setIsUploading(true);

    try {
      // Get authentication token
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // Get presigned URL from backend
      const presign = await presignDocumentUpload(token, {
        purpose: "OPPORTUNITY_ATTACHMENT",
        mimeType: attachmentForm.file?.type || "application/octet-stream",
        fileName: attachmentForm.file?.name || "document",
      });

      // Upload file to S3
      if (attachmentForm.file) {
        await uploadDocumentToS3PresignedPost({
          presign,
          file: attachmentForm.file,
        });
      }

      // Store attachment metadata with public URL
      const newAttachment: Attachment = {
        id: crypto.randomUUID(),
        title: attachmentForm.fileName,
        type: getFileType(
          attachmentForm.file?.name || "",
          attachmentForm.file?.type,
        ),
        url: presign.publicUrl,
        size: attachmentForm.file?.size,
      };

      updateInfo({ attachments: [...attachments, newAttachment] });
      setIsAttachmentDialogOpen(false);

      // Show success message
      toast.success("Attachment uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        `Upload Failed: ${error instanceof Error ? error.message : "Failed to upload attachment"}`,
      );
    } finally {
      setIsUploading(false);
    }
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
      <Container
        heading="Contact Details"
        description="Add Contact details of key persons related to opportunity."
      >
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddContact}
            className="rounded-full border-primary-500 text-primary-600 hover:bg-primary-50 gap-2 font-bold px-6"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </Button>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between p-4 rounded-xl bg-primary-50/30 border border-primary-100 transition-all hover:border-primary-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg poppins shadow-sm">
                  {contact.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-base text-neutral-800 poppins">
                    {contact.name}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-neutral-600 inter">
                    <span>{contact.phone || "No Phone"}</span>
                    <span className="text-neutral-300">|</span>
                    <span>{contact.email || "No Email"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditContact(contact)}
                  className="text-primary-600 hover:text-primary-700 hover:bg-primary-100 gap-1 h-8 font-bold"
                >
                  <Edit2 className="w-3 h-3" />
                  <span className="text-xs">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteContact(contact.id)}
                  className="text-neutral-400 hover:text-destructive hover:bg-destructive/10 gap-1 h-8 font-bold"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="text-xs">Delete</span>
                </Button>
              </div>
            </div>
          ))}
          {contacts.length === 0 && (
            <div className="text-center text-neutral-400 text-sm italic py-8 inter">
              No contact details added yet.
            </div>
          )}
        </div>
      </Container>

      {/* Attachments Card */}
      <Container
        heading="Attachments"
        description="Upload documents relevant to the opportunity (Rules, Brochure, etc.)"
      >
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddAttachment}
            className="rounded-full border-primary-500 text-primary-600 hover:bg-primary-50 gap-2 font-bold px-6"
          >
            <Plus className="w-4 h-4" />
            <span>Add Attachment</span>
          </Button>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 rounded-xl bg-primary-50/30 border border-primary-100 transition-all hover:border-primary-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 shadow-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-neutral-800 poppins">
                    {file.title}
                  </h4>
                  <p className="text-sm text-neutral-600 inter">{file.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteAttachment(file.id)}
                  className="text-neutral-400 hover:text-destructive hover:bg-destructive/10 gap-1 h-8 font-bold"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="text-xs">Delete</span>
                </Button>
              </div>
            </div>
          ))}
          {attachments.length === 0 && (
            <div className="text-center text-neutral-400 text-sm italic py-8 inter">
              No attachments added yet.
            </div>
          )}
        </div>
      </Container>

      {/* Contact Edit/Add Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Edit Contact" : "Add New Contact"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-name"
                placeholder="Enter full name"
                value={contactForm.name}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, name: e.target.value }))
                }
                aria-invalid={!!contactErrors.name}
              />
              {contactErrors.name && (
                <p className="text-xs text-destructive">{contactErrors.name}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="example@email.com"
                value={contactForm.email}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, email: e.target.value }))
                }
                aria-invalid={!!contactErrors.email}
              />
              {contactErrors.email && (
                <p className="text-xs text-destructive">
                  {contactErrors.email}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={contactForm.phone}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                aria-invalid={!!contactErrors.phone}
              />
              {contactErrors.phone && (
                <p className="text-xs text-destructive">
                  {contactErrors.phone}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsContactDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveContact}>
              {editingContact ? "Save Changes" : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attachment Upload Dialog */}
      <Dialog
        open={isAttachmentDialogOpen}
        onOpenChange={setIsAttachmentDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Attachment</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="file-name">
                File Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="file-name"
                placeholder="e.g., Event Rules, Brochure, etc."
                value={attachmentForm.fileName}
                onChange={(e) =>
                  setAttachmentForm((prev) => ({
                    ...prev,
                    fileName: e.target.value,
                  }))
                }
                aria-invalid={!!attachmentErrors.fileName}
              />
              {attachmentErrors.fileName && (
                <p className="text-xs text-destructive">
                  {attachmentErrors.fileName}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>
                File <span className="text-destructive">*</span>
              </Label>

              {/* Drag and Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  isDragging
                    ? "border-primary-500 bg-primary/5"
                    : "border-border hover:border-primary-500 hover:bg-secondary/20",
                  attachmentErrors.file && "border-destructive",
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileInputChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                />

                {attachmentForm.file ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-sm">
                        {attachmentForm.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachmentForm.file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAttachmentForm((prev) => ({ ...prev, file: null }));
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-sm">
                        {isDragging ? "Drop file here" : "Click to upload"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        or drag and drop
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      PDF, DOC, XLS, PPT, or Image (Max 100MB)
                    </p>
                  </div>
                )}
              </div>
              {attachmentErrors.file && (
                <p className="text-xs text-destructive">
                  {attachmentErrors.file}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAttachmentDialogOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveAttachment} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
