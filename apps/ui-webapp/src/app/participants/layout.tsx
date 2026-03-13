import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/api/usersApi";

export default async function ParticipantsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getToken, userId } = await auth();

  // If not authenticated, redirect to sign in
  if (!userId) {
    redirect("/");
  }

  try {
    const token = await getToken();
    if (!token) {
      redirect("/");
    }

    // Check if user is onboarded
    const me = await getMe(token);

    if (!me.onboarded) {
      redirect("/onboarding");
    }
  } catch (error) {
    // If there's an error fetching the user, they might not exist yet
    // Redirect to onboarding to create their profile
    console.error("Error checking onboarding status:", error);
    redirect("/onboarding");
  }

  return <>{children}</>;
}
