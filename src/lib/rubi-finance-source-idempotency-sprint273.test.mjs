import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  new URL("../../supabase/migrations/20261118070000_rubi_finance_source_idempotency_sprint273.sql", import.meta.url),
  "utf8",
);

test("canonical obligations are idempotent per source, type, scope and provider", () => {
  assert.match(migration, /create unique index rubi_finance_obligations_source_identity_uidx/);
  assert.match(migration, /source_kind,[\s\S]*source_id,[\s\S]*obligation_type,[\s\S]*scope_type,[\s\S]*coalesce\(provider_id/);
  assert.match(migration, /where source_id is not null/);
});

test("canonical entries are idempotent per source, entry type, direction and provider", () => {
  assert.match(migration, /create unique index rubi_finance_entries_source_identity_uidx/);
  assert.match(migration, /source_kind,[\s\S]*source_id,[\s\S]*entry_type,[\s\S]*direction,[\s\S]*coalesce\(provider_id/);
  assert.match(migration, /where source_id is not null/);
});

test("partner commission adapter references the existing confirmed sale identity", () => {
  assert.match(migration, /source_kind=partner_sale/);
  assert.match(migration, /hub_partner_confirmed_sales\.id/);
  assert.doesNotMatch(migration, /insert into|update public\.|delete from/i);
});
