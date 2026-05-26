"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Scissors,
  Copy,
  Superscript,
  Subscript,
  PlusCircle,
  Send,
  Sparkles,
} from "lucide-react";
import CustomModal from "./CustomModal";
import AdjustImagesModal from "./AdjustImagesModal";
import { Button } from "@/components/ui/button";
import { Post } from "./types";
import { toast } from "sonner";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postToEdit?: Post | null;
  onPublish: (content: string, images: string[]) => void;
}

// Preset gorgeous images for fallback / quick mock generation
const PRESET_MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=1200&auto=format&fit=crop&q=80",
];

export default function CreatePostModal({
  isOpen,
  onClose,
  postToEdit,
  onPublish,
}: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize values when editing
  useEffect(() => {
    if (isOpen) {
      if (postToEdit) {
        setContent(postToEdit.content || "");
        setImages(postToEdit.images || []);
      } else {
        setContent("");
        setImages([]);
      }
    }
  }, [isOpen, postToEdit]);

  if (!isOpen) return null;

  // Insert markdown formatting at cursor position in textarea
  const formatText = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const replacement = prefix + selectedText + suffix;

    setContent(
      text.substring(0, start) + replacement + text.substring(end)
    );

    // Refocus and place cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 50);
  };

  const handleToolbarAction = (action: string) => {
    switch (action) {
      case "bold":
        formatText("**", "**");
        break;
      case "italic":
        formatText("*", "*");
        break;
      case "underline":
        formatText("_", "_");
        break;
      case "strikethrough":
        formatText("~~", "~~");
        break;
      case "list":
        formatText("\n- ");
        break;
      case "list-ordered":
        formatText("\n1. ");
        break;
      case "subscript":
        formatText("<sub>", "</sub>");
        break;
      case "superscript":
        formatText("<sup>", "</sup>");
        break;
      case "cut":
        if (textareaRef.current) {
          const start = textareaRef.current.selectionStart;
          const end = textareaRef.current.selectionEnd;
          const selected = content.substring(start, end);
          if (selected) {
            navigator.clipboard.writeText(selected);
            setContent(content.substring(0, start) + content.substring(end));
            toast.success("Text cut to clipboard");
          }
        }
        break;
      case "copy":
        if (textareaRef.current) {
          const start = textareaRef.current.selectionStart;
          const end = textareaRef.current.selectionEnd;
          const selected = content.substring(start, end);
          if (selected) {
            navigator.clipboard.writeText(selected);
            toast.success("Text copied to clipboard");
          }
        }
        break;
      default:
        break;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );
    setImages((prev) => [...prev, ...newImages]);
    toast.success(`${files.length} image(s) attached successfully.`);
  };

  const handleAddMockImage = () => {
    const randomImg =
      PRESET_MOCK_IMAGES[Math.floor(Math.random() * PRESET_MOCK_IMAGES.length)];
    setImages((prev) => [...prev, randomImg]);
    toast.success("Preset mockup image attached.");
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePublishSubmit = () => {
    if (!content.trim()) {
      toast.error("Please enter some content for your post.");
      return;
    }
    onPublish(content, images);
    onClose();
  };

  const footer = (
    <Button
      onClick={handlePublishSubmit}
      className="bg-[#2E1E66] hover:bg-[#1E1146] text-white font-semibold px-6 py-2.5 rounded-full flex items-center gap-2 text-sm shadow-md active:scale-95 transition-all duration-200"
    >
      {postToEdit ? "Save Changes" : "Publish"}{" "}
      <Send className="w-4 h-4 rotate-45" />
    </Button>
  );

  return (
    <>
      <CustomModal
        isOpen={isOpen}
        onClose={onClose}
        title={postToEdit ? "Edit Post" : "Create Post"}
        footer={footer}
        className="max-w-2xl"
      >
        <div className="flex flex-col gap-5 select-none">
          {/* Rich text formatting toolbar (Mockup 2 layout) */}
          <div className="flex items-center gap-1 sm:gap-2 border border-neutral-200/80 rounded-2xl bg-neutral-50/50 p-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleToolbarAction("bold")}
              className="p-2 rounded-lg hover:bg-neutral-200/80 text-neutral-600 hover:text-neutral-900 transition-colors font-bold"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleToolbarAction("italic")}
              className="p-2 rounded-lg hover:bg-neutral-200/80 text-neutral-600 hover:text-neutral-900 transition-colors font-italic"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleToolbarAction("underline")}
              className="p-2 rounded-lg hover:bg-neutral-200/80 text-neutral-600 hover:text-neutral-900 transition-colors"
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleToolbarAction("strikethrough")}
              className="p-2 rounded-lg hover:bg-neutral-200/80 text-neutral-600 hover:text-neutral-900 transition-colors"
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>

            <div className="h-6 w-[1px] bg-neutral-300 mx-1 shrink-0" />

            <button
              onClick={() => handleToolbarAction("list")}
              className="p-2 rounded-lg hover:bg-neutral-200/80 text-neutral-600 hover:text-neutral-900 transition-colors"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleToolbarAction("list-ordered")}
              className="p-2 rounded-lg hover:bg-neutral-200/80 text-neutral-600 hover:text-neutral-900 transition-colors"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            <div className="h-6 w-[1px] bg-neutral-300 mx-1 shrink-0" />

            <button
              onClick={() => handleToolbarAction("cut")}
              className="p-2 rounded-lg hover:bg-neutral-200/80 text-neutral-600 hover:text-neutral-900 transition-colors"
              title="Cut Selection"
            >
              <Scissors className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleToolbarAction("copy")}
              className="p-2 rounded-lg hover:bg-neutral-200/80 text-neutral-600 hover:text-neutral-900 transition-colors"
              title="Copy Selection"
            >
              <Copy className="w-4 h-4" />
            </button>

            <div className="h-6 w-[1px] bg-neutral-300 mx-1 shrink-0" />

            <button
              onClick={() => handleToolbarAction("superscript")}
              className="p-2 rounded-lg hover:bg-neutral-200/80 text-neutral-600 hover:text-neutral-900 transition-colors"
              title="Superscript"
            >
              <Superscript className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleToolbarAction("subscript")}
              className="p-2 rounded-lg hover:bg-neutral-200/80 text-neutral-600 hover:text-neutral-900 transition-colors"
              title="Subscript"
            >
              <Subscript className="w-4 h-4" />
            </button>
          </div>

          {/* Main content textarea block */}
          <div className="border border-neutral-200 rounded-[28px] p-5 focus-within:border-[#5D3EBB]/60 transition-all bg-white relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Everything You Need To Know About SimulOps 2025..."
              className="w-full min-h-[160px] text-base leading-relaxed text-neutral-700 outline-none placeholder-neutral-400 font-semibold resize-none bg-transparent"
            />
          </div>

          {/* Attached image preview chips */}
          {images.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Attached Images ({images.length})
              </span>
              <div className="flex items-center gap-3.5 overflow-x-auto pb-1 scrollbar-none">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setIsAdjusting(true)}
                    className="relative w-24 h-16 rounded-xl overflow-hidden cursor-pointer border border-neutral-100 hover:scale-[1.03] active:scale-95 transition-all shrink-0"
                    title="Click to adjust images"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Attached graphic preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons Row: Add local upload + Preset library options */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            {/* File Input upload block */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 border border-neutral-200 hover:border-[#5D3EBB]/30 hover:bg-[#E6E0FA]/10 py-3 rounded-full flex items-center justify-center gap-2 text-sm font-extrabold text-[#5D3EBB] transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Add Images</span>
            </button>

            <button
              type="button"
              onClick={handleAddMockImage}
              className="flex-1 border border-dashed border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50 py-3 rounded-full flex items-center justify-center gap-2 text-sm font-extrabold text-neutral-500 transition-all cursor-pointer active:scale-98"
            >
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Add Preset Mock Image</span>
            </button>
          </div>
        </div>
      </CustomModal>

      {/* Embedded Adjust Images modal overlay */}
      {isAdjusting && (
        <AdjustImagesModal
          isOpen={isAdjusting}
          onClose={() => setIsAdjusting(false)}
          images={images}
          onRemoveImage={handleRemoveImage}
          onContinue={() => setIsAdjusting(false)}
        />
      )}
    </>
  );
}
