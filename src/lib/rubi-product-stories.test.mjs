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
 assert.equal(validRubiStoryMediaUrl("https://cdn.example.org/video.webm","video"),true);
 assert.equal(validRubiStoryMediaUrl("https://cdn.example.org/video.mov","video"),false);
 assert.equal(validRubiStoryMediaUrl("https://www.tiktok.com/watch/123","video"),false);
 assert.equal(validRubiStoryMediaUrl("http://cdn.example.org/video.mp4","video"),false);
 assert.equal(validRubiStoryMediaUrl("https://user:pass@cdn.example.org/video.mp4","video"),false);
 assert.equal(validRubiStoryMediaUrl("https://cdn.example.org/video.mp4#frag","video"),false);
 assert.equal(validRubiStoryMediaUrl("https://cdn.example.org/poster.webp","poster"),true);
 assert.equal(validRubiStoryMediaUrl("https://cdn.example.org/poster.gif","poster"),false);
 assert.equal(validRubiStoryMediaUrl("https://cdn.example.org/poster.webp#frag","poster"),false);
 const s={...emptyRubiProductStory("p"),title:"História real",description:"Demonstração real do uso autorizado do produto.",video_url:"https://cdn.example.org/video.webm",poster_url:"https://cdn.example.org/poster.webp",evidence_notes:"Ficha do fornecedor autorizada",rights_confirmed:true};
 assert.equal(canApproveRubiProductStory(s),true);
});
test("Story approval fails closed for missing rights, evidence, description or invalid media",()=>{
 const valid={...emptyRubiProductStory("p"),title:"História real",description:"Demonstração real do uso autorizado do produto.",video_url:"https://cdn.example.org/video.mp4",evidence_notes:"Ficha do fornecedor autorizada",rights_confirmed:true};
 assert.equal(canApproveRubiProductStory(valid),true);
 assert.equal(canApproveRubiProductStory({...valid,rights_confirmed:false}),false);
 assert.equal(canApproveRubiProductStory({...valid,evidence_notes:"curto"}),false);
 assert.equal(canApproveRubiProductStory({...valid,description:"curta"}),false);
 assert.equal(canApproveRubiProductStory({...valid,title:"ab"}),false);
 assert.equal(canApproveRubiProductStory({...valid,video_url:"http://cdn.example.org/video.mp4"}),false);
 assert.equal(canApproveRubiProductStory({...valid,poster_url:"https://cdn.example.org/poster.gif"}),false);
});
test("Story cannot remain public after linked movement changes revision or status",()=>{
 const story={movement_id:"m1",approved_movement_revision:4,status:"approved",rights_confirmed:true};
 const movement={id:"m1",product_id:"p1",status:"review",audience:"consumer",revision:4};
 assert.equal(canServeVersionedRubiStory(story,movement,"p1"),true);
 assert.equal(canServeVersionedRubiStory(story,{...movement,revision:5},"p1"),false);
 assert.equal(canServeVersionedRubiStory(story,{...movement,status:"draft"},"p1"),false);
 assert.equal(canServeVersionedRubiStory(story,{...movement,status:"published"},"p1"),false);
 assert.equal(canServeVersionedRubiStory(story,movement,"p2"),false);
 assert.equal(canServeVersionedRubiStory(story,{...movement,audience:"partner"},"p1"),false);
 assert.equal(canServeVersionedRubiStory({...story,rights_confirmed:false},movement,"p1"),false);
 assert.equal(canServeVersionedRubiStory({...story,movement_id:null},movement,"p1"),false);
 assert.equal(canServeVersionedRubiStory({...story,approved_movement_revision:null},movement,"p1"),false);
 assert.equal(canServeVersionedRubiStory({...story,status:"draft"},movement,"p1"),false);
});

test("atomic approval RPC rechecks active product, supplier and exact verified checkout while holding row locks",()=>{
 const migration=readFileSync(new URL("../../supabase/migrations/20261124020000_sprint306_atomic_story_checkout_eligibility.sql",import.meta.url),"utf8");
 assert.match(migration,/p\.active=true/);
 assert.match(migration,/p\.checkout_verified=true/);
 assert.match(migration,/p\.retail_price>0/);
 assert.match(migration,/supplier\.active=true/);
 assert.match(migration,/supplier\.checkout_host is not null/);
 assert.match(migration,/p\.checkout_url ~ \('\^https:\/\/' \|\| replace\(supplier\.checkout_host,'\\.','\[\\.\]'\)/);
 assert.match(migration,/for share of p,supplier/);
 assert.match(migration,/for share/);
 assert.match(migration,/strpos\(p\.checkout_url,chr\(92\)\)=0/);
 assert.match(migration,/revoke all on function public\.rubi_set_story_approval_audited[\s\S]*from public,anon,authenticated/);
 assert.match(migration,/grant execute on function public\.rubi_set_story_approval_audited[\s\S]*to service_role/);
});
