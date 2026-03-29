"use client";

import React from "react";
import { RegistrationInputField } from "./RegistrationInputField";
import { Users, Loader2, ArrowRight, User, Upload, Link as LinkIcon, LogOut, CheckCircle2, ShieldCheck, UserPlus, Search, Info } from "lucide-react";
import { TeamDetailResponse } from "@/lib/api/teamApi";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { JoinTeamFormContentProps } from "./RegistrationModal.types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  onFileSelect,
  isUploading,
  uploadedFiles,
  slug,
}: JoinTeamFormContentProps) {
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
    <div className="flex w-full flex-col gap-6">
      {matchingTeam ? (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="space-y-4"
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-primary-200 bg-gradient-to-br from-white to-primary-50/30 p-6 shadow-xl shadow-primary-900/5 ring-1 ring-white/50">
            {/* Background decorative elements */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary-100 opacity-50 blur-2xl" />
            <div className="absolute -left-4 -bottom-4 h-32 w-32 rounded-full bg-primary-50 opacity-30 blur-3xl" />

            <div className="relative flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-200 ring-4 ring-primary-50">
                    <Users className="h-7 w-7" />
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-[10px] font-bold text-primary-700 uppercase tracking-wider">
                        Active Team
                      </span>
                      <ShieldCheck className="h-3.5 w-3.5 text-primary-600" />
                    </div>
                    <h3 className="truncate text-2xl font-black text-neutral-900 tracking-tight leading-tight">
                      {matchingTeam.name}
                    </h3>
                  </div>
                </div>

                <div className="flex bg-neutral-100/80 backdrop-blur-sm p-1 rounded-full border border-white/50 shadow-sm shrink-0">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-full text-neutral-500 hover:text-primary-600 hover:bg-white transition-all duration-300"
                    onClick={(e) => matchingTeam.invitationCode && handleCopyLink(e, matchingTeam.invitationCode)}
                    title="Copy registration link"
                  >
                    <SolarLink size={18} />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-full text-neutral-500 hover:text-red-600 hover:bg-white transition-all duration-300"
                    onClick={() => {
                      setInvitationCode("");
                      setSearchQuery(matchingTeam.name);
                    }}
                    title="Change team"
                  >
                    <LogOut size={18} />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/60 border border-white shadow-sm">
                  <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden bg-primary-50 border border-primary-100 p-0.5">
                    {matchingTeam.leader?.imageUrl ? (
                      <img src={matchingTeam.leader.imageUrl} alt="leader" className="h-full w-full object-cover rounded-[10px]" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary-600 text-white font-bold rounded-[10px]">
                        {matchingTeam.leader?.firstName?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">Team Leader</p>
                    <p className="text-sm font-bold text-neutral-800 truncate">
                      {matchingTeam.leader?.firstName} {matchingTeam.leader?.lastName}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-center p-3 rounded-2xl bg-white/60 border border-white shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Members</p>
                    <span className="text-xs font-black text-primary-600">
                      {(matchingTeam.members?.length ?? 0) + 1} / {matchingTeam.maxSize}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-primary-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all duration-500"
                      style={{ width: `${((matchingTeam.members?.length || 1) / matchingTeam.maxSize) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex -space-x-3">
                  {matchingTeam.members?.slice(0, 5).map((member, i) => (
                    <motion.div
                      key={member.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="h-10 w-10 rounded-full border-2 border-white bg-white shadow-md ring-2 ring-primary-50 overflow-hidden"
                    >
                      {member.user?.imageUrl ? (
                        <img src={member.user.imageUrl} alt="member" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary-500 text-xs font-black text-white">
                          {member.user?.firstName?.[0] || "?"}
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {(matchingTeam.members?.length || 0) > 5 && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-primary-50 text-xs font-black text-primary-600 shadow-md ring-2 ring-primary-50">
                      +{(matchingTeam.members?.length || 0) - 5}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-white shadow-lg shadow-primary-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Ready to Join</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="space-y-3">
            <RegistrationInputField
              label="Search teams"
              placeholder="Enter team name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="min-h-[120px] max-h-[300px] overflow-y-auto rounded-[2rem] border border-neutral-200 bg-white shadow-inner p-3 space-y-3 scrollbar">
              {isLoadingTeams ? (
                <div className="flex h-32 flex-col items-center justify-center gap-3 text-neutral-400">
                  <div className="relative">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                    <div className="absolute inset-0 h-8 w-8 rounded-full border-4 border-primary-100 animate-pulse" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">Fetching Teams</span>
                </div>
              ) : filteredTeams.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  <AnimatePresence mode="popLayout">
                    {filteredTeams.map((team, index) => (
                      <motion.div
                        key={team.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => team.invitationCode && onJoinTeam(team.invitationCode)}
                        className={cn(
                          "group relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border bg-neutral-50/50 hover:bg-white hover:border-primary-300 hover:shadow-lg hover:shadow-primary-600/5 cursor-pointer transition-all duration-300",
                          invitationCode === team.invitationCode && "border-primary-600 bg-primary-50 shadow-md ring-1 ring-primary-600"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 shrink-0 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Users className="h-6 w-6" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-neutral-900 group-hover:text-primary-700 transition-colors truncate text-base">
                              {team.name}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                              <User className="h-3 w-3" />
                              <span className="truncate">Led by {team.leader?.firstName} {team.leader?.lastName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-neutral-100">
                          <div className="flex flex-col items-end sm:items-center">
                            <span className="text-[10px] font-black text-primary-600 uppercase tracking-tighter px-2 py-0.5 bg-primary-100 rounded-full">
                              {(team.members?.length ?? 0) + 1} / {team.maxSize}
                            </span>
                            <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5 sm:hidden">Members</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all sm:opacity-0 group-hover:opacity-100"
                              onClick={(e) => team.invitationCode && handleCopyLink(e, team.invitationCode)}
                              title="Copy registration link"
                            >
                              <SolarLink size={16} />
                            </Button>
                            <div className="h-8 w-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center sm:opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex h-32 flex-col items-center justify-center gap-3 text-neutral-400">
                  <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center">
                    <Search className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest italic text-center">
                    No teams found <br /> matching "{searchQuery}"
                  </p>
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
