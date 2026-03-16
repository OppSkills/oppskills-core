"use client";

import React, { useState, useMemo } from "react";
import { Pencil, X, Check, Search, PlusCircle, Loader2 } from "lucide-react";
import { ProfileInput } from "./profile-input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TagSectionProps {
  title: string;
  initialTags: string[];
  trendingTags: string[];
  onSave: (tags: string[]) => Promise<void>;
  placeholder?: string;
}

export function TagSection({
  title,
  initialTags,
  trendingTags,
  onSave,
  placeholder = "Search..."
}: TagSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLocal, setSelectedLocal] = useState<string[]>(initialTags);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Suggested tags: filter from trendingTags
  const suggestions = useMemo(() => {
    const filtered = trendingTags.filter(tag => {
      const isMatch = tag.toLowerCase().includes(searchQuery.toLowerCase());
      const isAlreadySelected = selectedLocal.some(s => s.toLowerCase() === tag.toLowerCase());
      return isMatch && !isAlreadySelected;
    });
    return filtered.slice(0, 10);
  }, [searchQuery, selectedLocal, trendingTags]);

  const handleAddTag = (tag: string) => {
    if (selectedLocal.length >= 20) {
      toast.error(`You can select up to 20 ${title.toLowerCase()} at max.`);
      return;
    }
    if (!selectedLocal.some(s => s.toLowerCase() === tag.toLowerCase())) {
      setSelectedLocal(prev => [...prev, tag]);
    }
    setSearchQuery("");
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedLocal(prev => prev.filter(s => s !== tag));
  };

  const handleOtherSubmit = () => {
    const val = otherValue.trim();
    if (val.length === 0) return;

    if (selectedLocal.length >= 20) {
      toast.error(`You can select up to 20 ${title.toLowerCase()} at max.`);
      return;
    }
    
    if (val.length > 20) {
      setError("Max 20 characters");
      return;
    }
    
    if (!/^[a-zA-Z0-9\s\+\#\-\.\/]+$/.test(val)) {
      setError("Invalid characters");
      return;
    }

    handleAddTag(val);
    setOtherValue("");
    setShowOtherInput(false);
    setError(null);
  };

  return (
    <div className="bg-white p-6 lg:p-8 rounded-[32px] border border-neutral-200 shadow-sm relative w-full mt-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-semibold text-[#4A4A5A]">{title}</h2>
        <button
          disabled={isSaving}
          onClick={async () => {
            if (isEditing) {
              setIsSaving(true);
              try {
                await onSave(selectedLocal);
                toast.success(`${title} updated successfully!`);
                setIsEditing(false);
              } catch (err: any) {
                console.error(err);
                toast.error(err.message || `Failed to update ${title}`);
              } finally {
                setIsSaving(false);
              }
            } else {
              setIsEditing(true);
            }
            setSearchQuery("");
            setShowOtherInput(false);
            setOtherValue("");
            setError(null);
          }}
          className="flex items-center gap-2 px-6 py-2 rounded-full border border-purple-200 text-[#6B4EAB] hover:bg-purple-50 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isEditing ? (
            <Check className="w-4 h-4" />
          ) : (
            <Pencil className="w-4 h-4" />
          )}
          <span className="font-medium text-sm">
            {isSaving ? "Saving..." : isEditing ? "Save" : "Edit"}
          </span>
        </button>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm text-[#8B6ED8] font-medium">Selected</p>
          <div className="flex flex-wrap gap-3">
            {selectedLocal.length > 0 ? selectedLocal.map((item, index) => (
              <div
                key={`selected-${index}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#6B4EAB] text-white rounded-[20px] text-[15px] font-medium animate-in fade-in zoom-in duration-200"
              >
                {item}
                {isEditing && (
                  <button 
                    onClick={() => handleRemoveTag(item)}
                    className="flex items-center justify-center border border-white rounded-full w-4 h-4 hover:bg-white/20 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )) : <span className="text-neutral-400 text-sm">None selected.</span>}
          </div>
        </div>

        {isEditing && (
          <div className="space-y-6 pt-4 border-t border-neutral-100">
            <div className="relative">
              <ProfileInput
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                containerClassName="bg-[#F9F8FD] border-neutral-200 focus-within:border-[#BCA5FF]"
                icon={<Search className="w-5 h-5 text-neutral-400" />}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm text-[#8B6ED8] font-medium">Suggestions</p>
                {!showOtherInput && (
                  <button 
                    onClick={() => setShowOtherInput(true)}
                    className="text-sm text-[#6B4EAB] hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Other
                  </button>
                )}
              </div>

              {showOtherInput && (
                <div className="flex gap-2 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex-1">
                    <ProfileInput
                      placeholder={`Enter custom ${title.toLowerCase()}`}
                      value={otherValue}
                      onChange={(e) => {
                        setOtherValue(e.target.value);
                        if (error) setError(null);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleOtherSubmit()}
                      containerClassName={cn(
                        "bg-white h-12 py-0",
                        error ? "border-red-500" : "border-neutral-300"
                      )}
                      autoFocus
                    />
                    {error && <p className="text-red-500 text-xs mt-1 ml-4">{error}</p>}
                  </div>
                  <button 
                    onClick={handleOtherSubmit}
                    className="px-6 h-12 bg-[#6B4EAB] text-white rounded-[28px] font-medium hover:bg-[#5A3F91] transition-colors"
                  >
                    Add
                  </button>
                  <button 
                    onClick={() => {
                      setShowOtherInput(false);
                      setOtherValue("");
                      setError(null);
                    }}
                    className="p-3 h-12 flex items-center justify-center border border-neutral-200 rounded-full text-neutral-400 hover:bg-neutral-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-2">
                {suggestions.map((tag, index) => (
                  <button
                    key={`suggested-${index}`}
                    onClick={() => handleAddTag(tag)}
                    className="flex items-center px-5 py-2.5 bg-[#F9F8FD] text-neutral-700 rounded-[20px] text-[15px] border border-dashed border-[#BCA5FF] hover:bg-[#F0ECF9] hover:border-solid transition-all animate-in fade-in zoom-in duration-200"
                  >
                    {tag}
                  </button>
                ))}
                {suggestions.length === 0 && searchQuery && !showOtherInput && (
                  <p className="text-neutral-400 text-sm italic">No matches found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
