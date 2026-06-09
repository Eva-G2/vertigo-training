"use client";

import { NurseIllustration } from "./NurseIllustration";

export function VideoDemo() {
  return (
    <div className="flex aspect-[4/3] w-full max-w-3xl items-center justify-center overflow-hidden rounded-[20px] border-[3px] border-blue bg-card">
      <NurseIllustration />
    </div>
  );
}
