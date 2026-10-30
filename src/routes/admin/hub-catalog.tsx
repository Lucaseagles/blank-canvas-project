import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getHubCatalogAdmin,saveHubProductAdmin } from "@/lib/hub-catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
export const Route=createFileRoute("/admin/hub-catalog")({component:HubCatalogAdmin});
function HubCatalogAdmin(){
 const queryClient=useQueryClient();const load=useServerFn(getHubCatalogAdmin);const save=useServerFn(saveHubProductAdmin);
 const query=useQuery({queryKey:["admin-hub-catalog"],queryFn:()=>load()});
 const [form,setForm]=useState({title:"",description:"",image_url:"",category:"",sku:"",supplier_id:"",retail_price:"",supplier_cost:"",b2b_base_price:"",min_b2b_quantity:"1",active:false});
 const mutation=useMutation({mutationFn:()=>save({data:{...form,retail_price:Number(form.retail_price),supplier_cost:Number(form.supplier_cost),b2b_base_price:form.b2b_base_price?Number(form.b2b_base_price):null,min_b2b_quantity:Number(form.min_b2b_quantity)}}),onSuccess:()=>{toast.success("Produto cadastrado");void queryClient.invalidateQueries({queryKey:["admin-hub-catalog"]});setForm(v=>({...v,title:"",sku:"",description:"",image_url:"",retail_price:"",supplier_cost:"",b2b_base_price:"",active:false}));},onError:(e)=>toast.error(e.message)});
 const suppliers=(query.data?.suppliers??[]) as Array<{id:string;name:string}>;const products=(query.data?.products??[]) as Array<{id:string;title:string;retail_price:number;active:boolean}>;
 const field=(key:keyof typeof form,label:string,type="text")=><label className="space-y-2 text-sm font-medium">{label}<Input type={type} required={["title","retail_price","supplier_cost","min_b2b_quantity"].includes(key)} min={type==="number"?0:undefined} step={type==="number"?"0.01":undefined} value={String(form[key])} onChange={e=>setForm(v=>({...v,[key]:e.target.value}))}/></label>;
 return <main className="mx-auto max-w-6xl space-y-8 px-4 py-28"><header><p className="text-xs font-black uppercase tracking-widest text-primary">Hub Eagles · Administração</p><h1 className="mt-3 text-4xl font-black">Catálogo & fornecedores</h1><p className="mt-3 text-muted-foreground">Preços de custo são privados. Cadastre somente dados reais confirmados pelo fornecedor.</p></header>
 {query.isLoading&&<p>Carregando...</p>}{query.isError&&<p role="alert">Não foi possível carregar o catálogo.</p>}
 <form onSubmit={e=>{e.preventDefault();mutation.mutate();}} className="grid gap-5 rounded-3xl border border-white/10 bg-card/80 p-6 md:grid-cols-2">
 <label className="space-y-2 text-sm font-medium">Fornecedor<select required className="flex h-10 w-full rounded-md border bg-background px-3" value={form.supplier_id} onChange={e=>setForm(v=>({...v,supplier_id:e.target.value}))}><option value="">Selecione</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
 {field("title","Nome do produto")}{field("sku","SKU")}{field("category","Categoria")}{field("image_url","URL da imagem")}{field("retail_price","Preço consumidor (R$)","number")}{field("supplier_cost","Custo fornecedor (R$)","number")}{field("b2b_base_price","Preço lojista (R$)","number")}{field("min_b2b_quantity","Quantidade mínima B2B","number")}{field("description","Descrição")}
 <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.active} onChange={e=>setForm(v=>({...v,active:e.target.checked}))}/>Publicar produto</label>
 <Button type="submit" disabled={mutation.isPending||!form.supplier_id}>{mutation.isPending?"Salvando...":"Cadastrar produto"}</Button></form>
 <section className="space-y-3"><h2 className="text-2xl font-bold">Produtos cadastrados ({products.length})</h2>{products.map(p=><div key={p.id} className="flex justify-between rounded-xl border border-white/10 p-4"><span>{p.title}</span><span className="text-sm text-muted-foreground">{Number(p.retail_price).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})} · {p.active?"Publicado":"Rascunho"}</span></div>)}</section>
 </main>;
}
