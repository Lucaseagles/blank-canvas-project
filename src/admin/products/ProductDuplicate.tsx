import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { duplicateCatalogProduct } from "@/lib/product-lifecycle.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useState } from "react";

export function ProductDuplicate({id,onComplete}:{id:string;onComplete:()=>void}){const duplicate=useServerFn(duplicateCatalogProduct);const[loading,setLoading]=useState(false);return <Button variant="ghost" size="icon" disabled={loading} title="Duplicar" onClick={async()=>{if(!window.confirm('Duplicar este produto?'))return;setLoading(true);try{const r=await duplicate({data:{id}});if(!r.id||r.status!=="draft")throw Error("A cópia não foi criada como rascunho.");toast.success('Produto duplicado como rascunho');onComplete()}catch(e:any){toast.error(e.message??'Erro ao duplicar')}finally{setLoading(false)}}}><Copy className={loading?'animate-pulse':''}/></Button>}
