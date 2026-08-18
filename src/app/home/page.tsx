"use client";

import { AppShell } from "@/components/AppShell";
import { UserHomePage } from "@/components/home/UserHomePage";

export default function HomeRoutePage() {
  return (
    <AppShell showBoneLandmarkToggle={false} lockViewport>
      <UserHomePage />
    </AppShell>
  );
}
