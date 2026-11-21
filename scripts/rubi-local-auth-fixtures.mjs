import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { appendFile } from "node:fs/promises";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Local Supabase URL/service key are required.");
const localHost = new URL(url).hostname;
if (!["127.0.0.1", "localhost", "::1"].includes(localHost)) {
  throw new Error("Refusing to create RUBI QA identities outside the local Supabase instance.");
}
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const run = (process.env.GITHUB_RUN_ID || randomBytes(6).toString("hex")).replace(/[^a-zA-Z0-9]/g, "");
const password = () => randomBytes(30).toString("base64url");
const envFile = process.env.GITHUB_ENV;
if (!envFile) throw new Error("GITHUB_ENV is required so temporary credentials never need to be printed.");

async function addEnv(key, value) {
  if (/[\r\n]/.test(value)) throw new Error("Invalid environment value.");
  await appendFile(envFile, `${key}=${value}\n`, { encoding: "utf8", mode: 0o600 });
}
async function createIdentity(role, displayName) {
  const email = `rubi-qa-${role}-${run}@example.test`;
  const secret = password();
  const { data, error } = await admin.auth.admin.createUser({
    email, password: secret, email_confirm: true,
    user_metadata: { display_name: displayName, rubi_qa_fixture: true },
  });
  if (error || !data.user) throw new Error(`Could not create local ${role} identity: ${error?.message ?? "missing user"}`);
  await addEnv(`RUBI_QA_${role.toUpperCase()}_EMAIL`, email);
  await addEnv(`RUBI_QA_${role.toUpperCase()}_PASSWORD`, secret);
  return data.user.id;
}

const mode = process.argv[2];
if (mode === "bootstrap-owner") {
  const ownerCount = await admin.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "owner");
  if (ownerCount.error) throw new Error(`Could not inspect local owner roles: ${ownerCount.error.message}`);
  if (ownerCount.count !== 0) throw new Error("Expected zero owner roles before bootstrapping the disposable Master.");
  const masterId = await createIdentity("master", "RUBI QA Master");
  const { error } = await admin.from("user_roles").insert({ user_id: masterId, role: "owner" });
  if (error) throw new Error(`Could not seed the sole local owner role: ${error.message}`);
  await addEnv("RUBI_QA_MASTER_USER_ID", masterId);
  process.stdout.write("One disposable founding Master role seeded before its bootstrap migration; credentials withheld.\\n");
} else if (mode === "seed-profiles") {
  const masterId = process.env.RUBI_QA_MASTER_USER_ID;
  if (!masterId) throw new Error("The disposable Master must be bootstrapped before commercial profiles.");
  const { data: master, error: masterError } = await admin.from("rubi_primary_master").select("user_id").single();
  if (masterError || master?.user_id !== masterId) throw new Error("Founding Master migration did not register the disposable owner.");
  const ownerCount = await admin.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "owner");
  if (ownerCount.error || ownerCount.count !== 1) throw new Error("Expected exactly one local owner after the bootstrap migration.");

  const fixtures = [
    { role: "consumer", name: "RUBI QA Consumidor", audience: "consumer", status: "approved" },
    { role: "merchant", name: "RUBI QA Lojista", audience: "merchant", status: "approved", business_name: "Loja QA Isolada" },
    { role: "partner", name: "RUBI QA Parceiro", audience: "partner", partner_type: "affiliate", status: "approved" },
  ];
  for (const fixture of fixtures) {
    const userId = await createIdentity(fixture.role, fixture.name);
    const { role, name, ...profile } = fixture;
    const { error } = await admin.from("commercial_profiles").insert({
      user_id: userId, display_name: name, ...profile,
    });
    if (error) throw new Error(`Could not seed local ${role} profile: ${error.message}`);
    await addEnv(`RUBI_QA_${role.toUpperCase()}_USER_ID`, userId);
  }
  process.stdout.write("Consumer, approved merchant and approved partner fixtures are ready. Credentials withheld.\\n");
} else {
  throw new Error("Use bootstrap-owner or seed-profiles.");
}
