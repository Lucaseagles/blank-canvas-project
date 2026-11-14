import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("./compliance.functions.ts",import.meta.url),"utf8");
test("affiliate destination parses hostname rather than URL substrings",()=>{
 assert.match(source,/new URL\(raw\)/);
 assert.match(source,/hostname === domain \|\| hostname\.endsWith\("\." \+ domain\)/);
 assert.match(source,/destination\.protocol !== "https:"/);
 assert.match(source,/destination\.username \|\| destination\.password/);
 assert.match(source,/destination\.port/);
 assert.match(source,/violations\.push\(\.\.\.validateExternalAffiliateDestination\(url\)\.violations\)/);
 assert.doesNotMatch(source,/url\.includes\(domain\)/);
});
