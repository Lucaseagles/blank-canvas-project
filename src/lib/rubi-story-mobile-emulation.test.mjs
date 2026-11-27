import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const e2e=readFileSync(new URL("../../scripts/rubi-local-story-offer.e2e.spec.mjs",import.meta.url),"utf8");

test("Story mobile scenarios use mobile browser emulation, touch and high-density viewport",()=>{
  assert.match(e2e,/isMobile:viewport\.name==="mobile"/);
  assert.match(e2e,/hasTouch:viewport\.name==="mobile"/);
  assert.match(e2e,/deviceScaleFactor:viewport\.name==="mobile"\?2:1/);
});

test("approved Story journey applies the same device emulation to Master and consumer contexts",()=>{
  assert.match(e2e,/const masterContext=await browser\.newContext\([\s\S]*?isMobile:viewport\.name==="mobile"[\s\S]*?hasTouch:viewport\.name==="mobile"/);
  assert.match(e2e,/const consumerContext=await browser\.newContext\([\s\S]*?isMobile:viewport\.name==="mobile"[\s\S]*?hasTouch:viewport\.name==="mobile"/);
});

test("desktop and mobile viewports remain explicitly represented",()=>{
  assert.match(e2e,/name:"mobile",width:390,height:844/);
  assert.match(e2e,/name:"desktop",width:1366,height:768/);
});
