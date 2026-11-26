import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");

test("creator studio requires a real authenticated, approved partner profile",()=>{
 const server=read("./rubi-partner-creator-studio.functions.ts");
 assert.match(server,/supabaseAdmin\.auth\.getUser/);
 assert.match(server,/eq\("audience","partner"\)/);
 assert.match(server,/eq\("status","approved"\)/);
 assert.match(server,/Somente parceiros aprovados/);
});

test("native uploads use a private bucket, bounded MIME types, size and user-scoped paths",()=>{
 const server=read("./rubi-partner-creator-studio.functions.ts");
 assert.match(server,/VIDEO_MAX_BYTES=50\*1024\*1024/);
 assert.match(server,/video\/mp4/);
 assert.match(server,/video\/webm/);
 assert.match(server,/public:false/);
 assert.match(server,/createSignedUploadUrl/);
 assert.ok(server.includes("partner/")&&server.includes("${userId}"));
 assert.match(server,/startsWith/);
});

test("social content accepts only HTTPS links from explicitly supported platforms",()=>{
 const server=read("./rubi-partner-creator-studio.functions.ts");
 assert.match(server,/url\.protocol!=="https:"/);
 assert.match(server,/url\.username\|\|url\.password\|\|url\.port/);
 assert.match(server,/PLATFORM_HOSTS/);
 assert.match(server,/parseSocialUrl/);
});

test("partner submissions are private, bounded and never auto-published",()=>{
 const server=read("./rubi-partner-creator-studio.functions.ts");
 const migration=read("../../supabase/migrations/20261126130000_rubi_partner_creator_submissions.sql");
 assert.match(server,/count\?\?0/);
 assert.match(server,/status:"pending"/);
 assert.match(migration,/enable row level security/);
 assert.match(migration,/revoke all on public\.rubi_partner_creator_submissions from public, anon, authenticated/);
 assert.match(migration,/status text not null default 'pending'/);
 assert.ok(migration.includes("null,null,'draft',submission.storage_path"));
 assert.match(migration,/RUBI_PARTNER_CREATOR_SUBMISSION_APPROVED/);
});

test("Owner moderation is audited and approval creates a draft, not a public video",()=>{
 const server=read("./rubi-partner-creator-studio.functions.ts");
 const migration=read("../../supabase/migrations/20261126130000_rubi_partner_creator_submissions.sql");
 assert.match(server,/middleware\(\[requireOwnerRole\]\)/);
 assert.match(server,/rubi_review_partner_creator_submission/);
 assert.match(migration,/Owner authorization required/);
 assert.match(migration,/for update/);
 assert.ok(migration.includes("null,null,'draft',submission.storage_path"));
 assert.match(migration,/admin_audit_log/);
});

test("partner portal and Owner video workspace expose separate creator and moderation surfaces",()=>{
 const portal=read("../routes/partner/portal.tsx");
 const admin=read("../routes/admin/videos.tsx");
 assert.match(portal,/<RubiPartnerCreatorStudio \/>/);
 assert.match(admin,/<RubiPartnerCreatorReviewQueue \/>/);
});
