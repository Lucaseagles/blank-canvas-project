import {useMemo,useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {BookCopy,ClipboardCopy,ShieldAlert} from "lucide-react";
import {Button} from "@/components/ui/button";
import {listRubiCreativeLibraryAdmin} from "@/lib/rubi-creative-library.functions";

type CreativeAsset={id:string;productId:string;productTitle:string;category:string;movement:string;name:string;format:string;revision:number;hook:string;script:string;pageHeadline:string;pageBody:string;cta:string;mediaNotes:string;proofNotes:string;rightsDeclaration:boolean};
export function RubiCreativeLibraryAdmin(){
 const load=useServerFn(listRubiCreativeLibraryAdmin);
 const query=useQuery({queryKey:["rubi-master-creative-library"],queryFn:()=>load(),retry:false});
 const [search,setSearch]=useState("");
 const [format,setFormat]=useState("all");
 const assets=(query.data?.items??[]) as CreativeAsset[];
 const filtered=useMemo(()=>assets.filter(a=>(format==="all"||a.format===format)&&
  [a.productTitle,a.category,a.movement,a.name,a.hook].join(" ").toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))),[assets,search,format]);
 const copy=async(asset:CreativeAsset)=>{
  const content=[asset.productTitle,asset.name,"Gancho: "+asset.hook,"Roteiro: "+asset.script,
   "Página: "+asset.pageHeadline,asset.pageBody,"CTA: "+asset.cta,"Referências de mídia: "+asset.mediaNotes,
   "Evidências: "+asset.proofNotes].join("\n\n");
  await navigator.clipboard.writeText(content);
 };
 return <section aria-label="Biblioteca reutilizável de criativos RUBI" className="space-y-4 rounded-3xl border border-primary/20 bg-card p-5 sm:p-7">
  <header className="space-y-2">
   <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><BookCopy className="h-4 w-4"/> Offer Engine × Movement Engine</p>
   <h2 className="text-xl font-black">Biblioteca central de criativos e páginas</h2>
   <p className="text-xs leading-5 text-muted-foreground">Reúne variantes em revisão, vinculadas ao produto e movimento, com declaração de direitos. Reaproveite os roteiros sem criar outra oferta; a licença da mídia ainda precisa de comprovação documental.</p>
  </header>
  <div className="grid gap-2 sm:grid-cols-2">
   <label className="space-y-1 text-xs font-semibold">Buscar por produto, categoria, movimento ou gancho
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ex.: beleza, skincare, tutorial" className="block w-full rounded-xl border bg-background p-3"/>
   </label>
   <label className="space-y-1 text-xs font-semibold">Formato
    <select value={format} onChange={e=>setFormat(e.target.value)} className="block w-full rounded-xl border bg-background p-3">
     <option value="all">Todos os formatos</option><option value="short_video">Vídeo curto</option><option value="story">Story</option><option value="carousel">Carrossel</option><option value="post">Post</option>
    </select>
   </label>
  </div>
  {query.isLoading&&<p role="status" className="text-sm text-muted-foreground">Carregando materiais da biblioteca...</p>}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Biblioteca indisponível. Confirme autorização Master e integridade dos movimentos.</p>}
  {query.data?.partial&&<p role="alert" className="text-sm text-amber-600">Consulta atingiu o limite. Biblioteca parcial ocultada para não sugerir distribuição incompleta.</p>}
  {query.data&&!query.data.partial&&<div className="space-y-3">
   {filtered.length===0&&<p className="text-sm text-muted-foreground">Nenhum material elegível para os filtros. Cadastre uma variante, revise a mídia e declare os direitos no Movement Engine.</p>}
   {filtered.map(asset=><article key={asset.id} className="space-y-3 rounded-2xl border bg-background/60 p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
     <div><p className="font-bold">{asset.productTitle} · {asset.name}</p>
      <p className="text-xs text-muted-foreground">{asset.category} · {asset.movement} · {asset.format} · revisão {asset.revision}</p></div>
     <Button type="button" size="sm" variant="outline" onClick={()=>{void copy(asset).catch(()=>undefined);}}>
      <ClipboardCopy className="mr-1 h-4 w-4"/> Copiar roteiro
     </Button>
    </div>
    <p className="text-sm font-semibold">{asset.hook}</p>
    <p className="line-clamp-3 whitespace-pre-line text-xs text-muted-foreground">{asset.script}</p>
    <p className="text-xs font-semibold">Página: {asset.pageHeadline} · CTA: {asset.cta}</p>
    <p className="text-xs text-muted-foreground">Referência de mídia: {asset.mediaNotes||"Não documentada"} · Evidências: {asset.proofNotes||"Não documentadas"}</p>
   </article>)}
  </div>}
  <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary"/> Uma declaração de direitos não é licença verificada. Material privado do Master: não publique, patrocine ou distribua ao criador sem checar direitos, aprovação editorial, produto autorizado e acordo comercial.</p>
 </section>;
}
