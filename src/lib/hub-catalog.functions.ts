import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { approvedRubiCheckout, normalizeRubiCheckoutHost, verifyRubiCheckoutUrl } from "./rubi-checkout-validation";
import { requiresSupplierCheckoutReverification } from "./rubi-supplier-host-safety";

export const getRetailHubCatalog = createServerFn({method:"GET"}).handler(async()=>{
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 const {data,error}=await (supabaseAdmin as any).from("hub_products").select("id,title,description,image_url,category,retail_price,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)").eq("hub_suppliers.active",true).eq("active",true).eq("checkout_verified",true).not("checkout_url","is",null).gt("retail_price",0).order("created_at",{ascending:false}).limit(60);
 if(error) throw error;
 return (data??[]).filter((p:any)=>approvedRubiCheckout(p)).map(({hub_suppliers: _supplier, checkout_url: _checkoutUrl, checkout_verified: _verified, ...product}:any)=>product);
});
/**
 * Public product detail for a shareable RUBI Store offer.
 * Only published products with an active supplier and a positive retail price
 * are returned. Supplier costs and wholesale tiers are never exposed.
 */
export const getRetailHubProduct = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ productId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: product, error } = await (supabaseAdmin as any)
      .from("hub_products")
      .select("id,title,description,image_url,category,retail_price,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)")
      .eq("id", data.productId)
      .eq("hub_suppliers.active", true)
      .eq("active", true)
      .eq("checkout_verified", true)
      .not("checkout_url", "is", null)
      .gt("retail_price", 0)
      .maybeSingle();
    if (error) throw error;
    if (!product || !approvedRubiCheckout(product as any)) return null;
    const { hub_suppliers: _supplier, checkout_url: _checkoutUrl, checkout_verified: _verified, ...publicProduct } = product;
    return publicProduct as {
      id: string;
      title: string;
      description: string | null;
      image_url: string | null;
      category: string | null;
      retail_price: number;
    };
  });

