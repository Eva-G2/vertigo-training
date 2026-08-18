"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { UserRecordsPage } from "@/components/home/UserRecordsPage";

export default function RecordsRoutePage() {
  return (
    <AppShell showBoneLandmarkToggle={false} lockViewport>
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue border-t-transparent" />
          </div>
        }
      >
        <UserRecordsPage />
      </Suspense>
    </AppShell>
  );
}

