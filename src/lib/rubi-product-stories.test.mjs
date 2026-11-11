import test from "node:test";
import assert from "node:assert/strict";
import {emptyRubiProductStory,validRubiStoryMediaUrl,canApproveRubiProductStory} from "./rubi-product-stories.ts";
test("Story starts private, no false claims or approvals",()=>{
 const s=emptyRubiProductStory("p");
 assert.equal(s.status,"draft");
 assert.equal(s.rights_confirmed,false);
 assert.equal(canApproveRubiProductStory(s),false);
 assert.equal(Object.hasOwn(s,"checkout_url"),false);
});
test("Only usable HTTPS video files and licensed claims may be approved",()=>{
 assert.equal(validRubiStoryMediaUrl("https://cdn.example.org/video.mp4","video"),true);
 assert.equal(validRubiStoryMediaUrl("https://www.tiktok.com/watch/123","video"),false);
 assert.equal(validRubiStoryMediaUrl("http://cdn.example.org/video.mp4","video"),false);
 assert.equal(validRubiStoryMediaUrl("https://cdn.example.org/video.mp4#frag","video"),false);
 const s={...emptyRubiProductStory("p"),title:"História real",description:"Demonstração real do uso autorizado do produto.",video_url:"https://cdn.example.org/video.webm",evidence_notes:"Ficha do fornecedor autorizada",rights_confirmed:true};
 assert.equal(canApproveRubiProductStory(s),true);
 assert.equal(canApproveRubiProductStory({...s,rights_confirmed:false}),false);
});
