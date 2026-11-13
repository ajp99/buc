"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { studentEmail } from "@/lib/auth/identity";
import { requireRole } from "@/lib/auth/session";
import { fromDb, fromZod, type ActionState } from "@/lib/actions/result";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { passwordSchema, studentCreateSchema, studentUpdateSchema } from "@/lib/validators/admin";

export async function createStudent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("admin");
  const parsed = studentCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { phone, password, ...profile } = parsed.data;

  // Auth users can only be created with the service role.
  const admin = createAdminClient();
  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email: studentEmail(phone),
    password,
    email_confirm: true,
    app_metadata: { role: "student", phone },
  });
  if (authError || !created.user) {
    return authError?.code === "email_exists" ? { fieldErrors: { phone: "errors.phoneTaken" } } : { error: "errors.generic" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .insert({ ...profile, user_id: created.user.id })
    .select("id")
    .single();
  if (error) {
    // Don't leave a login without a student profile behind.
    await admin.auth.admin.deleteUser(created.user.id);
    return fromDb(error);
  }

  await logAudit(supabase, user.id, { action: "create", entity: "student", entityId: data.id, meta: { ...profile, phone } });
  revalidatePath("/admin/students");
  return { ok: true };
}

export async function updateStudent(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("admin");
  const parsed = studentUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("students").update(parsed.data).eq("id", id).is("deleted_at", null);
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "update", entity: "student", entityId: id, meta: parsed.data });
  revalidatePath("/admin/students");
  redirect("/admin/students");
}

export async function resetStudentPassword(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("admin");
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) return { fieldErrors: { password: "validation.password" } };

  const supabase = await createClient();
  const { data: student } = await supabase.from("students").select("user_id").eq("id", id).single();
  if (!student) return { error: "errors.notFound" };

  const { error } = await createAdminClient().auth.admin.updateUserById(student.user_id, { password: parsed.data });
  if (error) return { error: "errors.generic" };

  await logAudit(supabase, user.id, { action: "update", entity: "student", entityId: id, meta: { password_reset: true } });
  return { ok: true };
}

/** Soft delete: the student can no longer sign in, but fees and quiz history stay. */
export async function removeStudent(id: string): Promise<ActionState> {
  const user = await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ is_active: false, deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "delete", entity: "student", entityId: id });
  revalidatePath("/admin/students");
  return { ok: true };
}
