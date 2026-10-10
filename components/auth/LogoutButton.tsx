"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      variant="destructive"
      onClick={handleLogout}
      aria-label="Вийти з облікового запису"
      className="w-10 shrink-0 px-0 sm:w-auto sm:px-4"
    >
      <LogOut className="size-4 sm:hidden" aria-hidden="true" />

      <span className="hidden sm:inline">
        Вийти
      </span>
    </Button>
  );
}
