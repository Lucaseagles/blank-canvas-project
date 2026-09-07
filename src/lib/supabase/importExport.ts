import { supabase } from "@/integrations/supabase/client";

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function exportProductsToCSV(filters?: { status?: string; category_id?: string }) {
  let query = supabase.from("products").select("id,title,description,current_price,previous_price,discount,rating,review_count,status,affiliate_url,free_shipping,categories:category_id(name),marketplaces:marketplace_id(name)");
  if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters?.category_id && filters.category_id !== "all") query = query.eq("category_id", filters.category_id);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  const headers = ["id","name","description","price","old_price","discount","rating","review_count","status","affiliate_url","shipping","category","marketplace"];
  const rows = (data ?? []).map((p: any) => [p.id,p.title,p.description,p.current_price,p.previous_price,p.discount,p.rating,p.review_count,p.status,p.affiliate_url,p.free_shipping ? "free" : "paid",p.categories?.name ?? "",p.marketplaces?.name ?? ""]);
  return [headers, ...rows].map(r => r.map(cell).join(",")).join("\r\n");
}

function parseCSV(text: string) {
  const rows: string[][] = []; let row: string[] = []; let value = ""; let quoted = false;
  for (let i=0;i<text.length;i++) { const c=text[i]; if(c==='"'){ if(quoted && text[i+1]==='"'){value+='"';i++;} else quoted=!quoted; } else if(c===','&&!quoted){row.push(value);value="";} else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(x=>x.trim()))rows.push(row);row=[];value="";} else value+=c; }
  if(value||row.length){row.push(value);if(row.some(x=>x.trim()))rows.push(row);} return rows;
}

export async function importProductsFromCSV(csvContent: string) {
  const rows=parseCSV(csvContent); if(rows.length<2)return{success:false,imported:0,errors:[{row:0,error:"CSV vazio ou inválido"}]};
  const headers=rows[0].map(h=>h.trim().toLowerCase()); const required=["name","price","affiliate_url"];
  for(const f of required)if(!headers.includes(f))return{success:false,imported:0,errors:[{row:0,error:`Campo "${f}" não encontrado no CSV`}]};
  const idx=(n:string)=>headers.indexOf(n); const errors:{row:number;error:string}[]=[]; let imported=0;
  const {data:categories}=await supabase.from("categories").select("id,name"); const {data:marketplaces}=await supabase.from("marketplaces").select("id,name");
  for(let i=1;i<rows.length;i++){const r=rows[i];try{const name=r[idx("name")]?.trim();const price=Number(String(r[idx("price")]??"").replace(",","."));const affiliate_url=r[idx("affiliate_url")]?.trim();if(!name)throw Error("Nome é obrigatório");if(!(price>0))throw Error("Preço deve ser maior que zero");if(!affiliate_url)throw Error("Link de afiliado é obrigatório");const cn=idx("category")>=0?r[idx("category")].trim():"";const mn=idx("marketplace")>=0?r[idx("marketplace")].trim():"";const category=categories?.find(c=>c.name.toLowerCase()===cn.toLowerCase());const marketplace=marketplaces?.find(m=>m.name.toLowerCase()===mn.toLowerCase());if(cn&&!category)throw Error(`Categoria "${cn}" não encontrada`);if(mn&&!marketplace)throw Error(`Marketplace "${mn}" não encontrado`);const status=idx("status")>=0?r[idx("status")]:"draft";const validStatus=["draft","published","archived","active"].includes(status)?status:"draft";const {error}=await supabase.from("products").insert({title:name,description:idx("description")>=0?r[idx("description")]||null:null,category_id:category?.id??null,marketplace_id:marketplace?.id??null,current_price:price,previous_price:idx("old_price")>=0&&r[idx("old_price")]?Number(r[idx("old_price")].replace(",",".")):null,discount:idx("discount")>=0&&r[idx("discount")]?Number(r[idx("discount")]):null,rating:idx("rating")>=0&&r[idx("rating")]?Number(r[idx("rating")]):null,review_count:idx("review_count")>=0&&r[idx("review_count")]?Number(r[idx("review_count")]):null,status:validStatus,affiliate_url,free_shipping:idx("shipping")>=0&&r[idx("shipping")].toLowerCase()==="free",images:[],is_active:validStatus==="published"});if(error)throw error;imported++;}catch(e:any){errors.push({row:i+1,error:e.message||"Erro ao importar"});}}
  return{success:errors.length===0,imported,errors};
}
