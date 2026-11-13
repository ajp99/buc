"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { fromDb, fromZod, type ActionState } from "@/lib/actions/result";
import { createClient } from "@/lib/supabase/server";
import { announcementSchema } from "@/lib/validators/content";

function revalidate() {
  revalidatePath("/admin/announcements");
  revalidatePath("/app", "layout");
}

export async function createAnnouncement(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("admin");
  const parsed = announcementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .insert({ ...parsed.data, created_by: user.id })
    .select("id")
    .single();
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "create", entity: "announcement", entityId: data.id, meta: { title: parsed.data.title } });
  revalidate();
  return { ok: true };
}

export async function updateAnnouncement(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("admin");
  const parsed = announcementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").update(parsed.data).eq("id", id);
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "update", entity: "announcement", entityId: id, meta: { title: parsed.data.title } });
  revalidate();
  redirect("/admin/announcements");
}

export async function deleteAnnouncement(id: string): Promise<ActionState> {
  const user = await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "delete", entity: "announcement", entityId: id });
  revalidate();
  return { ok: true };
}
