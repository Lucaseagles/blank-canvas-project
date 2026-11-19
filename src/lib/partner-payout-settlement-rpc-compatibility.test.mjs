import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./partner-payout-settlement-admin.functions.ts", import.meta.url), "utf8");

test("partial payout reports an explicit compatibility block for missing RPC signatures", () => {
  assert.match(source, /error\.code === "PGRST202" \|\| error\.code === "42883"/);
  assert.match(source, /Repasse parcial temporariamente indisponível/);
  assert.match(source, /Nenhum repasse foi registrado/);
});

test("partial payout never falls back to the legacy UUID-array RPC", () => {
  assert.match(source, /p_allocations: data\.allocations/);
  assert.match(source, /p_actor: context\.userId/);
  assert.match(source, /Never fall back to it/);
  assert.doesNotMatch(source, /p_sale_ids:/);
});
