"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Upload, ChevronDown, Check, Globe, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const topColleges = [
  { img: "iith.png", name: "IIT Hyderabad" },
  { img: "iitd.png", name: "IIIT Delhi" },
  { img: "sharda.png", name: "Sharda University" },
  { img: "iilm.png", name: "IILM University" },
  { img: "krrc.png", name: "KRRC" },
  { img: "rishihood.png", name: "Rishihood University" },
  { img: "gla.png", name: "GLA University" },
];

const industries = [
  "Technology & Software",
  "Education & Research",
  "Business & Consulting",
  "Design & Creative",
  "Engineering & Science",
  "Marketing & Media",
  "Finance & Fintech",
  "Health & Wellness",
  "Other",
];

export default function RegsitrationForm() {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  // Cover image upload
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Logo image upload
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Handle Cover change
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Cover image size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Logo change
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        toast.error("Profile picture size should be less than 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleListCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a community name");
      return;
    }
    if (!handle.trim()) {
      toast.error("Please enter a community handle");
      return;
    }
    if (!isVerified) {
      toast.error("Please verify that you are an authorized representative");
      return;
    }

    toast.success("Community registration request submitted successfully!");
  };

  const formattedHandle = handle
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 30);

  return (
    <form
      onSubmit={handleListCommunity}
      className="w-full max-w-5xl mx-auto overflow-hidden p-4 flex flex-col gap-8"
    >
      {/* Header and Logo Overlap Area */}
      <div className="relative w-full">
        {/* Cover Upload Box */}
        <div
          onClick={() => coverInputRef.current?.click()}
          className={cn(
            "relative w-full h-40 md:h-56 rounded-3xl bg-[#E6E0FA]/60 border-2 border-dashed border-[#BCA5F4]/40 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden hover:bg-[#E6E0FA]/80 group",
            coverPreview ? "border-none" : ""
          )}
        >
          <input
            type="file"
            ref={coverInputRef}
            onChange={handleCoverChange}
            accept="image/*"
            className="hidden"
          />
          {coverPreview ? (
            <>
              <Image
                src={coverPreview}
                alt="Community Cover"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 backdrop-blur-xs">
                <p className="text-white font-bold text-sm bg-black/40 px-4 py-2 rounded-full flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Change Cover
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#5D3EBB] shadow-xs group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg md:text-xl text-[#3A2482]">
                Upload Cover
              </span>
              <span className="text-xs text-neutral-500 font-medium mt-1">
                Cover Size 400*100 (Recommended)
              </span>
            </div>
          )}
        </div>

        {/* Profile Picture Overlap Box */}
        <div
          onClick={() => logoInputRef.current?.click()}
          className="absolute left-6 md:left-8 bottom-[-48px] w-24 h-24 md:w-32 md:h-32 bg-[#E6E0FA] rounded-2xl md:rounded-3xl border-4 border-white shadow-md flex items-center justify-center cursor-pointer overflow-hidden z-10 transition-transform hover:scale-105 group"
        >
          <input
            type="file"
            ref={logoInputRef}
            onChange={handleLogoChange}
            accept="image/*"
            className="hidden"
          />
          {logoPreview ? (
            <>
              <Image
                src={logoPreview}
                alt="Community Logo"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <Upload className="w-4 h-4 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-2">
              <Upload className="w-6 h-6 md:w-8 md:h-8 text-[#5D3EBB] group-hover:scale-110 transition-transform" />
            </div>
          )}
        </div>
      </div>

      {/* Spacer to account for logo overlap */}
      <div className="h-8 md:h-10 w-full" />

      {/* Community Identifiers */}
      <div className="flex flex-col gap-3">
        {/* Borderless Community Name Input */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Community Name"
          className="text-3xl md:text-4xl font-extrabold text-neutral-800 placeholder-neutral-300 outline-none w-full bg-transparent border-b border-transparent focus:border-neutral-200 pb-1 transition-colors"
        />

        {/* Custom Username & Handle Link Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 pt-1">
          <div className="flex items-center gap-1 bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-100 max-w-fit">
            <span className="text-neutral-400 font-semibold text-sm">@</span>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="enter-user-Name"
              className="bg-transparent outline-none text-neutral-700 text-sm font-semibold placeholder-neutral-400 w-36"
            />
          </div>

          <div className="flex items-center gap-1.5 text-indigo-600/80 font-medium italic text-sm">
            <Globe className="w-4 h-4 shrink-0" />
            <span className="break-all select-all">
              https://oppskills.com/c/
              <span className="font-bold underline decoration-dotted">
                {formattedHandle || "enter-user-Name"}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Left Column: Description */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-neutral-700 tracking-wider pl-1">
            Community Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell Us about the community"
            className="border-neutral-400 min-h-full resize-none rounded-3xl p-4"
          />
        </div>

        {/* Right Column: Website & Industry */}
        <div className="flex flex-col gap-5 justify-between">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-neutral-700 tracking-wider pl-1">
              Community Website
            </label>
            <Input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="Place Holder Text"
              className="border-neutral-400 rounded-full h-12 px-5 text-base shadow-2xs"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-neutral-700 tracking-wider pl-1">
              Community Industry
            </label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="border-neutral-400 rounded-full h-12 px-5 text-base text-neutral-700 shadow-2xs">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {industries.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {ind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Verification Checkbox */}
      <div
        onClick={() => setIsVerified(!isVerified)}
        className="flex items-start gap-3.5 cursor-pointer select-none group mt-2"
      >
        <div
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-300 mt-0.5 shrink-0",
            isVerified
              ? "bg-[#10B981] border-[#10B981] scale-105 shadow-sm shadow-[#10B981]/25"
              : "border-neutral-300 group-hover:border-neutral-400 bg-white"
          )}
        >
          {isVerified && <Check className="w-3.5 h-3.5 text-white stroke-3" />}
        </div>
        <p className="text-sm text-neutral-700 group-hover:text-neutral-800 transition-colors">
          I verify that I am an authorized representative of this community and
          have the right to act on its behalf in the creation of this page.
        </p>
      </div>

      {/* Submit Button Row */}
      <div className="flex justify-end w-full pt-2">
        <button
          type="submit"
          className="bg-[#2E1E66] hover:bg-[#1E1146] active:scale-95 text-white font-bold px-8 py-3 rounded-full text-base shadow-md hover:shadow-lg transition-all duration-300"
        >
          List Community
        </button>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-neutral-200/80 my-2" />

      {/* Trusted By Communities Section */}
      <div className="flex flex-col gap-6 w-full pt-1">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-800">
            Trusted By Communities From Top Colleges
          </h3>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 md:gap-6 bg-neutral-50/50 p-4 rounded-3xl border border-neutral-100">
          {topColleges.map((logo, index) => (
            <div
              key={index}
              className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center overflow-hidden rounded-full border p-3 md:p-4 bg-white hover:bg-neutral-50 transition-all duration-300 border-neutral-200/50 hover:border-primary/20 hover:scale-105 shadow-2xs hover:shadow-xs group/logo"
              title={logo.name}
            >
              <Image
                src={`/logos/${logo.img}`}
                alt={logo.name}
                width={60}
                height={60}
                className="object-contain w-full h-full filter saturate-75 hover:saturate-100 transition-all duration-300 group-hover/logo:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
