import type { User } from "@supabase/supabase-js";
import type { AuthState } from "@/lib/types";

export function authFromUser(user: User | null | undefined): AuthState {
  if (!user) return { status: "anonymous" };

  const meta = user.user_metadata ?? {};
  const displayName =
    (typeof meta.display_name === "string" && meta.display_name) ||
    (typeof meta.username === "string" && meta.username) ||
    user.email?.split("@")[0] ||
    "User";

  return {
    status: "authenticated",
    userId: user.id,
    displayName,
  };
}
