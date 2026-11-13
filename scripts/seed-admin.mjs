// Creates the first admin account. Safe to re-run: an existing admin keeps its
// password unless --reset-password is passed.
//   node scripts/seed-admin.mjs [--reset-password]
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Fall back to variables already in the environment (e.g. production).
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const username = (process.env.SEED_ADMIN_USERNAME ?? "admin").trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD;

if (!url || !serviceKey || !password) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SEED_ADMIN_PASSWORD.");
  process.exit(1);
}
if (password.length < 10) {
  console.error("SEED_ADMIN_PASSWORD must be at least 10 characters.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const email = `${username}@tuition.local`;

const { data: existing, error: lookupError } = await supabase
  .from("users")
  .select("id, role")
  .eq("username", username)
  .maybeSingle();
if (lookupError) throw lookupError;

if (existing) {
  if (existing.role !== "admin") {
    console.error(`User "${username}" exists but is ${existing.role}, not admin. Aborting.`);
    process.exit(1);
  }
  if (process.argv.includes("--reset-password")) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, { password });
    if (error) throw error;
    console.log(`Admin "${username}" password reset.`);
  } else {
    console.log(`Admin "${username}" already exists. Nothing to do.`);
  }
  process.exit(0);
}

const { error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { role: "admin", username },
});
if (error) throw error;
console.log(`Admin "${username}" created (${email}).`);
