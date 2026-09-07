import { Eye, EyeOff, Archive, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bulkDeleteProducts, bulkUpdateProducts } from "@/lib/supabase/products";
import { toast } from "sonner";
import { useState } from "react";

export function ProductBulkActions({ selectedIds, onComplete, onClearSelection }: { selectedIds:string[]; onComplete:()=>void; onClearSelection:()=>void }) {
 const [loading,setLoading]=useState(false); if(!selectedIds.length)return null;
 const run=async(action:string)=>{if(action==='delete'&&!window.confirm(`Excluir ${selectedIds.length} produtos?`))return;setLoading(true);try{const result=action==='delete'?await bulkDeleteProducts(selectedIds):await bulkUpdateProducts(selectedIds,action==='publish'?{status:'published',is_active:true}:action==='unpublish'?{status:'draft',is_active:false}:{status:'archived'});if(result.success){toast.success(`${result.count??selectedIds.length} produtos processados`);onComplete();onClearSelection();}else toast.error(result.errors?.join(', ')??'Falha na operação');}catch(e:any){toast.error(e.message??'Falha na operação');}finally{setLoading(false);}};
 return <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-glass-border bg-muted/30 p-3 mb-4"><div className="flex items-center gap-3 font-bold text-sm"><span>{selectedIds.length} selecionados</span><Button variant="ghost" size="sm" onClick={onClearSelection}><X className="w-4 h-4"/>Limpar</Button></div><div className="flex flex-wrap gap-2">{loading?<Button disabled size="sm"><Loader2 className="w-4 h-4 animate-spin"/>Processando...</Button>:<><Button variant="outline" size="sm" onClick={()=>run('publish')}><Eye className="w-4 h-4"/>Publicar</Button><Button variant="outline" size="sm" onClick={()=>run('unpublish')}><EyeOff className="w-4 h-4"/>Despublicar</Button><Button variant="outline" size="sm" onClick={()=>run('archive')}><Archive className="w-4 h-4"/>Arquivar</Button><Button variant="destructive" size="sm" onClick={()=>run('delete')}><Trash2 className="w-4 h-4"/>Excluir</Button></>}</div></div>;
}
