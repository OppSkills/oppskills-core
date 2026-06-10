"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Crown,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Pencil,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import { SecureChatAttachmentImage } from "@/features/chat/components/shared/SecureChatAttachmentImage";
import type { Chat } from "@/features/chat/domain/types";

type SidebarTab = "Members" | "Media" | "Docs";

import type { GalleryItem } from "./ImageGalleryModal";

interface SidebarDoc {
  messageId: string;
  name: string;
  size?: string;
}

interface MemberProfile {
  bio?: string;
  skills: string[];
  collegeName: string | null;
}

interface ChatDetailsSidebarProps {
  activeChat: Chat;
  activeTab: SidebarTab;
  currentUserId: string | null;
  galleryItems: GalleryItem[];
  groupAvatarInputRef: React.RefObject<HTMLInputElement | null>;
  groupPhotoUploading: boolean;
  groupSidebarTabs: readonly SidebarTab[];
  isGroupAdmin: boolean;
  memberProfile: MemberProfile | null;
  removingMemberId: string | null;
  selectedChatId: string;
  sidebarDocs: SidebarDoc[];
  show: boolean;
  onClose: () => void;
  onDownloadGalleryItem: (item: GalleryItem) => void;
  onDownloadDocument: (messageId: string, name: string) => void;
  onGroupAvatarSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenImage: (messageId: string) => void;
  onRemoveGroupMember: (memberId: string, memberName: string) => void;
  onTabChange: (tab: SidebarTab) => void;
}

