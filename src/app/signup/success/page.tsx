"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useApp } from "@/components/providers/AppProvider";
import { t } from "@/lib/i18n";
import { onPrepareStart } from "@/lib/training-flow";

export default function SignupSuccessPage() {
  const router = useRouter();
  const { state, updateTraining } = useApp();
  const { locale } = state;

  const handleContinue = () => {
    updateTraining(onPrepareStart(state));
    router.push("/training/stage/1/prepare");
  };

  return (
    <AppShell showSound={false}>
      <div className="flex flex-1 flex-col items-center justify-center py-12">
        <Card className="flex w-full max-w-lg flex-col items-center gap-10 px-8 py-12 text-center">
          <p className="text-2xl font-bold leading-snug text-foreground">
            {t(locale, "signupSuccess")}
          </p>
          <Button label={t(locale, "startTraining")} onClick={handleContinue} />
        </Card>
      </div>
    </AppShell>
  );
}
