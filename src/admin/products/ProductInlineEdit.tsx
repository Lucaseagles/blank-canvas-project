import { Check, X, Pencil, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProduct } from "@/lib/supabase/products";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function ProductInlineEdit({productId,field,value,type='text',options,onUpdate}:{productId:string;field:string;value:any;type?:'text'|'number'|'select';options?:{value:string;label:string}[];onUpdate:(v:any)=>void}){
 const [editing,setEditing]=useState(false);const [draft,setDraft]=useState(value);const [saving,setSaving]=useState(false);const ref=useRef<HTMLInputElement>(null);useEffect(()=>{if(editing)ref.current?.focus()},[editing]);
 const cancel=()=>{setDraft(value);setEditing(false)};const save=async()=>{setSaving(true);try{const payload:any={[field]:type==='number'?Number(draft):draft};const result=await updateProduct(productId,payload);if(!result.success)throw Error(result.error);onUpdate(draft);setEditing(false);toast.success('Alteração salva');}catch(e:any){toast.error(e.message??'Erro ao salvar')}finally{setSaving(false)}};
 if(!editing)return <button className="inline-flex items-center gap-1 text-left hover:bg-muted/40 rounded px-2 py-1" onClick={()=>setEditing(true)}><span>{value||'—'}</span><Pencil className="w-3 h-3 opacity-40"/></button>;
 return <div className="flex items-center gap-1">{type==='select'?<Select value={draft} onValueChange={setDraft}><SelectTrigger className="h-8 min-w-36"><SelectValue/></SelectTrigger><SelectContent>{options?.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>:<Input ref={ref} type={type} value={draft??''} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')save();if(e.key==='Escape')cancel()}} className="h-8 w-28"/>}<Button size="icon" variant="ghost" className="h-8 w-8" onClick={save} disabled={saving}>{saving?<Loader2 className="w-3 h-3 animate-spin"/>:<Check className="w-3 h-3"/>}</Button><Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancel}><X className="w-3 h-3"/></Button></div>;
}
