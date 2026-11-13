import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {canProposeMasterCandidate} from "./rubi-master-candidates.ts";

test("Only syntactically valid emails can be registered as future candidates",()=>{
 assert.equal(canProposeMasterCandidate("futuro@example.com"),true);
 assert.equal(canProposeMasterCandidate("not-an-email"),false);
 const functions=readFileSync(new URL("./rubi-master-candidates.functions.ts",import.meta.url),"utf8");
 assert.match(functions,/data.email===context.userEmail/);
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
