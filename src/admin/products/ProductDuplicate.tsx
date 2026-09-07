import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { duplicateProduct } from "@/lib/supabase/products";
import { toast } from "sonner";
import { useState } from "react";

export function ProductDuplicate({id,onComplete}:{id:string;onComplete:()=>void}){const[loading,setLoading]=useState(false);return <Button variant="ghost" size="icon" disabled={loading} title="Duplicar" onClick={async()=>{if(!window.confirm('Duplicar este produto?'))return;setLoading(true);try{const r=await duplicateProduct(id);if(!r.success)throw Error(r.error);toast.success('Produto duplicado como rascunho');onComplete()}catch(e:any){toast.error(e.message??'Erro ao duplicar')}finally{setLoading(false)}}}><Copy className={loading?'animate-pulse':''}/></Button>}
