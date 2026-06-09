"use client";

import dynamic from "next/dynamic";
import ChatsPageLoading from "./ChatsPageLoading";

const ChatsPageContent = dynamic(() => import("./ChatsPageContent"), {
  loading: () => <ChatsPageLoading />,
  ssr: false,
});

export default function ChatsPage() {
  return <ChatsPageContent />;
}
