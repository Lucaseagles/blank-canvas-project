import { supabase as sb } from "@/integrations/supabase/client";
const supabase = sb as any;
export type NotificationTemplate={id:string;type:string;template:string;is_active:boolean;updated_at:string};
export async function listNotificationTemplates(){const {data,error}=await supabase.from("notification_templates").select("id,type,template,is_active,updated_at").order("type");if(error)throw error;return (data??[]) as NotificationTemplate[];}
export async function listNotificationHistory(limit=100){const safeLimit=Math.min(Math.max(Math.trunc(limit)||100,1),200);const {data,error}=await supabase.from("notification_logs").select("id,type,status,sent_at").order("sent_at",{ascending:false}).limit(safeLimit);if(error)throw error;return data??[];}
