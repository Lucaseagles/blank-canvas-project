import {createServerFn} from "@tanstack/react-start";
import {requireOwnerRole} from "./auth-guards.server";
import {assessRubiLaunch,type RubiLaunchProduct,type RubiLaunchEditorial} from "./rubi-launch-readiness";
import {assessRubiLaunchGate} from "./rubi-launch-gates";
import {rubiQaSnapshotCurrent} from "./rubi-launch-qa-snapshot";
import {RUBI_LAUNCH_QA_ITEMS,type RubiQaChecklist} from "./rubi-launch-qa";
const zero=():RubiLaunchEditorial=>({playbooks:0,approvedPlaybooks:0,movements:0,variants:0,approvedPages:0});
/** Server-side master-only launch diagnostic; never changes checkout, prices or orders. */
export const getRubiLaunchReadinessAdmin=createServerFn({method:"GET"})
.middleware([requireOwnerRole]).handler(async()=>{
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 const db=supabaseAdmin as any;
 const [productsResult,productsCountResult,suppliersResult,playbooksResult,movementsResult]=await Promise.all([
  db.from("hub_products").select("id,title,active,retail_price,supplier_cost,description,image_url,checkout_url,checkout_verified,supplier_id,hub_suppliers!inner(active,checkout_host)").order("created_at",{ascending:false}).limit(200),
  db.from("hub_products").select("id",{count:"exact",head:true}),
  db.from("hub_suppliers").select("id,name,active,checkout_host").order("name"),
  db.from("rubi_offer_playbooks").select("product_id,published_at").limit(2000),
  db.from("rubi_movements").select("id,product_id").limit(2000),
 ]);
 for(const response of [productsResult,productsCountResult,suppliersResult,playbooksResult,movementsResult])if(response.error)throw response.error;
 const products=(productsResult.data??[]) as Array<RubiLaunchProduct&{supplier_id:string}>;
 const movements=(movementsResult.data??[]) as Array<{id:string;product_id:string}>;
 const totals=new Map<string,RubiLaunchEditorial>();
 for(const product of products)totals.set(product.id,zero());
 for(const row of (playbooksResult.data??[]) as Array<{product_id:string;published_at:string|null}>){
  const item=totals.get(row.product_id);if(!item)continue;
  item.playbooks++;if(row.published_at)item.approvedPlaybooks++;
 }
 for(const movement of movements){const item=totals.get(movement.product_id);if(item)item.movements++;}
 if(movements.length){
  const variantsResult=await db.from("rubi_movement_variants").select("id,movement_id").in("movement_id",movements.map(m=>m.id)).limit(4000);
  if(variantsResult.error)throw variantsResult.error;
  const variants=(variantsResult.data??[]) as Array<{id:string;movement_id:string}>;
  const productByMovement=new Map(movements.map(m=>[m.id,m.product_id]));
  for(const variant of variants){
   const productId=productByMovement.get(variant.movement_id);
   if(!productId)continue;
   const item=totals.get(productId);if(item)item.variants++;
  }
  if(variants.length){
   const publication=await db.from("rubi_movement_distribution").select("variant_id,page_published_at")
    .in("variant_id",variants.map(v=>v.id)).not("page_published_at","is",null).limit(4000);
   if(publication.error)throw publication.error;
   const movementByVariant=new Map(variants.map(v=>[v.id,v.movement_id]));
   for(const row of (publication.data??[]) as Array<{variant_id:string;page_published_at:string|null}>){
    const productId=productByMovement.get(movementByVariant.get(row.variant_id)??"");
    if(productId&&totals.has(productId))totals.get(productId)!.approvedPages++;
   }
  }
 }
 const qaByProduct=new Map<string,{checklist:RubiQaChecklist;snapshot:string|null}>();
 if(products.length){
  const {data:qaRows,error:qaError}=await db.from("rubi_launch_qa_checklists")
   .select("*").in("product_id",products.map(p=>p.id)).limit(200);
  if(qaError)throw qaError;
  for(const row of (qaRows??[]) as Array<Record<string,unknown>>){
   const checklist={product_id:String(row["product_id"])} as RubiQaChecklist;
   for(const item of RUBI_LAUNCH_QA_ITEMS){
    checklist[item.key]={
     status:row[`${item.key}_status`] as RubiQaChecklist[typeof item.key]["status"],
     evidence:String(row[`${item.key}_evidence`]??""),
    };
   }
   qaByProduct.set(checklist.product_id,{checklist,snapshot:typeof row["commercial_snapshot"]==="string"?row["commercial_snapshot"]:null});
  }
 }
 const entries=products.map(product=>{
  const basic=assessRubiLaunch(product,totals.get(product.id)??zero());
  const qa=qaByProduct.get(product.id);
  const current=!!qa&&rubiQaSnapshotCurrent(qa.snapshot,product);
  const operational=assessRubiLaunchGate(basic.readyForRetail,current?qa!.checklist:null);
  return {...basic,operational,qaStale:!!qa&&!current};
 });
 const suppliers=(suppliersResult.data??[]) as Array<{id:string;name:string;active:boolean;checkout_host:string|null}>;
 const totalProducts=Number(productsCountResult.count??0);
 const isPartial=totalProducts>products.length;
 return {
  asOf:new Date().toISOString(),productLimit:200,productsCount:products.length,
  totalProducts,isPartial,productsNotAnalyzed:Math.max(0,totalProducts-products.length),
  suppliersCount:suppliers.length,activeSuppliers:suppliers.filter(s=>s.active).length,
  suppliersWithoutHost:suppliers.filter(s=>s.active&&!s.checkout_host).length,
  readyCount:entries.filter(e=>e.readyForRetail).length,
  blockedCount:entries.filter(e=>!e.readyForRetail).length,
  reviewedCount:entries.filter(e=>e.operational.launchReviewed).length,
  pendingOperationalCount:entries.filter(e=>!e.operational.launchReviewed).length,
  productRows:entries,
  externalDependencies:["Confirmar origem e titularidade das URLs Kairos.","Configurar domínio anual e HTTPS no ambiente de hospedagem.","Testar navegação e checkout real autorizado com fornecedor.","Validar pedido, comissões e estorno com evidência oficial."],
  caution:"Contagens de prontos/conferidos são somente dos produtos analisados. Em catálogo com mais de 200 produtos, os totais são PARCIAIS. QA manual não comprova pedido pago ou teste de navegador executado."
 };
});
