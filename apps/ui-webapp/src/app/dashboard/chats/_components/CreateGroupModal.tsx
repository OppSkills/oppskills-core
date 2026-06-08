"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import type { SearchUserHit } from "@/lib/chat/types";

interface CreateGroupModalProps {
  currentUserId: string | null;
  groupMemberSearch: string;
  groupSearchUsers: SearchUserHit[];
  newGroupName: string;
  selectedMembers: string[];
  onClose: () => void;
  onCreateGroup: (event: React.FormEvent) => void;
  onGroupMemberSearchChange: (value: string) => void;
  onNewGroupNameChange: (value: string) => void;
  onToggleMember: (id: string) => void;
}

const CreateGroupModal = React.memo(function CreateGroupModal({
  currentUserId,
  groupMemberSearch,
  groupSearchUsers,
  newGroupName,
  selectedMembers,
  onClose,
  onCreateGroup,
  onGroupMemberSearchChange,
  onNewGroupNameChange,
  onToggleMember,
}: CreateGroupModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-neutral-300"
      >
        <div className="flex justify-between items-center px-6 py-5 border-b border-neutral-200">
          <h3 className="text-base font-bold text-neutral-900 font-aeonicPro">
            Create New Group
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onCreateGroup}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                Group Name
              </label>
              <input
                type="text"
                required
                value={newGroupName}
                onChange={(e) => onNewGroupNameChange(e.target.value)}
                placeholder="e.g. E-Summit Design Team"
                className="w-full bg-neutral-100 border border-neutral-300 focus:border-primary-500 rounded-xl py-3 px-4 text-sm text-neutral-800 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                Search members
              </label>
              <input
                type="text"
                value={groupMemberSearch}
                onChange={(e) => onGroupMemberSearchChange(e.target.value)}
                placeholder="Name or email..."
                className="w-full mb-3 bg-neutral-100 border border-neutral-300 focus:border-primary-500 rounded-xl py-2.5 px-4 text-sm outline-none"
              />
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                Select Members
              </label>
              <div className="max-h-52 overflow-y-auto border border-neutral-200 rounded-xl divide-y divide-neutral-150 p-2 bg-neutral-50 scrollbar">
                {groupMemberSearch.trim().length === 0 ? (
                  <p className="text-xs text-center text-neutral-500 py-6 px-2">
                    Type a name or email to find members
                  </p>
                ) : groupSearchUsers.length === 0 ? (
                  <p className="text-xs text-center text-neutral-500 py-6 px-2">
                    No users found
                  </p>
                ) : (
                  groupSearchUsers
                    .filter((contact) => contact.id !== currentUserId)
                    .map((contact) => {
                      const isSelected = selectedMembers.includes(contact.id);
                      return (
                        <div
                          key={contact.id}
                          onClick={() => onToggleMember(contact.id)}
                          className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer hover:bg-primary-100/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={contact.avatar}
                              alt={contact.name}
                              className="w-9 h-9 rounded-full object-cover border border-neutral-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="text-sm font-semibold text-neutral-900 block truncate">
                                {contact.name}
                              </span>
                              <span className="text-[10px] text-neutral-500 block truncate">
                                {contact.email}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`
                              w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0
                              ${
                                isSelected
                                  ? "bg-primary-600 border-primary-600 text-white"
                                  : "border-neutral-400 bg-white"
                              }
                            `}
                          >
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 stroke-[3px]" />
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-neutral-50 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 text-xs font-bold text-neutral-700 hover:text-black transition-colors uppercase tracking-wider font-aeonicPro"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newGroupName.trim() || selectedMembers.length === 0}
              className={`
                py-2.5 px-5 text-xs font-bold text-white rounded-full transition-all uppercase tracking-wider font-aeonicPro shadow-md
                ${
                  newGroupName.trim() && selectedMembers.length > 0
                    ? "bg-primary-600 hover:bg-primary-700 cursor-pointer"
                    : "bg-neutral-300 cursor-not-allowed"
                }
              `}
            >
              Create Group
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
});

export default CreateGroupModal;
