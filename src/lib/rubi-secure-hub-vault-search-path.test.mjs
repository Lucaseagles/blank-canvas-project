import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Secure Hub privileged Vault functions use an empty search_path", () => {
  const sql = read("../../supabase/migrations/20261117233500_rubi_secure_hub_vault_search_path.sql");
  const functions = ["mark_integration_check", "set_integration_secret", "get_integration_secret"];
  for (const name of functions) {
    const start = sql.indexOf(`create or replace function public.${name}`);
    assert.notEqual(start, -1, `missing function ${name}`);
    const end = sql.indexOf("$function$;", start);
    assert.notEqual(end, -1, `missing function terminator ${name}`);
    const body = sql.slice(start, end);
    assert.match(body, /security definer/i);
    assert.match(body, /set search_path = ''/i);
  }
});

test("Vault secret functions qualify schemas and restrict execution to service_role", () => {
  const sql = read("../../supabase/migrations/20261117233500_rubi_secure_hub_vault_search_path.sql");
  assert.ok(sql.includes("vault.create_secret"));
  assert.ok(sql.includes("vault.update_secret"));
  assert.ok(sql.includes("vault.decrypted_secrets"));
  for (const signature of [
    "public.mark_integration_check(text, text, text)",
    "public.set_integration_secret(text, text, text)",
    "public.get_integration_secret(text, text)",
  ]) {
    assert.ok(sql.includes(`revoke all on function ${signature} from public, anon, authenticated`));
    assert.ok(sql.includes(`grant execute on function ${signature} to service_role`));
  }
});
