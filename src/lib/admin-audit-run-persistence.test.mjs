import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const server = read("./admin-audit.functions.ts");
const ui = read("../admin/audit/AuditChecklist.tsx");

test("admin audit response exposes persistence failure without hiding the diagnostic", () => {
  assert.match(server, /auditLogWritten:\s*!logError/);
  assert.match(server, /auditLogError:\s*logError\?\.message\s*\?\?\s*null/);
});

test("audit checklist visibly warns when the run was not persisted", () => {
  assert.match(ui, /data\s*&&\s*!data\.auditLogWritten/);
  assert.match(ui, /role="alert"/);
  assert.match(ui, /não foi confirmado/);
  assert.match(ui, /data\.auditLogError/);
  assert.match(ui, /não devem ser tratados como uma execução auditada/);
});

test("audit checklist confirms successful persistence without overstating audit coverage", () => {
  assert.match(ui, /data\?\.auditLogWritten/);
  assert.match(ui, /Execução registrada no histórico administrativo/);
  assert.match(ui, /não a cobertura auditável de todas as operações/);
});

test("audit checklist exposes request failures separately from persistence failures", () => {
  assert.match(ui, /isError/);
  assert.match(ui, /Não foi possível executar a auditoria/);
});
