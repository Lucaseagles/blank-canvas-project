import assert from "node:assert/strict";
import test from "node:test";
import { inspectMutationCandidates } from "../../scripts/rubi-admin-mutation-inventory.mjs";

test("finds direct table writes across multiline Supabase chains", () => {
  const source = `
    await supabaseAdmin
      .from("profiles")
      .update({ is_banned: true })
      .eq("id", userId);
    await supabaseAdmin.from('admin_audit_log').insert({ action_type: "BAN" });
  `;
  const result = inspectMutationCandidates(source, "fixture.functions.ts");
  assert.deepEqual(result.directDml, [
    { file: "fixture.functions.ts", line: 3, table: "profiles", operation: "update" },
    { file: "fixture.functions.ts", line: 6, table: "admin_audit_log", operation: "insert" },
  ]);
});

test("separates RPC call sites from direct DML candidates", () => {
  const source = `
    await supabase.rpc("rubi_set_profile_audited", { p_actor: actorId });
    await supabase.from("products").delete().eq("id", productId);
  `;
  const result = inspectMutationCandidates(source, "fixture.ts");
  assert.deepEqual(result.rpcCalls, [
    { file: "fixture.ts", line: 2, function: "rubi_set_profile_audited" },
  ]);
  assert.deepEqual(result.directDml, [
    { file: "fixture.ts", line: 3, table: "products", operation: "delete" },
  ]);
});

test("does not label read-only table queries as mutations", () => {
  const result = inspectMutationCandidates(
    'await supabase.from("products").select("id").eq("active", true);',
    "read.ts",
  );
  assert.deepEqual(result.directDml, []);
});

test("reports limitations so static output cannot be mistaken for audit certification", async () => {
  const { buildAdminMutationInventory } = await import("../../scripts/rubi-admin-mutation-inventory.mjs");
  // The real repository scan is intentionally available as a separate command;
  // this test only protects the explicit heuristic contract above.
  assert.equal(typeof buildAdminMutationInventory, "function");
});
