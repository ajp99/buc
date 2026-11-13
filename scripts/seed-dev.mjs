// Local development fixtures: two batches, subjects, two students and a
// co-teacher. Refuses to run against anything but a local Supabase.
//   node scripts/seed-dev.mjs
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url)) {
  console.error(`Refusing to seed non-local Supabase at "${url}".`);
  process.exit(1);
}

const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export const DEV_PASSWORD = "devpass1234";

async function ensureAuthUser(email, appMetadata) {
  const { data: list, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const found = list.users.find((u) => u.email === email);
  if (found) return found.id;
  const { data, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: DEV_PASSWORD,
    email_confirm: true,
    app_metadata: appMetadata,
  });
  if (createError) throw createError;
  return data.user.id;
}

async function upsert(table, rows, onConflict) {
  const { data, error } = await supabase.from(table).upsert(rows, { onConflict }).select();
  if (error) throw error;
  return data;
}

const batches = await upsert(
  "batches",
  [
    { name: "Standard 6", standard: 6 },
    { name: "Standard 9", standard: 9 },
  ],
  "standard",
);
const byStd = Object.fromEntries(batches.map((b) => [b.standard, b.id]));

await upsert(
  "subjects",
  [
    { batch_id: byStd[6], name: "Maths" },
    { batch_id: byStd[6], name: "Science" },
    { batch_id: byStd[9], name: "Maths" },
    { batch_id: byStd[9], name: "English" },
  ],
  "batch_id,name",
);

const students = [
  { phone: "9000000006", name: "Asha Verma", std: 6, fee: 800 },
  { phone: "9000000009", name: "Ravi Kumar", std: 9, fee: 1200 },
];
for (const s of students) {
  const userId = await ensureAuthUser(`${s.phone}@students.tuition.local`, { role: "student", phone: s.phone });
  await upsert(
    "students",
    [{ user_id: userId, full_name: s.name, batch_id: byStd[s.std], parent_phone: s.phone, monthly_fee: s.fee }],
    "user_id",
  );
}

await ensureAuthUser("coteacher@tuition.local", { role: "co_teacher", username: "coteacher" });

console.log(`Seeded. Students 9000000006 (std 6), 9000000009 (std 9); co-teacher "coteacher". Password: ${DEV_PASSWORD}`);
