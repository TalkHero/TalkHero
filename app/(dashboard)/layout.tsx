import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select(
        "full_name, english_level, xp, streak",
      )
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) {
    console.error(
      "DASHBOARD LAYOUT PROFILE ERROR:",
      profileError,
    );
  }

  const fullName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Student";

  return (
    <AppShell
      fullName={fullName}
      englishLevel={profile?.english_level ?? "A1"}
      xp={profile?.xp ?? 0}
      streak={profile?.streak ?? 0}
    >
      {children}
    </AppShell>
  );
}