export const getMerchantHubCatalog = createServerFn({method:"POST"})
.validator((input:unknown)=>z.object({accessToken:z.string().min(1)}).parse(input))
.handler(async({data})=>{
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 const {data:authResult,error:authError}=await supabaseAdmin.auth.getUser(data.accessToken);
 const userId=authResult.user?.id;
 if(authError || !userId) throw new Error("Sessão inválida. Entre novamente para consultar o atacado.");
 const {data:profile,error:profileError}=await (supabaseAdmin as any).from("commercial_profiles").select("id").eq("user_id",userId).eq("audience","merchant").eq("status","approved").maybeSingle();
 if(profileError) throw profileError;
 if(!profile) throw new Error("Acesso exclusivo para lojistas aprovados.");
 const {data:products,error}=await (supabaseAdmin as any).from("hub_products").select("id,title,description,image_url,category,b2b_base_price,min_b2b_quantity,hub_b2b_tiers(min_quantity,unit_price),hub_suppliers!inner(active,checkout_host)").eq("hub_suppliers.active",true).eq("active",true).gt("b2b_base_price",0).order("created_at",{ascending:false}).limit(60);
 if(error) throw error;
 const safeProducts=(products??[]).filter((product:any)=>Number.isSafeInteger(product.min_b2b_quantity) && product.min_b2b_quantity > 0 && product.min_b2b_quantity <= 10000000 && Number.isFinite(Number(product.b2b_base_price)) && Number(product.b2b_base_price)>0);
 return safeProducts.map(({hub_suppliers: _supplier,...product}:any)=>({...product,hub_b2b_tiers:(product.hub_b2b_tiers??[]).filter((tier:any)=>Number.isSafeInteger(tier.min_quantity) && tier.min_quantity >= product.min_b2b_quantity && tier.min_quantity <= 10000000 && Number.isFinite(Number(tier.unit_price)) && Number(tier.unit_price)>0)}));
});
export const getHubCatalogAdmin = createServerFn({method:"GET"}).middleware([requireOwnerRole]).handler(async()=>{
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 const [products,suppliers]=await Promise.all([(supabaseAdmin as any).from("hub_products").select("*").order("created_at",{ascending:false}).limit(200),(supabaseAdmin as any).from("hub_suppliers").select("*").order("name")]);
 if(products.error) throw products.error;if(suppliers.error) throw suppliers.error;
 const tiers = await (supabaseAdmin as any).from("hub_b2b_tiers").select("id,product_id,min_quantity,unit_price").order("min_quantity");
 if(tiers.error) throw tiers.error;
 return {products:products.data??[],suppliers:suppliers.data??[],tiers:tiers.data??[]};
});
export const saveHubProductAdmin=createServerFn({method:"POST"}).middleware([requireOwnerRole]).validator((input:unknown)=>z.object({
 id:z.string().uuid().optional(),revision:z.number().int().positive().optional(),checkout_url:z.union([z.string().url().max(2000),z.literal("")]).optional(),checkout_verified:z.boolean().optional(),supplier_id:z.string().uuid(),title:z.string().trim().min(3).max(180),description:z.string().max(2000).optional(),image_url:z.union([z.string().url(),z.literal("")]).optional(),category:z.string().max(80).optional(),sku:z.string().max(80).optional(),
 retail_price:z.number().finite().nonnegative(),supplier_cost:z.number().finite().nonnegative(),b2b_base_price:z.number().finite().positive().nullable(),min_b2b_quantity:z.number().int().positive().max(10000000),active:z.boolean()
}).parse(input)).handler(async({data,context})=>{
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 if (data.active && data.retail_price <= 0) throw new Error("Informe um preço de varejo maior que zero antes de publicar.");
 if (data.b2b_base_price !== null && data.b2b_base_price <= 0) throw new Error("O preço base B2B deve ser maior que zero.");
 const {data:supplier,error:supplierError}=await (supabaseAdmin as any).from("hub_suppliers").select("id,active,checkout_host").eq("id",data.supplier_id).maybeSingle();
 if(supplierError) throw supplierError;
 if(!supplier) throw new Error("Fornecedor não encontrado.");
 if(data.active && !supplier.active) throw new Error("Ative o fornecedor antes de publicar o produto.");
 // Treat URL edits as unverified unless the owner explicitly marks this offer
 // reviewed. Publishing requires verified matching HTTPS checkout URL.
 const checkoutUrl = data.checkout_url?.trim() || null;
 // Existing published offers must be reviewed again whenever their commercial
 // identity, supplier, price, cost or checkout destination changes.
 if (data.id && !data.revision) throw new Error("Versão do produto ausente; recarregue o catálogo.");
 if (data.id) {
   const { data: existing, error: existingError } = await (supabaseAdmin as any)
     .from("hub_products")
     .select("supplier_id,title,sku,retail_price,supplier_cost,checkout_url,checkout_verified")
     .eq("id", data.id).maybeSingle();
   if (existingError) throw existingError;
   if (!existing) throw new Error("Produto não encontrado.");
   const commercialChange = existing.supplier_id !== data.supplier_id
     || existing.title !== data.title
     || (existing.sku ?? "") !== (data.sku ?? "")
     || Number(existing.retail_price) !== data.retail_price
     || Number(existing.supplier_cost) !== data.supplier_cost
     || (existing.checkout_url ?? "") !== (checkoutUrl ?? "");
   if (commercialChange && data.active) {
     throw new Error("Oferta alterada: desmarque Publicar, salve o rascunho e revise novamente o checkout antes de ativar.");
   }
   if (commercialChange) data.checkout_verified = false;
 }
 const checkoutValid = verifyRubiCheckoutUrl(checkoutUrl, supplier.checkout_host);
 if (checkoutUrl && !checkoutValid) throw new Error("Checkout inválido: confirme o domínio oficial exato do fornecedor e utilize HTTPS.");
 if (data.checkout_verified && !checkoutValid) throw new Error("Não é possível validar este checkout sem URL oficial aprovada.");
 if (data.active && (!data.checkout_verified || !checkoutValid)) throw new Error("Para publicar, valide o checkout oficial do produto e o domínio do fornecedor.");
 const {id,revision,...values}=data;
 (values as any).checkout_url=checkoutUrl;
 (values as any).checkout_verified=data.checkout_verified===true&&!!checkoutValid;
 const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_save_hub_product_audited",{
  p_id:id??null,p_expected_revision:revision??null,p_values:values,p_actor:context.userId
 });
 if(error)throw error;
 if(!rows?.length)throw new Error("Produto não salvo.");
 return {success:true,id:String(rows[0].product_id),revision:Number(rows[0].new_revision)};
});

