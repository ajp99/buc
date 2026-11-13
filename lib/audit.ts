import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";

type AuditEntry = {
  action: "create" | "update" | "delete";
  entity: string;
  entityId?: string | null;
  meta?: Json;
};

/**
 * Records an admin/co-teacher write. Failures are logged, not thrown: the
 * write itself already succeeded and should not be reported as failed.
 */
export async function logAudit(supabase: SupabaseClient<Database>, actorId: string, entry: AuditEntry) {
  const { error } = await supabase.from("audit_log").insert({
    actor_id: actorId,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId ?? null,
    meta: entry.meta ?? {},
  });
  if (error) console.error("audit_log insert failed", error);
}
