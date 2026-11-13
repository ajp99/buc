import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homeFor, type Role } from "./routes";

export type SessionUser = {
  id: string;
  role: Role;
  language: "en" | "hi";
  username: string | null;
  phone: string | null;
};

/** The signed-in user's profile, or null. Cached per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("users")
    .select("id, role, language, username, phone")
    .eq("id", user.id)
    .maybeSingle();
  return (data as SessionUser | null) ?? null;
});

/** For server actions and pages: the user if they hold one of `roles`, else redirect. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}

export type CurrentStudent = {
  id: string;
  full_name: string;
  parent_phone: string;
  batch: { id: string; name: string; standard: number };
};

/** The signed-in student's active profile with batch, or null. Cached per request. */
export const getCurrentStudent = cache(async (): Promise<CurrentStudent | null> => {
  const user = await getSessionUser();
  if (!user || user.role !== "student") return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, full_name, parent_phone, batch:batches!inner(id, name, standard)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as CurrentStudent | null) ?? null;
});
