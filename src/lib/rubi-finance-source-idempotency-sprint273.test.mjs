import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  new URL("../../supabase/migrations/20261118070000_rubi_finance_source_idempotency_sprint273.sql", import.meta.url),
  "utf8",
);

test("canonical finance obligations are idempotent per source, type and scope", () => {
  assert.match(migration, /create unique index rubi_finance_obligations_source_identity_uidx/);
  assert.match(migration, /\(source_kind, source_id, obligation_type, scope_type\)/);
  assert.match(migration, /where source_id is not null/);
});

test("canonical finance entries are idempotent per source, entry type and direction", () => {
  assert.match(migration, /create unique index rubi_finance_entries_source_identity_uidx/);
  assert.match(migration, /\(source_kind, source_id, entry_type, direction\)/);
  assert.match(migration, /where source_id is not null/);
});

test("the adapter contract links partner commission obligations to the existing sale id", () => {
  assert.match(migration, /source_kind=partner_sale/);
  assert.match(migration, /hub_partner_confirmed_sales\.id/);
  assert.doesNotMatch(migration, /insert into|update public\.|delete from/i);
});