const ChatDetailsSidebar = React.memo(function ChatDetailsSidebar({
  activeChat,
  activeTab,
  currentUserId,
  galleryItems,
  groupAvatarInputRef,
  groupPhotoUploading,
  groupSidebarTabs,
  isGroupAdmin,
  memberProfile,
  removingMemberId,
  selectedChatId,
  sidebarDocs,
  show,
  onClose,
  onDownloadGalleryItem,
  onDownloadDocument,
  onGroupAvatarSelect,
  onOpenImage,
  onRemoveGroupMember,
  onTabChange,
}: ChatDetailsSidebarProps) {
  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            key="right-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden absolute inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="absolute inset-y-0 right-0 lg:relative w-[90vw] sm:w-96 lg:w-[350px] shrink-0 border-l border-neutral-300 bg-white flex flex-col h-full z-45 shadow-xl lg:shadow-none overflow-hidden"
          >
            <div
              className="relative p-6 text-center border-b border-neutral-200 shrink-0"
              style={{
                backgroundColor: "var(--color-neutral-100)",
                backgroundImage:
                  "radial-gradient(var(--color-neutral-300) 1px, transparent 0)",
                backgroundSize: "16px 16px",
              }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 left-4 p-1.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-500 hover:text-black border border-neutral-200 shadow-sm transition-all active:scale-95 cursor-pointer z-10"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="relative w-24 h-24 mx-auto mt-6">
                <img
                  src={activeChat.imageUrl}
                  alt={activeChat.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
                {groupPhotoUploading && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                {activeChat.isGroup && isGroupAdmin && (
                  <>
                    <input
                      ref={groupAvatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onGroupAvatarSelect}
                    />
                    <button
                      type="button"
                      onClick={() => groupAvatarInputRef.current?.click()}
                      disabled={groupPhotoUploading}
                      title="Change group photo"
                      className="absolute bottom-0 right-0 p-2 rounded-full bg-primary-600 text-white border-2 border-white shadow-md hover:bg-primary-700 transition-colors disabled:opacity-50 z-10"
                    >
                      {groupPhotoUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Pencil className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </>
                )}
              </div>

              <h3 className="text-base font-bold text-neutral-900 mt-3 font-aeonicPro leading-snug">
                {activeChat.name}
              </h3>

              <p className="text-[10px] font-semibold text-neutral-500 mt-1.5 uppercase tracking-wider">
                {activeChat.isGroup
                  ? `Group • ${activeChat.members.length} members`
                  : "Direct message"}
              </p>

              {!activeChat.isGroup && memberProfile && (
                <p className="text-xs text-neutral-600 mt-3 leading-relaxed px-2 font-normal">
                  {memberProfile.collegeName
                    ? `${memberProfile.collegeName}${
                        memberProfile.skills.length > 0
                          ? ` • ${memberProfile.skills.slice(0, 3).join(", ")}`
                          : ""
                      }`
                    : memberProfile.skills.length > 0
                      ? memberProfile.skills.slice(0, 5).join(", ")
                      : "OppSkills member"}
                </p>
              )}

              {activeChat.isGroup && isGroupAdmin && (
                <p className="text-[10px] text-primary-600 font-semibold mt-2">
                  You are the group admin
                </p>
              )}
            </div>

            <div className="flex px-4 border-b border-neutral-200 bg-white shrink-0">
              {groupSidebarTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={`
                    flex-1 text-center py-3 text-xs font-semibold tracking-wide transition-all border-b-2 relative uppercase cursor-pointer
                    ${
                      activeTab === tab
                        ? "text-primary-600 border-primary-500 font-bold"
                        : "text-neutral-500 border-transparent hover:text-neutral-700 font-medium"
                    }
                  `}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar bg-white">
              {activeTab === "Members" && activeChat.isGroup ? (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    All members ({activeChat.members.length})
                  </h4>
                  {activeChat.members.map((member) => {
                    const isSelf = member.id === currentUserId;
                    const canRemove =
                      isGroupAdmin && !member.isAdmin && !isSelf;
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
                      >
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover border border-neutral-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-neutral-800 truncate">
                              {member.name}
                              {isSelf ? " (You)" : ""}
                            </p>
                            {member.isAdmin && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0">
                                <Crown className="w-2.5 h-2.5" />
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                            {member.email}
                          </p>
                        </div>
                        {canRemove && (
                          <button
                            type="button"
                            title={`Remove ${member.name}`}
                            disabled={removingMemberId === member.id}
                            onClick={() =>
                              onRemoveGroupMember(member.id, member.name)
                            }
                            className="p-1.5 rounded-full text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors shrink-0 disabled:opacity-50"
                          >
                            {removingMemberId === member.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserMinus className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : activeTab === "Media" ? (
                <div className="space-y-5">
                  {galleryItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <ImageIcon className="w-8 h-8 text-neutral-400 mb-2" />
                      <p className="text-xs font-semibold text-neutral-600">
                        No media shared yet
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-1">
                        Photos shared in this chat will show up here
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-2.5">
                        Shared Media ({galleryItems.length})
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {galleryItems.map((item) => (
                          <div
                            key={item.messageId}
                            className="relative aspect-square rounded-lg overflow-hidden border border-neutral-100 shadow-xs group/media-item"
                          >
                            <SecureChatAttachmentImage
                              conversationId={selectedChatId}
                              messageId={item.messageId}
                              alt="Media content"
                              onClick={() => onOpenImage(item.messageId)}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDownloadGalleryItem(item);
                              }}
                              className="absolute bottom-1 right-1 p-1.5 rounded-full bg-black/55 text-white opacity-0 group-hover/media-item:opacity-100 hover:bg-black/75 transition-all"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : sidebarDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FileText className="w-8 h-8 text-neutral-400 mb-2" />
                  <p className="text-xs font-semibold text-neutral-600">
                    No documents shared yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sidebarDocs.map((doc) => (
                    <div
                      key={doc.messageId}
                      className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-primary-100 text-primary-600">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-neutral-800 truncate group-hover:text-primary-600 transition-colors">
                          {doc.name}
                        </p>
                        {doc.size && (
                          <p className="text-[10px] text-neutral-500 mt-0.5">
                            {doc.size}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onDownloadDocument(doc.messageId, doc.name)
                        }
                        className="p-1.5 rounded-full hover:bg-neutral-200 text-neutral-500 shrink-0"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export default ChatDetailsSidebar;
