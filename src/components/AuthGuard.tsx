"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useApp } from "./providers/AppProvider";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { state, authReady } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;
    if (state.auth.status !== "authenticated") {
      router.replace("/login");
    }
  }, [authReady, state.auth.status, router]);

  if (!authReady || state.auth.status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
