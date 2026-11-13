"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { fromDb, type ActionState } from "@/lib/actions/result";
import { ENQUIRY_STATUSES, type EnquiryStatus } from "@/lib/enquiry";
import { createClient } from "@/lib/supabase/server";

export async function setEnquiryStatus(id: string, status: EnquiryStatus): Promise<ActionState> {
  const user = await requireRole("admin");
  if (!ENQUIRY_STATUSES.includes(status)) return { error: "validation.invalid" };

  const supabase = await createClient();
  const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "update", entity: "enquiry", entityId: id, meta: { status } });
  revalidatePath("/admin/enquiries");
  return { ok: true };
}

export async function deleteEnquiry(id: string): Promise<ActionState> {
  const user = await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("enquiries").delete().eq("id", id);
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "delete", entity: "enquiry", entityId: id });
  revalidatePath("/admin/enquiries");
  return { ok: true };
}
