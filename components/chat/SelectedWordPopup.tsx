"use client";

import { BookPlus, Loader2 } from "lucide-react";

type SelectedWord = {
  word: string;
  context: string;
  messageId: string;
  x: number;
  y: number;
};

type SelectedWordPopupProps = {
  selectedWord: SelectedWord | null;
  saving: boolean;
  onSave: () => void;
};

export function SelectedWordPopup({
  selectedWord,
  saving,
  onSave,
}: SelectedWordPopupProps) {
  if (!selectedWord) {
    return null;
  }

  return (
    <div
      className="fixed z-50 -translate-x-1/2 -translate-y-full"
      style={{
        left: selectedWord.x,
        top: selectedWord.y,
      }}
    >
      <button
        type="button"
        onMouseDown={(event) => {
          event.preventDefault();
        }}
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-xl transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <BookPlus className="h-4 w-4" />
        )}

        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
