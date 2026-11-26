import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("administrative audit execution uses POST because it writes an audit event", () => {
  const server = read("./admin-audit.functions.ts");
  assert.match(server, /runAdminAudit = createServerFn\(\{ method: "POST" \}\)/);
  assert.match(server, /ADMIN_AUDIT_RUN/);
  assert.match(server, /if \(logError\)/);
});

test("audit checklist uses an explicit mutation and does not retry the write automatically", () => {
  const ui = read("../admin/audit/AuditChecklist.tsx");
  assert.match(ui, /useMutation/);
  assert.match(ui, /retry: false/);
  assert.match(ui, /initialRunStarted\.current/);
  assert.match(ui, /onClick=\{\(\) => mutate\(\)\}/);
  assert.doesNotMatch(ui, /useQuery|refetch\(\)|isLoading/);
});
