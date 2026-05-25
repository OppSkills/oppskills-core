"use client";
import { useRouter } from "next/navigation";

export default function ManageCommunityPage() {
  const router = useRouter();
  router.push("/dashboard/community/manage");
  return null;
}
