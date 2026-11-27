import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Owner knowledge-base reads include inactive rows and all mutations use the audited server RPC", () => {
  const api = read("./support-faq-admin.functions.ts");
  const ui = read("../support/SupportKnowledgeBase.tsx");
  const migration = read("../../supabase/migrations/20261127110000_rubi_support_faq_atomic_audit.sql");
  assert.match(api, /getAdminSupportFaq[\s\S]*middleware\(\[requireOwnerRole\]\)/);
  assert.match(api, /manageAdminSupportFaq[\s\S]*middleware\(\[requireOwnerRole\]\)/);
  assert.match(api, /p_actor:\s*context\.userId/);
  assert.match(api, /rpc\("rubi_manage_support_faq_audited"/);
  assert.match(api, /select\("id,question,answer,keywords,priority,is_active,created_at,updated_at"\)/);
  assert.match(ui, /getAdminSupportFaq/);
  assert.match(ui, /manageAdminSupportFaq/);
  assert.doesNotMatch(ui, /from\("support_faq"\)\.(?:insert|update|delete)/);
  for (const action of ["create", "update", "toggle", "delete"]) assert.ok(api.includes(`action: z.literal("${action}")`));
  for (const token of [
    "add column if not exists updated_at", "security definer", "set search_path = ''",
    "Owner access required", "for update", "Expected support FAQ revision is required", "p_expected_updated_at",
    "insert into public.admin_audit_log", "RUBI_SUPPORT_FAQ_CREATED",
    "RUBI_SUPPORT_FAQ_UPDATED", "RUBI_SUPPORT_FAQ_STATUS_CHANGED",
    "RUBI_SUPPORT_FAQ_DELETED", "revoke all on function",
    "to service_role", "revoke insert, update, delete on public.support_faq"
  ]) assert.ok(migration.toLowerCase().includes(token.toLowerCase()), token);
});

test("Public support FAQ reads remain available while browser writes are denied", () => {
  const base = read("../../supabase/migrations/20260901015000_sprint27_part3_support.sql");
  const migration = read("../../supabase/migrations/20261127110000_rubi_support_faq_atomic_audit.sql");
  assert.match(base, /grant select on public\.support_faq to anon, authenticated/i);
  assert.match(base, /using \(is_active = true\)/);
  assert.match(migration, /revoke insert, update, delete on public\.support_faq from public, anon, authenticated/i);
});
