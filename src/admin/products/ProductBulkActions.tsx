import { Eye, EyeOff, Archive, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bulkSetProductStatus } from "@/lib/admin-product-operations.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useState } from "react";

export function ProductBulkActions({ selectedIds, onComplete, onClearSelection }: { selectedIds:string[]; onComplete:()=>void; onClearSelection:()=>void }) {
 const updateStatus=useServerFn(bulkSetProductStatus);
 const [loading,setLoading]=useState(false); if(!selectedIds.length)return null;
 const run=async(action:string)=>{if(action==='delete'&&!window.confirm(`Excluir ${selectedIds.length} produtos?`))return;setLoading(true);try{if(action==='delete')throw Error('Exclusão permanente em lote desativada. Use arquivamento para preservar histórico e relacionamentos.');const status=action==='publish'?'published' as const:action==='unpublish'?'draft' as const:'archived' as const;const result=await updateStatus({data:{ids:selectedIds,status}});toast.success(`${result.count} produtos processados`);onComplete();onClearSelection();}catch(e:any){toast.error(e.message??'Falha na operação');}finally{setLoading(false);}};
 return <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-glass-border bg-muted/30 p-3 mb-4"><div className="flex items-center gap-3 font-bold text-sm"><span>{selectedIds.length} selecionados</span><Button variant="ghost" size="sm" onClick={onClearSelection}><X className="w-4 h-4"/>Limpar</Button></div><div className="flex flex-wrap gap-2">{loading?<Button disabled size="sm"><Loader2 className="w-4 h-4 animate-spin"/>Processando...</Button>:<><Button variant="outline" size="sm" onClick={()=>run('publish')}><Eye className="w-4 h-4"/>Publicar</Button><Button variant="outline" size="sm" onClick={()=>run('unpublish')}><EyeOff className="w-4 h-4"/>Despublicar</Button><Button variant="outline" size="sm" onClick={()=>run('archive')}><Archive className="w-4 h-4"/>Arquivar</Button></>}</div></div>;
}