export const saveHubSupplierAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(2).max(160),
    fulfillment_mode: z.enum(["supplier", "hub"]),
    active: z.boolean(),
    checkout_host: z.string().trim().max(253).nullable().optional(),
  }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...payload } = data;
    if (payload.checkout_host) {
      const validHost = normalizeRubiCheckoutHost(payload.checkout_host);
      if (!validHost) throw new Error("Informe um domínio de checkout válido, sem https:// ou caminhos.");
      payload.checkout_host = validHost;
    }
    if (id) {
      const { data: current, error: currentError } = await (supabaseAdmin as any)
        .from("hub_suppliers")
        .select("id,checkout_host")
        .eq("id", id)
        .maybeSingle();
      if (currentError) throw currentError;
      if (!current) throw new Error("Fornecedor não encontrado.");
      if (requiresSupplierCheckoutReverification(current.checkout_host, payload.checkout_host)) {
        const { data: affected, error: affectedError } = await (supabaseAdmin as any)
          .from("hub_products")
          .select("id")
          .eq("supplier_id", id)
          .or("active.eq.true,checkout_verified.eq.true")
          .limit(1);
        if (affectedError) throw affectedError;
        if (affected?.length) {
          throw new Error("Não é possível trocar o domínio: despublique os produtos associados e retire a validação de seus checkouts individualmente antes de alterar o fornecedor.");
        }
      }
    }
    const { error } = await (supabaseAdmin as any)
      .from("hub_suppliers")
      .upsert(id ? { id, ...payload } : payload);
    if (error) throw error;
    return { success: true };
  });

export const saveHubB2BTierAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({
    product_id: z.string().uuid(),
    min_quantity: z.number().int().positive(),
    unit_price: z.number().finite().positive(),
  }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: product, error: productError } = await (supabaseAdmin as any)
      .from("hub_products")
      .select("id,min_b2b_quantity,b2b_base_price")
      .eq("id", data.product_id)
      .maybeSingle();
    if (productError) throw productError;
    if (!product) throw new Error("Produto não encontrado.");
    if (!(Number(product.b2b_base_price) > 0)) throw new Error("Configure o preço B2B base antes das faixas.");
    if (data.min_quantity > 10000000) throw new Error("Quantidade acima do limite do simulador.");
    if (data.min_quantity < product.min_b2b_quantity) {
      throw new Error("A faixa não pode ser inferior ao pedido mínimo do produto.");
    }
    const { data: existing, error: lookupError } = await (supabaseAdmin as any)
      .from("hub_b2b_tiers")
      .select("id")
      .eq("product_id", data.product_id)
      .eq("min_quantity", data.min_quantity)
      .limit(2);
    if (lookupError) throw lookupError;
    if ((existing ?? []).length > 1) throw new Error("Existem faixas duplicadas; revise os dados antes de editar.");
    const query = (existing ?? []).length === 1
      ? (supabaseAdmin as any).from("hub_b2b_tiers").update({ unit_price: data.unit_price }).eq("id", existing[0].id).eq("product_id", data.product_id)
      : (supabaseAdmin as any).from("hub_b2b_tiers").insert(data);
    const { error } = await query;
    if (error) throw error;
    return { success: true };
  });
