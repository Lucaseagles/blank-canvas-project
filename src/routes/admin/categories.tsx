import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCategoriesAdmin, saveCategory, deleteCategory, reorderCategories } from "@/lib/admin_intel.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit2, Trash2, FolderIcon, GripVertical, Eye, EyeOff, Search, Layers3, CheckCircle2, XCircle, X, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categories")({ component: AdminCategoriesPage });

type Category = { id:string; name:string; slug:string; description?:string|null; icon?:string|null; image_url?:string|null; color?:string|null; parent_id?:string|null; display_order?:number; is_active?:boolean };
type FormState = Omit<Category,"id"> & { id?:string };
const emptyForm:FormState={name:"",slug:"",description:"",icon:"FolderOpen",image_url:"",color:"",parent_id:null,display_order:0,is_active:true};

function AdminCategoriesPage(){
 const getCats=useServerFn(getCategoriesAdmin), saveCat=useServerFn(saveCategory), deleteCat=useServerFn(deleteCategory), reorderCat=useServerFn(reorderCategories);
 const qc=useQueryClient();
 const {data}=useSuspenseQuery({queryKey:["admin-categories"],queryFn:()=>getCats({data:undefined})});
 const categories=data as Category[];
 const [editing,setEditing]=useState<FormState|null>(null);
 const [dragId,setDragId]=useState<string|null>(null);
 const [search,setSearch]=useState("");
 const [filter,setFilter]=useState<"all"|"active"|"inactive">("all");

 const refresh=()=>qc.invalidateQueries({queryKey:["admin-categories"]});
 const save=useMutation({mutationFn:(v:FormState)=>saveCat({data:v}),onSuccess:()=>{refresh();setEditing(null);toast.success("Categoria salva.");},onError:(e)=>toast.error(e instanceof Error?e.message:"Não foi possível salvar.")});
 const remove=useMutation({mutationFn:(id:string)=>deleteCat({data:{id}}),onSuccess:()=>{refresh();toast.success("Categoria excluída.");},onError:(e)=>toast.error(e instanceof Error?e.message:"Não foi possível excluir.")});
 const reorder=useMutation({mutationFn:(ids:string[])=>reorderCat({data:{ids}}),onSuccess:refresh,onError:(e)=>toast.error(e instanceof Error?e.message:"Não foi possível reordenar.")});
 const ordered=[...categories].sort((a,b)=>(a.display_order??0)-(b.display_order??0));
 const filtered=useMemo(()=>{const term=search.trim().toLowerCase();return ordered.filter(c=>{const status=filter==="all"||(filter==="active"&&c.is_active!==false)||(filter==="inactive"&&c.is_active===false);const text=!term||[c.name,c.slug,c.description].filter(Boolean).some(v=>String(v).toLowerCase().includes(term));return status&&text;});},[ordered,search,filter]);
 const stats={total:categories.length,active:categories.filter(c=>c.is_active!==false).length,inactive:categories.filter(c=>c.is_active===false).length,sub:categories.filter(c=>Boolean(c.parent_id)).length};
 const move=(id:string,target:string)=>{const ids=ordered.map(c=>c.id),from=ids.indexOf(id),to=ids.indexOf(target);if(from<0||to<0||from===to)return;ids.splice(from,1);ids.splice(to,0,id);reorder.mutate(ids)};
 const toggle=(cat:Category)=>save.mutate({...cat,is_active:!(cat.is_active??true)});
 const openCreate=()=>setEditing({...emptyForm,display_order:categories.length});
 const slugify=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120);
 const validate=()=>{if(!editing)return false; if(editing.name.trim().length<2){toast.error("O nome precisa ter pelo menos 2 caracteres.");return false;} const normalized=slugify(editing.slug); if(!normalized){toast.error("Informe um slug válido.");return false;} if(editing.image_url?.trim()){try{new URL(editing.image_url)}catch{toast.error("A URL da imagem não é válida.");return false;}} return true;};
 const submit=()=>{if(!validate()||!editing)return;save.mutate({...editing,name:editing.name.trim(),slug:slugify(editing.slug),description:editing.description?.trim()||null,image_url:editing.image_url?.trim()||null,icon:editing.icon?.trim()||null,color:editing.color?.trim()||null});};
 const moveBy=(id:string,direction:-1|1)=>{const index=ordered.findIndex(c=>c.id===id);const target=index+direction;if(index<0||target<0||target>=ordered.length)return;const targetCat=ordered[target];if(!targetCat)return;move(id,targetCat.id);};
 const parentName=(id?:string|null)=>id?categories.find(c=>c.id===id)?.name??"Subcategoria":"Raiz";

 return <div className="relative min-h-full overflow-hidden pb-10">
  <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/[0.08] via-primary/[0.025] to-transparent"/>
  <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
   <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
    <div className="relative p-6 sm:p-8">
     <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"/>
     <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-primary"><Layers3 className="h-3.5 w-3.5"/> Estrutura do catálogo</div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Categorias</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Organize a estrutura pública do catálogo, a hierarquia, a ordem e a visibilidade de cada categoria.</p></div>
      <Button onClick={openCreate} className="h-12 rounded-xl px-5 font-black shadow-lg shadow-primary/10"><Plus className="mr-2 h-4 w-4"/> Nova categoria</Button>
     </div>
     <div className="mt-7 grid gap-3 sm:grid-cols-4">{[{l:"Total",v:stats.total,i:Layers3},{l:"Ativas",v:stats.active,i:CheckCircle2},{l:"Inativas",v:stats.inactive,i:XCircle},{l:"Subcategorias",v:stats.sub,i:FolderIcon}].map(({l,v,i:Icon})=><div key={l} className="rounded-2xl border border-border/60 bg-background/50 p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">{l}</span><Icon className="h-4 w-4 text-primary"/></div><div className="mt-2 text-2xl font-black tracking-tight">{v}</div></div>)}</div>
    </div>
   </section>

   <section className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 shadow-sm backdrop-blur-xl md:flex-row md:items-center">
    <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar categoria, slug ou descrição..." className="h-11 border-0 bg-background/70 pl-9 shadow-none"/></div>
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1">{(["all","active","inactive"] as const).map(v=><button key={v} type="button" onClick={()=>setFilter(v)} className={`rounded-lg px-4 py-2 text-xs font-black transition ${filter===v?"bg-background shadow-sm":"text-muted-foreground hover:text-foreground"}`}>{v==="all"?"Todas":v==="active"?"Ativas":"Inativas"}</button>)}</div>
   </section>

   {filtered.length===0&&<div className="rounded-3xl border border-dashed border-border bg-card/60 p-14 text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FolderIcon className="h-7 w-7"/></div><h2 className="text-lg font-black">{categories.length?"Nenhum resultado encontrado":"Nenhuma categoria cadastrada"}</h2><p className="mt-1 text-sm text-muted-foreground">{categories.length?"Ajuste a busca ou o filtro.":"Crie a primeira categoria para estruturar o catálogo."}</p>{!categories.length&&<Button onClick={openCreate} className="mt-5 rounded-xl font-black"><Plus className="mr-2 h-4 w-4"/> Criar categoria</Button>}</div>}

   <div className="space-y-3">{filtered.map((cat)=>{
    const realIndex=ordered.findIndex(c=>c.id===cat.id);
    return <div key={cat.id} draggable onDragStart={()=>setDragId(cat.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(dragId){move(dragId,cat.id);setDragId(null)}}} className="group rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-lg">
     <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="hidden cursor-grab rounded-xl p-2 text-muted-foreground transition hover:bg-muted md:block" title="Arraste para reordenar"><GripVertical className="h-5 w-5"/></div>
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-muted/40">{cat.image_url?<img src={cat.image_url} alt="" className="h-full w-full object-cover"/>:<div className="flex h-full w-full items-center justify-center"><FolderIcon className="h-6 w-6 text-primary"/></div>}</div>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-black">{cat.name}</h3><Badge variant="outline" className="text-[9px] font-black">#{realIndex+1}</Badge><Badge className={`border-0 text-[9px] font-black ${cat.is_active===false?"bg-muted text-muted-foreground":"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>{cat.is_active===false?"INATIVA":"ATIVA"}</Badge>{cat.parent_id&&<Badge variant="secondary" className="text-[9px]">{parentName(cat.parent_id)}</Badge>}</div><p className="mt-1 truncate font-mono text-xs text-muted-foreground">/{cat.slug}</p>{cat.description&&<p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{cat.description}</p>}</div>
      <div className="flex flex-wrap gap-2 md:justify-end"><Button variant="ghost" size="icon" className="rounded-xl md:hidden" onClick={()=>moveBy(cat.id,-1)} disabled={realIndex===0||reorder.isPending} aria-label="Mover para cima"><ArrowUp className="h-4 w-4"/></Button><Button variant="ghost" size="icon" className="rounded-xl md:hidden" onClick={()=>moveBy(cat.id,1)} disabled={realIndex===ordered.length-1||reorder.isPending} aria-label="Mover para baixo"><ArrowDown className="h-4 w-4"/></Button><Button variant="outline" size="sm" className="rounded-xl" onClick={()=>toggle(cat)} disabled={save.isPending}>{cat.is_active===false?<Eye className="mr-1 h-4 w-4"/>:<EyeOff className="mr-1 h-4 w-4"/>}{cat.is_active===false?"Ativar":"Ocultar"}</Button><Button variant="outline" size="sm" className="rounded-xl" onClick={()=>setEditing({...cat})}><Edit2 className="mr-1 h-4 w-4"/>Editar</Button><Button variant="outline" size="icon" className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={remove.isPending} onClick={()=>{if(confirm("Excluir esta categoria? Produtos vinculados podem impedir a exclusão."))remove.mutate(cat.id)}}><Trash2 className="h-4 w-4"/></Button></div>
     </div>
    </div>
   })}</div>
  </div>

  {editing&&<div className="fixed inset-0 z-[120] bg-black/70 p-4 backdrop-blur-sm" onMouseDown={e=>{if(e.target===e.currentTarget)setEditing(null)}}>
   <div className="mx-auto mt-4 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-border/70 bg-background/95 shadow-2xl backdrop-blur-xl">
    <div className="sticky top-0 z-10 border-b border-border/60 bg-card/90 px-6 py-5 backdrop-blur-xl"><div className="flex items-start justify-between gap-4"><div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-primary"><FolderIcon className="h-3 w-3"/>{editing.id?"Edição":"Novo cadastro"}</div><h2 className="text-2xl font-black tracking-tight">{editing.id?"Editar categoria":"Nova categoria"}</h2><p className="mt-1 text-sm text-muted-foreground">Configure identidade, hierarquia, apresentação e publicação.</p></div><Button variant="ghost" size="icon" className="rounded-xl" onClick={()=>setEditing(null)}><X className="h-5 w-5"/></Button></div></div>
    <div className="space-y-5 p-6">
     <section className="rounded-2xl border border-border/60 bg-card/50 p-5"><h3 className="font-black">Identidade</h3><p className="mb-4 text-xs text-muted-foreground">Nome e endereço público da categoria.</p><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><label className="text-sm font-bold">Nome *</label><Input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value,slug:editing.id?editing.slug:slugify(e.target.value)})} placeholder="Ex.: Eletrônicos" className="h-11 rounded-xl"/></div><div className="space-y-2"><label className="text-sm font-bold">Slug *</label><Input value={editing.slug} onChange={e=>setEditing({...editing,slug:slugify(e.target.value)})} placeholder="eletronicos" className="h-11 rounded-xl"/></div><div className="space-y-2"><label className="text-sm font-bold">Ícone Lucide</label><Input value={editing.icon??""} onChange={e=>setEditing({...editing,icon:e.target.value})} placeholder="FolderOpen" className="h-11 rounded-xl"/></div><div className="space-y-2 md:col-span-2"><label className="text-sm font-bold">Descrição</label><Textarea value={editing.description??""} onChange={e=>setEditing({...editing,description:e.target.value})} placeholder="Descreva esta categoria..." className="min-h-24 resize-none rounded-xl"/></div></div></section>
     <section className="rounded-2xl border border-border/60 bg-card/50 p-5"><h3 className="font-black">Apresentação</h3><p className="mb-4 text-xs text-muted-foreground">Imagem e identidade visual usada no catálogo.</p><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><label className="text-sm font-bold">URL da imagem</label><Input type="url" value={editing.image_url??""} onChange={e=>setEditing({...editing,image_url:e.target.value})} placeholder="https://..." className="h-11 rounded-xl"/></div><div className="space-y-2"><label className="text-sm font-bold">Cor</label><Input value={editing.color??""} onChange={e=>setEditing({...editing,color:e.target.value})} placeholder="#7C3AED" className="h-11 rounded-xl"/></div></div>{editing.image_url&&<div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-muted/30"><img src={editing.image_url} alt="Prévia" className="aspect-[3/1] w-full object-cover" onError={e=>{e.currentTarget.style.display="none"}}/></div>}</section>
     <section className="rounded-2xl border border-border/60 bg-card/50 p-5"><h3 className="font-black">Hierarquia e publicação</h3><p className="mb-4 text-xs text-muted-foreground">Defina posição, categoria pai e visibilidade.</p><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><label className="text-sm font-bold">Categoria pai</label><Select value={editing.parent_id??"root"} onValueChange={v=>setEditing({...editing,parent_id:v==="root"?null:v})}><SelectTrigger className="h-11 rounded-xl"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="root">Raiz</SelectItem>{categories.filter(c=>c.id!==editing.id).map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><label className="text-sm font-bold">Ordem de exibição</label><Input type="number" value={String(editing.display_order??0)} onChange={e=>setEditing({...editing,display_order:Number(e.target.value)})} className="h-11 rounded-xl"/></div></div><Separator className="my-5"/><div className="flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/[.04] p-4"><div><p className="text-sm font-black">Categoria ativa</p><p className="text-xs text-muted-foreground">Controla a visibilidade desta categoria no catálogo.</p></div><Switch checked={editing.is_active??true} onCheckedChange={v=>setEditing({...editing,is_active:v})}/></div></section>
    </div>
    <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border/60 bg-card/90 px-6 py-4 backdrop-blur-xl"><Button variant="ghost" onClick={()=>setEditing(null)} disabled={save.isPending}>Cancelar</Button><Button onClick={submit} disabled={save.isPending} className="rounded-xl px-6 font-black">{save.isPending?"Salvando…":editing.id?"Salvar alterações":"Criar categoria"}</Button></div>
   </div>
  </div>}
 </div>;
}
