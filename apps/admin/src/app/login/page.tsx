import Login from "@/components/auth/Login";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Login to Admin Panel",
};

export default function LoginPage() {
  return <Login />;
}
