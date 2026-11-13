"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginEmail } from "@/lib/auth/identity";
import { safeNext, type Role } from "@/lib/auth/routes";
import { LANG_COOKIE } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: "auth.invalid" | "auth.noStudent" | "auth.required" };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!identifier.trim() || !password) return { error: "auth.required" };

  const email = loginEmail(identifier);
  if (!email) return { error: "auth.invalid" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "auth.invalid" };

  const { data: profile } = await supabase
    .from("users")
    .select("role, language")
    .eq("id", data.user.id)
    .single();
  const role = profile?.role as Role | undefined;
  if (!role) {
    await supabase.auth.signOut();
    return { error: "auth.invalid" };
  }

  if (role === "student") {
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", data.user.id)
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle();
    if (!student) {
      await supabase.auth.signOut();
      return { error: "auth.noStudent" };
    }
  }

  (await cookies()).set(LANG_COOKIE, profile!.language, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  redirect(safeNext(String(formData.get("next") ?? ""), role));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
