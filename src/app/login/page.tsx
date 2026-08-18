"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";
import { useApp } from "@/components/providers/AppProvider";
import { t } from "@/lib/i18n";
import { authFromUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const { state, setAuth } = useApp();
  const { locale } = state;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword(
        {
          email: username.trim(),
          password,
        },
      );

      if (signInError) {
        throw new Error(signInError.message);
      }

      if (!data.user) {
        throw new Error("Login failed");
      }

      const auth = authFromUser(data.user);
      setAuth(auth);
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell showSound={false}>
      <div className="flex flex-1 flex-col items-center justify-center py-12">
        <Card className="flex w-full max-w-[600px] flex-col gap-6 px-8 py-10">
          <TextField
            id="username"
            label={t(locale, "field1")}
            placeholder={t(locale, "placeholder")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <TextField
            id="password"
            label={t(locale, "password")}
            placeholder={t(locale, "placeholder")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error && (
            <p className="text-center text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col items-center gap-4 pt-2">
            <Button
              label={loading ? "..." : t(locale, "login")}
              onClick={handleLogin}
              disabled={!username || !password || loading}
            />
            <Link href="/signup">
              <Button variant="secondary" label={t(locale, "signup")} />
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
