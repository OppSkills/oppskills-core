"use client";

import { useEffect, useState } from "react";
import { getMe } from "@/lib/api/actions";
import { CreateAdminDialog } from "./create-admin-dialog";
import { Loader2 } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  immutable: boolean;
}

interface AdminActionsProps {
  onAdminCreated: () => void;
}

export function AdminActions({ onAdminCreated }: AdminActionsProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await getMe();
        setUser(data);
      } catch (error) {
        console.error("Failed to fetch user", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  if (!user?.immutable) {
    return null;
  }

  return <CreateAdminDialog onAdminCreated={onAdminCreated} />;
}
