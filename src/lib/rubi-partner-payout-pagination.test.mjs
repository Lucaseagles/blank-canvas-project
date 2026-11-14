import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("./partner-payout-settlement-admin.functions.ts", import.meta.url),"utf8");
test("payout candidate list never silently truncates at 500 and uses batched IDs",()=>{
 assert.match(source,/fetchAllFinancialRows/);
 assert.equal((source.match(/fetchFinancialRowsByIds\(/g)||[]).length,2);
 assert.doesNotMatch(source,/\.limit\(500\)/);
 assert.match(source,/\.eq\("commercial_profile_id", data\.commercial_profile_id\)/);
 assert.match(source,/\.order\("id", \{ ascending: true \}\)/);
 assert.match(source,/requireOwnerRole/);
});
