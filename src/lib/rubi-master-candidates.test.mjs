import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {canProposeMasterCandidate,PRIMARY_MASTER_EMAIL} from "./rubi-master-candidates.ts";

test("Only other valid email addresses can be registered as future candidates",()=>{
 assert.equal(canProposeMasterCandidate(PRIMARY_MASTER_EMAIL),false);
 assert.equal(canProposeMasterCandidate("  "+PRIMARY_MASTER_EMAIL.toUpperCase()+" "),false);
 assert.equal(canProposeMasterCandidate("futuro@example.com"),true);
 assert.equal(canProposeMasterCandidate("not-an-email"),false);
});

test("Candidate management never grants an owner role or alters user roles",()=>{
 const functions=readFileSync(new URL("./rubi-master-candidates.functions.ts",import.meta.url),"utf8");
 const migration=readFileSync(new URL("../../supabase/migrations/20261111100000_rubi_master_delegations.sql",import.meta.url),"utf8");
 assert.doesNotMatch(functions,/\.from\(["']user_roles["']\)/);
 assert.doesNotMatch(functions,/\.auth\.admin\./);
 assert.match(migration,/revoke all on public\.rubi_master_delegations from public,\s*anon,\s*authenticated;/);
 assert.match(migration,/status text not null default 'pending'/);
 assert.doesNotMatch(migration,/grant\s+.*owner/i);
});
