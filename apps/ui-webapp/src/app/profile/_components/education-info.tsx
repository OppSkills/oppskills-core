"use client";

import React, { useState, useEffect, useRef } from "react";
import { Pencil, ChevronDown, Loader2, Check, Search } from "lucide-react";
import { ProfileInput } from "./profile-input";
import { useAuth } from "@clerk/nextjs";
import { updateEducation } from "@/lib/api/usersApi";
import { searchColleges } from "@/lib/api/collegesApi";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EducationData {
  collegeId: string | null;
  collegeName: string | null;
  course: string | null;
  courseSpecialization: string | null;
  startYear: string | null;
  endYear: number | null;
  rollNumber: string | null;
  cgpa: string | null;
}

export function EducationInfo({ data }: { data: EducationData }) {
  const { getToken } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [collegeResults, setCollegeResults] = useState<
    { id: string; name: string }[]
  >([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    collegeId: data?.collegeId || "",
    collegeName: data?.collegeName || "",
    course: data?.course || "",
    courseSpecialization: data?.courseSpecialization || "",
    startYear: data?.startYear || "",
    endYear: data?.endYear || "",
    rollNumber: data?.rollNumber || "",
    cgpa: data?.cgpa || "",
  });

  const debouncedSearchTerm = useDebounce(formData.collegeName, 500);

  useEffect(() => {
    if (
      debouncedSearchTerm &&
      debouncedSearchTerm.length >= 2 &&
      isEditing &&
      !formData.collegeId
    ) {
      const search = async () => {
        setIsSearching(true);
        try {
          const token = await getToken();
          if (!token) return;
          const results = await searchColleges(token, debouncedSearchTerm);
          setCollegeResults(results.map((r) => ({ id: r.id, name: r.name })));
          setShowResults(true);
        } catch (error) {
          console.error("Error searching colleges", error);
        } finally {
          setIsSearching(false);
        }
      };
      search();
    } else {
      setShowResults(false);
    }
  }, [debouncedSearchTerm, isEditing, formData.collegeId, getToken]);

  const COURSE_OPTIONS = [
    "BTech",
    "MTech",
    "BCA",
    "MCA",
    "BSc",
    "MSc",
    "BBA",
    "MBA",
    "PhD",
  ];
  const SPECIALIZATION_OPTIONS = [
    "Computer Science Engg.",
    "Information Technology",
    "Electronics & Communication Engg.",
    "Mechanical Engg.",
    "Civil Engg.",
    "Electrical Engg.",
    "Chemical Engg.",
    "Aerospace Engg.",
    "Biotechnology",
    "Artificial Intelligence",
    "Data Science",
  ];

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 25 }, (_, i) =>
    (currentYear - 10 + i).toString(),
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCollegeChange = (query: string) => {
    setFormData({ ...formData, collegeName: query, collegeId: "" });
    if (query.length < 2) {
      setCollegeResults([]);
      setShowResults(false);
    }
  };

  const handleSave = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      await updateEducation(token, {
        collegeId: formData.collegeId || undefined,
        collegeName: formData.collegeName || undefined,
        course: formData.course || undefined,
        courseSpecialization: formData.courseSpecialization || undefined,
        startYear: formData.startYear || undefined,
        endYear: formData.endYear ? Number(formData.endYear) : undefined,
        rollNumber: formData.rollNumber || undefined,
        cgpa: formData.cgpa || undefined,
      });
      toast.success("Education details updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update education", error);
      toast.error("Failed to update education");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 lg:p-8 rounded-[32px] border border-neutral-200 shadow-sm relative w-full mt-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-semibold text-[#4A4A5A]">
          Education Info
        </h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
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
            {isEditing ? "Save" : "Edit"}
          </span>
        </button>
      </div>

      <div className="space-y-6">
        {/* College / University Name */}
        <div className="relative" ref={searchRef}>
          <ProfileInput
            label="College/ University Name"
            value={formData.collegeName}
            onChange={(e) => handleCollegeChange(e.target.value)}
            disabled={!isEditing}
            placeholder="Search your college..."
            icon={
              isEditing && isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
              ) : (
                <Search className="w-5 h-5 text-neutral-400" />
              )
            }
          />
          {showResults && collegeResults.length > 0 && isEditing && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
              {collegeResults.map((college) => (
                <button
                  key={college.id}
                  className="w-full text-left px-6 py-3 hover:bg-neutral-50 transition-colors text-neutral-700"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      collegeName: college.name,
                      collegeId: college.id,
                    });
                    setShowResults(false);
                  }}
                >
                  {college.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Course & Specialization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">
              Course
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger disabled={!isEditing} className="w-full">
                <ProfileInput
                  value={formData.course || "Select Course"}
                  isSelect
                  icon={
                    isEditing ? (
                      <ChevronDown className="w-5 h-5 text-neutral-600" />
                    ) : undefined
                  }
                  disabled={!isEditing}
                  className="space-y-0"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) max-h-60 overflow-y-auto">
                {COURSE_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt}
                    onClick={() => setFormData({ ...formData, course: opt })}
                  >
                    {opt}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">
              Specialization
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger disabled={!isEditing} className="w-full">
                <ProfileInput
                  value={
                    formData.courseSpecialization || "Select Specialization"
                  }
                  isSelect
                  icon={
                    isEditing ? (
                      <ChevronDown className="w-5 h-5 text-neutral-600" />
                    ) : undefined
                  }
                  disabled={!isEditing}
                  className="space-y-0"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) max-h-60 overflow-y-auto">
                {SPECIALIZATION_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt}
                    onClick={() =>
                      setFormData({ ...formData, courseSpecialization: opt })
                    }
                  >
                    {opt}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Start Year & End Year */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">
              Start Year
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger disabled={!isEditing} className="w-full">
                <ProfileInput
                  value={formData.startYear || "Select Year"}
                  isSelect
                  icon={
                    isEditing ? (
                      <ChevronDown className="w-5 h-5 text-neutral-600" />
                    ) : undefined
                  }
                  disabled={!isEditing}
                  className="space-y-0"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) max-h-60 overflow-y-auto">
                {YEARS.map((year) => (
                  <DropdownMenuItem
                    key={year}
                    onClick={() =>
                      setFormData({ ...formData, startYear: year })
                    }
                  >
                    {year}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">
              End Year
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger disabled={!isEditing} className="w-full">
                <ProfileInput
                  value={formData.endYear?.toString() || "Select Year"}
                  isSelect
                  icon={
                    isEditing ? (
                      <ChevronDown className="w-5 h-5 text-neutral-600" />
                    ) : undefined
                  }
                  disabled={!isEditing}
                  className="space-y-0"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) max-h-60 overflow-y-auto">
                {YEARS.map((year) => (
                  <DropdownMenuItem
                    key={year}
                    onClick={() =>
                      setFormData({ ...formData, endYear: Number(year) })
                    }
                  >
                    {year}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Roll Number & CGPA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileInput
            label="Roll Number"
            type="number"
            value={formData.rollNumber}
            onChange={(e) =>
              setFormData({ ...formData, rollNumber: e.target.value })
            }
            disabled={!isEditing}
            placeholder="Enter numeric roll no"
          />
          <ProfileInput
            label="CGPA/Percentage"
            value={formData.cgpa}
            onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
            disabled={!isEditing}
            placeholder="e.g. 8.5 or 85%"
          />
        </div>
      </div>
    </div>
  );
}
