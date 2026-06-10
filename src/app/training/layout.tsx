"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { TestProvider } from "@/components/providers/TestContext";
import type { ReactNode } from "react";

export default function TrainingLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <TestProvider>{children}</TestProvider>
    </AuthGuard>
  );
}
