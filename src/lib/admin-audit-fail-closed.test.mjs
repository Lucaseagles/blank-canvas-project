import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./admin-audit.functions.ts", import.meta.url), "utf8");
const checklist = await readFile(new URL("../admin/audit/AuditChecklist.tsx", import.meta.url), "utf8");

test("admin audit is Owner-only and fails closed when its audit event cannot be persisted", () => {
  assert.match(source, /\.middleware\(\[requireOwnerRole\]\)/);
  assert.match(source, /if \(logError\)\s*\{[\s\S]*?throw new Error\(/);
  assert.match(source, /return \{ items, stats, checkedAt, auditLogWritten: true \}/);
  assert.doesNotMatch(source, /auditLogWritten:\s*!logError/);
  assert.doesNotMatch(source, /auditLogError:\s*logError\?\.message/);
});
