"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Checkbox } from "@/components/Checkbox";
import { TextField } from "@/components/TextField";
import { useApp } from "@/components/providers/AppProvider";
import { t } from "@/lib/i18n";

export default function SignupPage() {
  const router = useRouter();
  const { state, setAuth } = useApp();
  const { locale } = state;

  const [username, setUsername] = useState("");
  const [field1, setField1] = useState("");
  const [field2, setField2] = useState("");
  const [field3, setField3] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, field1, field2, field3 }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Signup failed");
      }

      const data = await res.json();
      setAuth(
        {
          status: "authenticated",
          userId: data.user.id,
          displayName: data.user.displayName,
        },
        data.token,
      );
      router.push("/signup/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell showSound={false}>
      <div className="flex flex-1 flex-col items-center gap-8 py-8">
        <h1 className="text-3xl font-bold text-foreground">{t(locale, "signup")}</h1>

        <Card className="flex w-full max-w-[600px] flex-col gap-5 px-8 py-8">
          <TextField
            id="username"
            label={t(locale, "username")}
            placeholder={t(locale, "placeholder")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            id="field1"
            label={t(locale, "field1")}
            placeholder={t(locale, "placeholder")}
            value={field1}
            onChange={(e) => setField1(e.target.value)}
          />
          <TextField
            id="field2"
            label={t(locale, "field2")}
            placeholder={t(locale, "placeholder")}
            value={field2}
            onChange={(e) => setField2(e.target.value)}
          />
          <TextField
            id="field3"
            label={t(locale, "field3")}
            placeholder={t(locale, "placeholder")}
            value={field3}
            onChange={(e) => setField3(e.target.value)}
          />
          <TextField
            id="password"
            label={t(locale, "password")}
            placeholder={t(locale, "placeholder")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <p className="pt-2 text-sm leading-relaxed text-foreground/80">
            {t(locale, "disclaimer")}
          </p>

          <Checkbox
            id="terms"
            label={t(locale, "terms")}
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
          />

          {error && (
            <p className="text-center text-red-600" role="alert">
              {error}
            </p>
          )}
        </Card>

        <Button
          label={loading ? "..." : t(locale, "submit")}
          onClick={handleSubmit}
          disabled={!terms || !username || !password || loading}
        />
      </div>
    </AppShell>
  );
}
