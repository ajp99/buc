"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { fromDb, type ActionState } from "@/lib/actions/result";
import { isMonth } from "@/lib/fees";
import { createClient } from "@/lib/supabase/server";

function revalidate() {
  revalidatePath("/admin/fees");
  revalidatePath("/app", "layout");
}

export async function generateFees(month: string): Promise<ActionState> {
  const user = await requireRole("admin");
  if (!isMonth(month)) return { error: "validation.invalid" };

  const supabase = await createClient();
  const { data: count, error } = await supabase.rpc("generate_fees", { p_month: month });
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "create", entity: "fees", entityId: month, meta: { generated: count } });
  revalidate();
  return { ok: true, message: "fees.generated", vars: { count: count ?? 0 } };
}

export async function markFeePaid(id: string): Promise<ActionState> {
  const user = await requireRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mark_fee_paid", { p_fee_id: id });
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "update", entity: "fee", entityId: id, meta: { status: "paid", receipt_no: data?.receipt_no ?? null } });
  revalidate();
  return { ok: true };
}

export async function markFeeUnpaid(id: string): Promise<ActionState> {
  const user = await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_fee_unpaid", { p_fee_id: id });
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "update", entity: "fee", entityId: id, meta: { status: "unpaid" } });
  revalidate();
  return { ok: true };
}

export async function updateFeeAmount(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("admin");
  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) return { fieldErrors: { amount: "validation.amount" } };

  // Only unpaid fees can change amount: a paid fee has an issued receipt.
  const supabase = await createClient();
  const { error } = await supabase.from("fees").update({ amount }).eq("id", id).eq("status", "unpaid");
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "update", entity: "fee", entityId: id, meta: { amount } });
  revalidate();
  return { ok: true };
}
