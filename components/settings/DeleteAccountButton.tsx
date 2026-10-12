"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function DeleteAccountButton() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Видалити обліковий запис TalkHero назавжди?\n\n" +
        "Буде видалено ваш профіль, навчальний прогрес, словник, " +
        "історію розмов, результати тестів та інші пов’язані дані.\n\n" +
        "Цю дію неможливо скасувати.",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });

      const data = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            error?: string;
          }
        | null;

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error ??
            "Не вдалося видалити обліковий запис.",
        );
      }

      const supabase = createClient();

      await supabase.auth.signOut();

      router.replace("/login");
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Не вдалося видалити обліковий запис.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button
        type="button"
        variant="destructive"
        onClick={handleDelete}
        disabled={isDeleting}
        className="gap-2"
      >
        {isDeleting ? (
          <Loader2
            className="h-4 w-4 animate-spin"
            aria-hidden="true"
          />
        ) : (
          <Trash2
            className="h-4 w-4"
            aria-hidden="true"
          />
        )}

        {isDeleting
          ? "Видаляємо..."
          : "Видалити акаунт"}
      </Button>

      {error && (
        <p
          role="alert"
          className="max-w-sm text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}