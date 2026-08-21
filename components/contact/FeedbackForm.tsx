"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, Send, X } from "lucide-react";

type FeedbackResponse = {
  success?: boolean;
  id?: string;
  error?: string;
};

const MAX_ATTACHMENTS = 5;

export function FeedbackForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function removeFile(index: number) {
    setFiles((current) =>
      current.filter((_, fileIndex) => fileIndex !== index),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);
    setSubmitted(false);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    formData.delete("attachments");

    for (const file of files) {
      formData.append("attachments", file);
    }

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as FeedbackResponse;

      if (!response.ok || !result.success) {
        setError(
          result.error ?? "Не вдалося надіслати звернення. Спробуйте ще раз.",
        );

        return;
      }

      form.reset();
      setFiles([]);
      setSubmitted(true);
    } catch {
      setError(
        "Не вдалося зв’язатися із сервером. Перевірте з’єднання та спробуйте ще раз.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mt-8 rounded-[32px] border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <h2 className="mt-5 text-2xl font-black text-slate-950">
          Дякуємо за повідомлення!
        </h2>

        <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
          Звернення успішно надіслано команді TalkHero.
        </p>

        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-black"
        >
          Надіслати ще одне
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm font-bold text-slate-800">
            Ім’я
          </label>

          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={120}
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder="Ваше ім’я"
          />
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-bold text-slate-800">
            Електронна пошта
          </label>

          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={320}
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="category" className="text-sm font-bold text-slate-800">
          Тип звернення
        </label>

        <select
          id="category"
          name="category"
          defaultValue="bug"
          className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        >
          <option value="bug">Повідомити про помилку</option>
          <option value="idea">Запропонувати ідею</option>
          <option value="question">Поставити запитання</option>
          <option value="other">Інше</option>
        </select>
      </div>

      <div className="mt-6">
        <label htmlFor="message" className="text-sm font-bold text-slate-800">
          Повідомлення
        </label>

        <textarea
          id="message"
          name="message"
          required
          minLength={5}
          maxLength={5000}
          rows={7}
          className="mt-2 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          placeholder="Опишіть проблему або вашу пропозицію якомога детальніше."
        />
      </div>

      <div className="mt-6">
        <span className="text-sm font-bold text-slate-800">
          Скріншоти або фото
        </span>

        <label
          htmlFor="attachments"
          className="mt-2 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40"
        >
          <ImagePlus className="h-7 w-7 text-indigo-600" />

          <span className="mt-3 font-semibold text-slate-800">
            Додати зображення
          </span>

          <span className="mt-1 text-sm text-slate-500">
            PNG, JPG або WEBP · до 5 MB · максимум {MAX_ATTACHMENTS}
          </span>
        </label>

        <input
          id="attachments"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="sr-only"
          onChange={(event) => {
            const selected = Array.from(event.target.files ?? []);

            setError(null);

            if (selected.length > MAX_ATTACHMENTS) {
              setError(`Можна додати не більше ${MAX_ATTACHMENTS} зображень.`);
              event.target.value = "";
              return;
            }

            setFiles(selected);
          }}
        />

        {files.length > 0 && (
          <div className="mt-4 grid gap-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {file.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  aria-label={`Видалити ${file.name}`}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-slate-500">
          Не додавайте паролі, платіжні дані чи іншу конфіденційну інформацію на
          скріншотах.
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Надсилаємо...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Надіслати
            </>
          )}
        </button>
      </div>
    </form>
  );
}
