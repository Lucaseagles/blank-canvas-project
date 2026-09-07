import { supabase } from "./client";
export type NotificationTemplate={id:string;type:string;template:string;is_active:boolean;updated_at:string};
export async function listNotificationTemplates(){const {data,error}=await supabase.from("notification_templates").select("*").order("type");if(error)throw error;return (data??[]) as NotificationTemplate[];}
export async function updateNotificationTemplate(id:string,values:Partial<Pick<NotificationTemplate,"template"|"is_active">>){const {error}=await supabase.from("notification_templates").update({...values,updated_at:new Date().toISOString()}).eq("id",id);if(error)throw error;}
export async function listNotificationHistory(limit=100){const {data,error}=await supabase.from("notification_logs").select("*").order("sent_at",{ascending:false}).limit(limit);if(error)throw error;return data??[];}
