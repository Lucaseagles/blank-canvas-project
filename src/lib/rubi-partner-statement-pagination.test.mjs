import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const statement = readFileSync(new URL("./partner-statement.functions.ts", import.meta.url), "utf8");
const pagination = readFileSync(new URL("./financial-pagination.server.ts", import.meta.url), "utf8");

test("partner statement paginates all referral links instead of silently capping at 500", () => {
  assert.match(statement, /fetchAllFinancialRows/);
  assert.match(statement, /\.eq\("commercial_profile_id", profile\.id\)\.order\("id", \{ ascending: true \}\)/);
  assert.doesNotMatch(statement, /\.limit\(500\)/);
  assert.match(pagination, /if \(batch\.length < pageSize\) return rows/);
  assert.match(pagination, /Limite seguro de paginação financeira atingido/);
});

test("partner statement keeps sales pagination explicit and bounded", () => {
  assert.match(statement, /offset: z\.number\(\)\.int\(\)\.min\(0\)\.max\(100000\)/);
  assert.match(statement, /limit: z\.number\(\)\.int\(\)\.min\(1\)\.max\(50\)/);
  assert.match(statement, /\.range\(data\.offset, data\.offset \+ data\.limit - 1\)/);
  assert.match(statement, /\.eq\("user_id", claims\.claims\.sub\)/);
  assert.match(statement, /\.eq\("audience", "partner"\)/);
  assert.match(statement, /\.eq\("status", "approved"\)/);
});
