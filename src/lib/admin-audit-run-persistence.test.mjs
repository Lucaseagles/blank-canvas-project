import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const server = read("./admin-audit.functions.ts");
const ui = read("../admin/audit/AuditChecklist.tsx");

test("admin audit fails closed when its mandatory audit event cannot be persisted", () => {
  assert.match(server, /if \(logError\)\s*\{[\s\S]*?throw new Error\(/);
  assert.match(server, /auditLogWritten: true/);
  assert.doesNotMatch(server, /auditLogWritten:\s*!logError/);
  assert.doesNotMatch(server, /auditLogError:/);
});

test("audit checklist reports request failures and never displays stale query/refetch behavior", () => {
  assert.match(ui, /useMutation/);
  assert.match(ui, /retry: false/);
  assert.match(ui, /role="alert"/);
  assert.match(ui, /Não foi possível executar a auditoria/);
  assert.doesNotMatch(ui, /useQuery|refetch\(\)|isLoading/);
});

test("audit checklist confirms persisted execution without claiming system-wide audit coverage", () => {
  assert.match(ui, /data\?\.auditLogWritten/);
  assert.match(ui, /Execução registrada no histórico administrativo/);
  assert.match(ui, /não a cobertura auditável de todas as operações/);
});
