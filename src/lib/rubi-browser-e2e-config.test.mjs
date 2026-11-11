import test from "node:test";
import assert from "node:assert/strict";
import {browserTarget,RUBI_BROWSER_PATHS,sameOriginNavigation,externalCheckoutNotPermitted} from "../../scripts/rubi-browser-e2e-config.mjs";
import {readFileSync} from "node:fs";

test("Live-browser target must be verified bare HTTPS origin",()=>{
 assert.equal(browserTarget("https://rubi.example.com/"),"https://rubi.example.com");
 for(const invalid of ["http://rubi.example.com/","https://localhost","https://rubi.example.com/admin","https://rubi.example.com:8080"]){
  assert.throws(()=>browserTarget(invalid));
 }
});
test("Public routes cannot navigate to another origin without explicit user action",()=>{
 assert.equal(sameOriginNavigation("https://rubi.example.com","https://rubi.example.com/hub-shop"),true);
 assert.equal(sameOriginNavigation("https://rubi.example.com","https://external.example.com"),false);
 assert.equal(externalCheckoutNotPermitted("https://supplier.example.com/checkout/1"),true);
});
test("Browser smoke covers guest role boundaries and responsive vitrine without purchases",()=>{
 const src=readFileSync(new URL("../../scripts/rubi-browser.e2e.spec.mjs",import.meta.url),"utf8");
 assert.match(src,/width:390/);
 assert.match(src,/width:1366/);
 for(const role of ["store","videos","wholesale","partner","master"])assert.match(src,new RegExp("RUBI_BROWSER_PATHS\\."+role));
 assert.doesNotMatch(src,/signInWithPassword|completePurchase|placeOrder|cardNumber/);
});
