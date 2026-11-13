"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { homeFor } from "@/lib/auth/routes";
import { requireRole } from "@/lib/auth/session";
import { fromDb, type ActionState } from "@/lib/actions/result";
import { parseSubjectContent } from "@/lib/actions/subject-content";
import { createClient } from "@/lib/supabase/server";
import { materialSchema } from "@/lib/validators/content";

// Materials are the one thing co-teachers can write, so both roles are allowed.
const ROLES = ["admin", "co_teacher"] as const;

function revalidate() {
  revalidatePath("/admin/materials");
  revalidatePath("/staff/materials");
  revalidatePath("/app/materials");
}

export async function createMaterial(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(...ROLES);
  const result = await parseSubjectContent(materialSchema, formData);
  if (!result.ok) return result.state;
  const { supabase, row } = result;

  const { data, error } = await supabase.from("materials").insert({ ...row, created_by: user.id }).select("id").single();
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "create", entity: "material", entityId: data.id, meta: { title: row.title, url: row.url } });
  revalidate();
  return { ok: true };
}

export async function updateMaterial(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(...ROLES);
  const result = await parseSubjectContent(materialSchema, formData);
  if (!result.ok) return result.state;
  const { supabase, row } = result;

  const { error } = await supabase.from("materials").update(row).eq("id", id);
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "update", entity: "material", entityId: id, meta: { title: row.title, url: row.url } });
  revalidate();
  redirect(`${homeFor(user.role)}/materials`);
}

export async function deleteMaterial(id: string): Promise<ActionState> {
  const user = await requireRole(...ROLES);
  const supabase = await createClient();
  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "delete", entity: "material", entityId: id });
  revalidate();
  return { ok: true };
}
