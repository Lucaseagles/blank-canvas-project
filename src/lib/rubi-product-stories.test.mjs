import test from "node:test";
import assert from "node:assert/strict";
import {emptyRubiProductStory,validRubiStoryMediaUrl,canApproveRubiProductStory,canServeVersionedRubiStory} from "./rubi-product-stories.ts";
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

test("Story cannot remain public after linked movement changes revision or status",()=>{
 const story={movement_id:"m1",approved_movement_revision:4,status:"approved",rights_confirmed:true};
 const movement={id:"m1",product_id:"p1",status:"review",audience:"consumer",revision:4};
 assert.equal(canServeVersionedRubiStory(story,movement,"p1"),true);
 assert.equal(canServeVersionedRubiStory(story,{...movement,revision:5},"p1"),false);
 assert.equal(canServeVersionedRubiStory(story,{...movement,status:"draft"},"p1"),false);
 assert.equal(canServeVersionedRubiStory(story,movement,"p2"),false);
 assert.equal(canServeVersionedRubiStory(story,{...movement,audience:"partner"},"p1"),false);
 assert.equal(canServeVersionedRubiStory({...story,rights_confirmed:false},movement,"p1"),false);
 assert.equal(canServeVersionedRubiStory({...story,movement_id:null},movement,"p1"),false);
 assert.equal(canServeVersionedRubiStory({...story,approved_movement_revision:null},movement,"p1"),false);
});
