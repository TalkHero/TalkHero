"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password || !fullName) {
      alert("Заповніть усі поля.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    setLoading(false);

    if (error) {
      alert("Не вдалося створити акаунт. Перевірте введені дані.");
      return;
    }

    alert(
      "Акаунт успішно створено. Перевірте електронну пошту та підтвердьте реєстрацію.",
    );

    router.push("/login");
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <h1 className="mb-2 text-3xl font-bold">
        Створити акаунт
      </h1>

      <p className="mb-6 text-slate-500">
        Start learning English today.
      </p>

      <div className="space-y-4">
        <input
          className="w-full rounded-lg border p-3"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <input
          className="w-full rounded-lg border p-3"
          placeholder="Електронна пошта"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full rounded-lg border p-3"
          placeholder="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          className="w-full"
          disabled={loading}
          onClick={handleRegister}
        >
          {loading ? "Створення..." : "Створити акаунт"}
        </Button>
      </div>
    </div>
  );
}
