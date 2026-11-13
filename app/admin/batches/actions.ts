"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { fromDb, fromZod, type ActionState } from "@/lib/actions/result";
import { createClient } from "@/lib/supabase/server";
import { batchSchema } from "@/lib/validators/admin";

export async function createBatch(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("admin");
  const parsed = batchSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase.from("batches").insert(parsed.data).select("id").single();
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "create", entity: "batch", entityId: data.id, meta: parsed.data });
  revalidatePath("/admin/batches");
  return { ok: true };
}

export async function updateBatch(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("admin");
  const parsed = batchSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("batches").update(parsed.data).eq("id", id);
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "update", entity: "batch", entityId: id, meta: parsed.data });
  revalidatePath("/admin/batches");
  redirect("/admin/batches");
}

export async function deleteBatch(id: string): Promise<ActionState> {
  const user = await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("batches").delete().eq("id", id);
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "delete", entity: "batch", entityId: id });
  revalidatePath("/admin/batches");
  return { ok: true };
}
