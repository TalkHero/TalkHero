import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/ProfileForm";

type EnglishLevel =
  | "A1"
  | "A2"
  | "B1"
  | "B2"
  | "C1"
  | "C2";

const VALID_LEVELS: EnglishLevel[] = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
];

function normalizeEnglishLevel(
  value: string | null | undefined,
): EnglishLevel {
  const normalized = value?.toUpperCase() as EnglishLevel;

  return VALID_LEVELS.includes(normalized)
    ? normalized
    : "A1";
}

export default async function ProfilePage() {
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
        "full_name, native_language, target_language, english_level",
      )
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) {
    console.error("PROFILE PAGE ERROR:", profileError);
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Account settings
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Your profile
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Update your personal information and learning
            preferences. Emma will use these settings in new
            conversations.
          </p>
        </div>

        <ProfileForm
          initialProfile={{
            fullName:
              profile?.full_name ??
              user.user_metadata?.full_name ??
              "",
            nativeLanguage:
              profile?.native_language ?? "uk",
            targetLanguage:
              profile?.target_language ?? "en",
            englishLevel: normalizeEnglishLevel(
              profile?.english_level,
            ),
          }}
        />
      </div>
    </main>
  );
}
