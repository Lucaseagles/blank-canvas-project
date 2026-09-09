import { supabase as sb } from "@/integrations/supabase/client";
const supabase = sb as any;
export type NotificationTemplate={id:string;type:string;template:string;is_active:boolean;updated_at:string};
export async function listNotificationTemplates(){const {data,error}=await supabase.from("notification_templates").select("id,type,template,is_active,updated_at").order("type");if(error)throw error;return (data??[]) as NotificationTemplate[];}
export async function updateNotificationTemplate(id:string,values:Partial<Pick<NotificationTemplate,"template"|"is_active">>){if(!id)throw new Error("Template id required");if(values.template!==undefined&&(!values.template.trim()||values.template.length>5000))throw new Error("Invalid template");const {error}=await supabase.from("notification_templates").update({...values,updated_at:new Date().toISOString()}).eq("id",id);if(error)throw error;}
export async function listNotificationHistory(limit=100){const safeLimit=Math.min(Math.max(Math.trunc(limit)||100,1),200);const {data,error}=await supabase.from("notification_logs").select("id,type,status,sent_at").order("sent_at",{ascending:false}).limit(safeLimit);if(error)throw error;return data??[];}
