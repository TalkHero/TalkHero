"use client";

export type ToastMessage = {
  type: "success" | "error";
  text: string;
};

type ToastProps = {
  message: ToastMessage | null;
};

export function Toast({ message }: ToastProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
        message.type === "success"
          ? "bg-emerald-600 text-white"
          : "bg-red-600 text-white"
      }`}
      role="status"
      aria-live="polite"
    >
      {message.text}
    </div>
  );
}
