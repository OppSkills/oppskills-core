"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { Chat } from "../../domain/types";

const ChatDetailsSidebar = dynamic(() => import("./ChatDetailsSidebar"), {
  ssr: false,
});

const ImageGalleryModal = dynamic(() => import("./ImageGalleryModal"), {
  ssr: false,
});

type GalleryItem = { messageId: string; fileName: string };

type SidebarDoc = { messageId: string; name: string; size?: string };

type MemberProfile = {
  bio?: string;
  skills: string[];
  collegeName: string | null;
};

type DetailsPanelProps = {
  activeChat: Chat;
  activeRightSidebarTab: "Members" | "Media" | "Docs";
  activeModalImageIndex: number;
  currentUserId: string | null;
  galleryItems: GalleryItem[];
  groupAvatarInputRef: React.RefObject<HTMLInputElement | null>;
  groupPhotoUploading: boolean;
  groupSidebarTabs: readonly ("Members" | "Media" | "Docs")[];
  isGroupAdmin: boolean;
  memberProfile: MemberProfile | null;
  removingMemberId: string | null;
  selectedChatId: string;
  showImageModal: boolean;
  showRightSidebar: boolean;
  showSidebar?: boolean;
  sidebarDocs: SidebarDoc[];
  onCloseRightSidebar: () => void;
  onDownloadGalleryItem: (item: GalleryItem) => void;
  onDownloadDocument: (messageId: string, name: string) => void;
  onGroupAvatarSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageModalClose: () => void;
  onNextImage: () => void;
  onOpenImage: (messageId: string) => void;
  onPrevImage: () => void;
  onRemoveGroupMember: (memberId: string, memberName: string) => void;
  onTabChange: (tab: "Members" | "Media" | "Docs") => void;
};

export function DetailsPanel({
  activeChat,
  activeRightSidebarTab,
  activeModalImageIndex,
  currentUserId,
  galleryItems,
  groupAvatarInputRef,
  groupPhotoUploading,
  groupSidebarTabs,
  isGroupAdmin,
  memberProfile,
  removingMemberId,
  selectedChatId,
  showImageModal,
  showRightSidebar,
  showSidebar = true,
  sidebarDocs,
  onCloseRightSidebar,
  onDownloadGalleryItem,
  onDownloadDocument,
  onGroupAvatarSelect,
  onImageModalClose,
  onNextImage,
  onOpenImage,
  onPrevImage,
  onRemoveGroupMember,
  onTabChange,
}: DetailsPanelProps) {
  return (
    <>
      {showSidebar && (
        <ChatDetailsSidebar
          activeChat={activeChat}
          activeTab={activeRightSidebarTab}
          currentUserId={currentUserId}
          galleryItems={galleryItems}
          groupAvatarInputRef={groupAvatarInputRef}
          groupPhotoUploading={groupPhotoUploading}
          groupSidebarTabs={groupSidebarTabs}
          isGroupAdmin={isGroupAdmin}
          memberProfile={memberProfile}
          removingMemberId={removingMemberId}
          selectedChatId={selectedChatId}
          sidebarDocs={sidebarDocs}
          show={showRightSidebar}
          onClose={onCloseRightSidebar}
          onDownloadGalleryItem={onDownloadGalleryItem}
          onDownloadDocument={onDownloadDocument}
          onGroupAvatarSelect={onGroupAvatarSelect}
          onOpenImage={onOpenImage}
          onRemoveGroupMember={onRemoveGroupMember}
          onTabChange={onTabChange}
        />
      )}

      {showImageModal && galleryItems.length > 0 && (
        <ImageGalleryModal
          activeIndex={activeModalImageIndex}
          conversationId={selectedChatId}
          items={galleryItems}
          onClose={onImageModalClose}
          onDownload={onDownloadGalleryItem}
          onNext={onNextImage}
          onPrev={onPrevImage}
        />
      )}
    </>
  );
}
