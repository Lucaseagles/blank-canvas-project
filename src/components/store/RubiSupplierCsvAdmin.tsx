import {useState} from "react";
import {useMutation,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {parseRubiSupplierCsv,RUBI_CSV_TEMPLATE} from "@/lib/rubi-supplier-csv";
import {importRubiSupplierDraftsAdmin} from "@/lib/rubi-supplier-csv.functions";

export function RubiSupplierCsvAdmin({suppliers}:{suppliers:Array<{id:string;name:string}>}){
 const [supplierId,setSupplierId]=useState("");
 const [csv,setCsv]=useState(RUBI_CSV_TEMPLATE);
 const [confirmed,setConfirmed]=useState(false);
 const importDrafts=useServerFn(importRubiSupplierDraftsAdmin);
 const client=useQueryClient();
 const mutation=useMutation({
  mutationFn:()=>importDrafts({data:{supplierId,csv}}),
  onSuccess:result=>{
   toast.success(`${result.created} produtos criados como rascunhos, sem checkout aprovado.`);
   setCsv(RUBI_CSV_TEMPLATE);setConfirmed(false);
   void client.invalidateQueries({queryKey:["admin-hub-catalog"]});
   void client.invalidateQueries({queryKey:["rubi-launch-readiness"]});
  },
  onError:(error:Error)=>toast.error(error.message),
 });
 let preview:ReturnType<typeof parseRubiSupplierCsv>|null=null,error="";
 try{preview=parseRubiSupplierCsv(csv);}catch(e){error=e instanceof Error?e.message:"CSV inválido";}
 const invalid=preview?.rows.filter(row=>row.errors.length)??[];
 const canImport=!!supplierId&&!!preview?.rows.length&&!preview.headerErrors.length&&!invalid.length&&confirmed&&!mutation.isPending;
 return <section className="space-y-4 rounded-3xl border border-primary/25 bg-card p-6" aria-label="Importação de produtos por CSV">
  <header className="space-y-2">
   <p className="text-xs font-black uppercase tracking-widest text-primary">RUBI · Preparação de lançamentos</p>
   <h2 className="text-2xl font-black">Importar produtos em lote — somente rascunhos</h2>
   <p className="text-sm text-muted-foreground">Cole um CSV com até 50 produtos autorizados. Todos serão criados desativados, sem checkout e sem oferta publicada. Use preços reais verificados e revisão manual antes de ativar cada produto.</p>
  </header>
  <label className="block space-y-1 text-sm font-semibold">Fornecedor cadastrado
   <select className="w-full rounded-lg border bg-background p-2" value={supplierId} onChange={e=>{setSupplierId(e.target.value);setConfirmed(false);}}>
    <option value="">Selecione o fornecedor</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
   </select>
  </label>
  <label className="block space-y-1 text-sm font-semibold">CSV (separador vírgula, preços com ponto decimal, sem R$)
   <textarea className="w-full rounded-lg border bg-background p-3 font-mono text-xs" rows={7} value={csv} onChange={e=>{setCsv(e.target.value);setConfirmed(false);}}/>
  </label>
  <p className="text-xs text-muted-foreground">Colunas: title, description, category, sku, retail_price, supplier_cost, image_url. Se um campo tiver vírgula, coloque-o entre aspas duplas.</p>
  {error&&<p role="alert" className="text-destructive text-sm">{error}</p>}
  {preview?.headerErrors.map(x=><p role="alert" key={x} className="text-sm text-destructive">{x}</p>)}
  {preview&&!preview.headerErrors.length&&<div className="space-y-2">
   <p className="font-semibold text-sm">Prévia: {preview.rows.length} linhas · {invalid.length} inválidas</p>
   <div className="max-h-60 overflow-auto rounded-lg border">
    <table className="w-full text-left text-xs"><thead className="bg-muted/40"><tr><th className="p-2">Linha</th><th className="p-2">Produto</th><th className="p-2">Situação</th></tr></thead><tbody>
     {preview.rows.map(row=><tr key={row.line} className="border-t">
      <td className="p-2">{row.line}</td><td className="p-2">{row.draft?.title??"Corrigir dados"}</td>
      <td className="p-2">{row.errors.length?row.errors.join(" · "):"Rascunho válido"}</td>
     </tr>)}
    </tbody></table>
   </div>
  </div>}
  <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>
   <span>Confirmo que tenho autorização e conferi a origem dos produtos, custos, preços e direitos de uso. Entendo que não haverá publicação nem confirmação de checkout.</span>
  </label>
  <Button disabled={!canImport} onClick={()=>{if(window.confirm(`Criar ${preview?.rows.length??0} rascunhos privados sem ativação?`))mutation.mutate();}}>
   {mutation.isPending?"Importando...":"Importar rascunhos"}
  </Button>
 </section>;
}
