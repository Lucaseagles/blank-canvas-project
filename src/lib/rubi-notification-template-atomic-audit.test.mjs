import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("notification template edits are Owner-only and audited in one transaction",()=>{
 const server=read("./notification-intelligence.functions.ts");
 const client=read("./supabase/notifications.ts");
 const ui=read("../admin/notifications/NotificationTemplates.tsx");
 const sql=read("../../supabase/migrations/20261115210000_rubi_notification_template_atomic_audit.sql");
 assert.match(server,/requireOwnerRole/);
 assert.match(ui,/useServerFn\(updateNotificationTemplateAdmin\)/);
 assert.equal((ui.match(/await updateTemplate\(\{data:/g)??[]).length,2);
 assert.doesNotMatch(ui,/await updateNotificationTemplate\(/);
 assert.match(server,/rpc\("rubi_update_notification_template_audited"/);
 assert.match(server,/p_actor: context\.userId/);
 assert.doesNotMatch(server,/\.from\("notification_templates"\)\.update/);
 assert.doesNotMatch(client,/updateNotificationTemplate|\.from\("notification_templates"\)\.update/);
 assert.match(sql,/security invoker set search_path=''/);
 assert.match(sql,/r\.role='owner'/);
 assert.match(sql,/for update/);
 assert.match(sql,/insert into public\.admin_audit_log/);
 assert.match(sql,/revoke insert,update,delete on public\.notification_templates/);
 assert.match(sql,/from public,anon,authenticated/);
 assert.match(sql,/to service_role/);
 const audit=sql.slice(
  sql.indexOf("insert into public.admin_audit_log"),
  sql.indexOf(" return jsonb_build_object",sql.indexOf("insert into public.admin_audit_log"))
 );
 assert.match(audit,/length\(new_row\.template\)/);
 assert.doesNotMatch(audit,/'template'\s*,\s*new_row\.template/);
 assert.doesNotMatch(sql,/security definer/i);
});
