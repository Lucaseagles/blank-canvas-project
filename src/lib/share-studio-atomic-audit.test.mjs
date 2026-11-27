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
    assert.match(migration, new RegExp("revoke insert, update, delete on public\\." + table + " from public, anon, authenticated"));
  }
  assert.match(migration, /share_templates_owner_write_s38/);
  assert.match(migration, /share_card_config_owner_write_s38/);
  assert.match(migration, /create policy share_templates_owner_select_s38[\\s\\S]*for select to authenticated/);
  assert.match(migration, /create policy share_card_config_owner_select_s38[\\s\\S]*for select to authenticated/);
  assert.match(migration, /rubi_update_share_template_audited/);
  assert.match(migration, /rubi_update_share_card_config_audited/);
  assert.match(migration, /insert into public\\.admin_audit_log/);
  assert.match(migration, /security invoker[\\s\\S]*set search_path=''/);
  assert.match(migration, /caption_length/);
  assert.match(migration, /config values are never copied into audit payloads/);

  assert.match(server, /middleware\\(\\[requireOwnerRole\\]\\)/);
  assert.match(server, /rubi_update_share_template_audited/);
  assert.match(server, /rubi_update_share_card_config_audited/);
  assert.match(server, /p_actor: context\\.userId/);
  assert.doesNotMatch(shared, /from\\(["']share_templates["']\\)\\.update/);
  assert.doesNotMatch(shared, /from\\(["']share_card_config["']\\)\\.update/);
  assert.match(component, /updateAdminShareTemplate/);
  assert.match(component, /updateAdminShareCardConfig/);

  assert.match(smoke, /RUBI_QA_FORCED_SHARE_AUDIT_FAILURE/);
  assert.match(smoke, /Share template mutation survived audit rollback/);
  assert.match(smoke, /Share card config mutation survived audit rollback/);
  assert.match(smoke, /Owner authorization required/);
  assert.match(smoke, /RUBI_SHARE_CARD_CONFIG_UPDATED/);
  assert.match(hub, /share-studio-atomic-audit\\.test\\.mjs/);
  assert.match(e2e, /rubi-local-share-studio-audit-smoke\\.sql/);
});
