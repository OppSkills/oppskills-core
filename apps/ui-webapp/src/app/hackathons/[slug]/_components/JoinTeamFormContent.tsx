"use client";

import React from "react";
import { RegistrationInputField } from "./RegistrationInputField";
import { Users, Loader2, ArrowRight } from "lucide-react";
import { TeamDetailResponse } from "@/lib/api/teamApi";
import { cn } from "@/lib/utils";

import { JoinTeamFormContentProps } from "./RegistrationModal.types";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";

import { Link as SolarLink } from "@solar-icons/react";
import { toast } from "sonner";

export function JoinTeamFormContent({
  fields,
  answers,
  onUpdateAnswer,
  invitationCode,
  setInvitationCode,
  teams,
  isLoadingTeams,
  searchQuery,
  setSearchQuery,
  onJoinTeam,
  onFileSelect, // Note: I need to add this to the interface if I use it
  isUploading,
  uploadedFiles,
  slug,
}: JoinTeamFormContentProps & { onFileSelect?: any; isUploading?: boolean; uploadedFiles?: any }) {
  const matchingTeam = teams.find(
    (t) => t.invitationCode?.toUpperCase() === invitationCode?.toUpperCase()
  );

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyLink = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/hackathons/${slug}?registration=join&invitation=${code}`;
    navigator.clipboard.writeText(link);
    toast.success("Registration link copied!");
  };

  return (
    <div className="flex w-full flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {matchingTeam ? (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl border border-primary-600 bg-primary-100 p-6 shadow-md shadow-primary-200 animate-in fade-in zoom-in-95 duration-500">
            {/* Background design pattern */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-primary-600/10 blur-2xl" />
            <div className="absolute bottom-0 left-0 -ml-4 -mb-4 h-24 w-24 rounded-full bg-primary-600/5 blur-xl" />

            <div className="relative flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-200">
                  <Users className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600">
                    Joining Team
                  </p>
                  <h3 className="text-xl font-bold text-neutral-900 leading-tight">
                    {matchingTeam.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
                    <User className="h-3.5 w-3.5" />
                    <span>Led by <span className="text-neutral-700">{matchingTeam.leader?.firstName} {matchingTeam.leader?.lastName}</span></span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full text-primary-600 hover:text-primary-700 hover:bg-white/50 backdrop-blur-sm transition-all"
                  onClick={(e) => matchingTeam.invitationCode && handleCopyLink(e, matchingTeam.invitationCode)}
                  title="Copy registration link"
                >
                  <SolarLink size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-3 rounded-full text-xs font-semibold text-primary-700 hover:text-primary-800 hover:bg-white/50 backdrop-blur-sm transition-all"
                  onClick={() => {
                    setInvitationCode("");
                    setSearchQuery(matchingTeam.name);
                  }}
                >
                  Change
                </Button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-primary-200 pt-4">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {matchingTeam.members?.slice(0, 3).map((member, i) => (
                    <div
                      key={member.id}
                      className="h-8 w-8 rounded-full border-2 border-white bg-neutral-200 overflow-hidden ring-1 ring-neutral-200"
                    >
                      {member.user?.imageUrl ? (
                        <img src={member.user.imageUrl} alt="member" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary-600 text-[10px] font-bold text-white">
                          {member.user?.firstName?.[0] || "?"}
                        </div>
                      )}
                    </div>
                  ))}
                  {(matchingTeam.members?.length || 0) > 3 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-neutral-100 text-[10px] font-bold text-neutral-500 ring-1 ring-neutral-200">
                      +{(matchingTeam.members?.length || 0) - 3}
                    </div>
                  )}
                </div>
                <span className="text-sm font-semibold text-neutral-600">
                  {matchingTeam.members?.length || 0} / {matchingTeam.maxSize} Members
                </span>
              </div>
              <span className="inline-flex items-center rounded-full bg-primary-600 px-2.5 py-1 text-[10px] font-black text-white uppercase tracking-tighter shadow-sm">
                Ready to Join
              </span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <RegistrationInputField
              label="Search teams"
              placeholder="Enter team name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <div className="min-h-[120px] max-h-[240px] overflow-y-auto rounded-3xl border border-neutral-200 bg-white/50 p-2 space-y-2 scrollbar">
              {isLoadingTeams ? (
                <div className="flex h-24 items-center justify-center gap-2 text-neutral-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Fetching teams...</span>
                </div>
              ) : filteredTeams.length > 0 ? (
                filteredTeams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => team.invitationCode && onJoinTeam(team.invitationCode)}
                    className={cn(
                      "group flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-primary-200 hover:bg-primary-50/50 cursor-pointer transition-all",
                      invitationCode === team.invitationCode && "border-primary-600 bg-primary-100/50 shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-primary-600">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                          {team.name}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                          {team.members?.length || 0} / {team.maxSize} Members
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full text-neutral-400 hover:text-primary-600 hover:bg-white/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"
                        onClick={(e) => team.invitationCode && handleCopyLink(e, team.invitationCode)}
                        title="Copy registration link"
                      >
                        <SolarLink size={16} />
                      </Button>
                      <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-24 items-center justify-center text-sm text-neutral-400 italic">
                  No teams found matching your search
                </div>
              )}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute w-full h-px bg-neutral-200"></div>
            <span className="relative z-10 px-4 bg-neutral-100 text-[10px] font-bold text-neutral-400 tracking-widest">
              OR
            </span>
          </div>

          <div className="space-y-1">
            <RegistrationInputField
              label="Invitation Code"
              placeholder="ENTER-CODE-HERE"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
            />
            <p className="text-[10px] text-neutral-400 ml-4 font-medium italic">
              * Ask your team leader for the unique invitation code.
            </p>
          </div>
        </>
      )}

      <div className="relative flex items-center justify-center">
        <div className="absolute w-full h-px bg-neutral-200"></div>
        <span className="relative z-10 px-4 bg-neutral-100 text-[10px] font-bold text-neutral-400 tracking-widest uppercase">
          Your Details
        </span>
      </div>

      {fields.map((field) => {
        const lowerLabel = field.label.toLowerCase();
        const isUploadField = lowerLabel.includes("upload") || lowerLabel.includes("doc") || lowerLabel.includes("proof");
        const value = answers[field.id] || "";

        if (isUploadField) {
          const uploadedFile = uploadedFiles?.[field.id];
          return (
            <div key={field.id} className="space-y-2">
              <RegistrationInputField
                label={field.label}
                placeholder={uploadedFile ? uploadedFile.name : (field.placeholder || "Upload document")}
                value={uploadedFile ? uploadedFile.name : ""}
                readOnly
                onChange={() => { }}
                required={field.required}
                suffix={
                  <div className="flex items-center gap-2 pr-0.5 h-full">
                    <input
                      type="file"
                      id={`file-upload-join-${field.id}`}
                      className="hidden"
                      onChange={(e) => onFileSelect?.(field.id, e)}
                      disabled={isUploading}
                    />
                    <Button
                      type="button"
                      variant="default"
                      className="h-10 px-4 rounded-full transition-colors"
                      disabled={isUploading}
                      onClick={() => document.getElementById(`file-upload-join-${field.id}`)?.click()}
                    >
                      <Upload className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                }
              />
            </div>
          );
        }

        if (field.type === "OPTIONS") {
          return (
            <div key={field.id} className="space-y-2">
              <Label className="text-neutral-500 font-medium ml-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1 font-bold">*</span>}
              </Label>
              <Select
                value={value}
                onValueChange={(val) => onUpdateAnswer(field.id, val)}
                required={field.required}
              >
                <SelectTrigger className="h-14 rounded-full border-neutral-400 bg-neutral-100 px-6 w-full text-base focus:ring-1 focus:ring-primary-600 focus:border-primary-600">
                  <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-neutral-200">
                  {field.options?.map((opt) => (
                    <SelectItem key={opt} value={opt} className="rounded-xl px-4 py-2 cursor-pointer hover:bg-neutral-100 focus:bg-neutral-100">
                      {opt.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        return (
          <RegistrationInputField
            key={field.id}
            label={field.label}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            value={value}
            onChange={(e) => onUpdateAnswer(field.id, e.target.value)}
            required={field.required}
            type={field.type === "EMAIL" ? "email" : field.type === "PHONE_NO" ? "tel" : field.type === "NUMBER" ? "number" : "text"}
          />
        );
      })}
    </div>
  );
}
