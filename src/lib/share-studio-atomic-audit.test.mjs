import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Share Studio global configuration uses Owner-gated audited server writes", () => {
  const migration = read("../../supabase/migrations/20261127260000_rubi_share_studio_atomic_audit.sql");
  const server = read("./share-studio.functions.ts");
  const shared = read("./supabase/sharing.ts");
  const component = read("../admin/sharing/ShareTemplatesAdmin.tsx");
  const smoke = read("../../scripts/rubi-local-share-studio-audit-smoke.sql");
  const hub = read("../../.github/workflows/hub-v1-integration-qa.yml");
  const e2e = read("../../.github/workflows/rubi-local-authenticated-e2e.yml");

  for (const table of ["share_templates", "share_card_config"]) {
    assert.ok(migration.includes("revoke insert, update, delete on public." + table + " from public, anon, authenticated"));
  }
  assert.ok(migration.includes("drop policy if exists share_templates_owner_write_s38"));
  assert.ok(migration.includes("drop policy if exists share_card_config_owner_write_s38"));
  assert.ok(migration.includes("create policy share_templates_owner_select_s38"));
  assert.ok(migration.includes("create policy share_card_config_owner_select_s38"));
  assert.ok(migration.includes("rubi_update_share_template_audited"));
  assert.ok(migration.includes("rubi_update_share_card_config_audited"));
  assert.ok(migration.includes("insert into public.admin_audit_log"));
  assert.ok(migration.includes("security invoker\nset search_path=''"));
  assert.ok(migration.includes("caption_length"));
  assert.ok(migration.includes("config values are never copied into audit payloads"));

  assert.ok(server.includes(".middleware([requireOwnerRole])"));
  assert.ok(server.includes("rubi_update_share_template_audited"));
  assert.ok(server.includes("rubi_update_share_card_config_audited"));
  assert.ok(server.includes("p_actor: context.userId"));
  assert.ok(!shared.includes('.from("share_templates").update'));
  assert.ok(!shared.includes('.from("share_card_config").update'));
  assert.ok(component.includes("updateAdminShareTemplate"));
  assert.ok(component.includes("updateAdminShareCardConfig"));

  assert.ok(smoke.includes("RUBI_QA_FORCED_SHARE_AUDIT_FAILURE"));
  assert.ok(smoke.includes("Share template mutation survived audit rollback"));
  assert.ok(smoke.includes("Share card config mutation survived audit rollback"));
  assert.ok(smoke.includes("Owner authorization required"));
  assert.ok(smoke.includes("RUBI_SHARE_CARD_CONFIG_UPDATED"));
  assert.ok(hub.includes("share-studio-atomic-audit.test.mjs"));
  assert.ok(e2e.includes("rubi-local-share-studio-audit-smoke.sql"));
});
