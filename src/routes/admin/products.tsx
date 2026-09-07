import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, EyeOff, Eye, Search, Link2, TrendingUp, Award, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useServerFn } from "@tanstack/react-start";
import { addRelationship, removeRelationship, getRelatedProducts } from "@/lib/relationships.functions";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { getOfferGroups, saveOfferGroup, updateProductOfferGroup } from "@/lib/admin_intel.functions";
import { ProductMediaAdminForm } from "@/components/product/ProductMediaAdminForm";

export const Route = createFileRoute("/admin/products")({ component: AdminProductsPage });

function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const addRelFn = useServerFn(addRelationship);
  const removeRelFn = useServerFn(removeRelationship);
  const getRelFn = useServerFn(getRelatedProducts);
  const [isRelModalOpen, setIsRelModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [relType, setRelType] = useState<'CROSS_SELL' | 'UPSELL' | 'DOWNSELL'>('CROSS_SELL');
  const [relatedProductId, setRelatedProductId] = useState('');
  const [isOfferGroupModalOpen, setIsOfferGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const updateOfferGroupFn = useServerFn(updateProductOfferGroup);
  const saveOfferGroupFn = useServerFn(saveOfferGroup);
  const getOfferGroupsFn = useServerFn(getOfferGroups);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaProduct, setMediaProduct] = useState<any>(null);

  const openMediaEditor = (product: any) => { setMediaProduct(product); setIsMediaModalOpen(true); };
  const { data: currentRelationships } = useQuery({ queryKey: ['product-rels', selectedProduct?.id], queryFn: () => getRelFn({ data: { productId: selectedProduct.id } }), enabled: !!selectedProduct?.id });
  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, marketplaces(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: offerGroups } = useQuery({ queryKey: ["admin-offer-groups"], queryFn: () => getOfferGroupsFn({ data: {} as any }) });
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("products").update({ status }).eq("id", id);
      if (error) throw error;
      await trackEvent(status === 'published' ? 'ADMIN_PRODUCT_PUBLISHED' : 'ADMIN_PRODUCT_UNPUBLISHED', { product_id: id });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); toast.success("Product status updated successfully"); },
    onError: (error) => toast.error(`Failed to update status: ${error.message}`)
  });
  const filteredProducts = products?.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl space-y-8 pb-safe">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2"><Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3">Management</Badge><h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">Product Catalog</h1></div>
        <div className="flex items-center gap-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" /><Input placeholder="Filter products..." className="pl-10 w-64 bg-background/50 border-glass-border h-12 rounded-2xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <Button onClick={() => window.location.assign('/admin/products/new')} className="h-12 px-8 font-black uppercase tracking-tighter italic gap-2 rounded-2xl"><Plus className="w-4 h-4" />Add New</Button>
        </div>
      </div>
      <div className="bg-glass-fallback border border-glass-border rounded-[2.5rem] backdrop-blur-xl overflow-hidden shadow-2xl elevation-1 reveal-on-scroll">
        <div className="hidden lg:block"><Table><TableHeader className="bg-muted/30"><TableRow className="hover:bg-transparent border-glass-border"><TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground py-6 pl-8">Product</TableHead><TableHead>Marketplace</TableHead><TableHead>Price</TableHead><TableHead className="text-center">Score</TableHead><TableHead className="text-center">Status</TableHead><TableHead className="text-right pr-8">Actions</TableHead></TableRow></TableHeader><TableBody>
          {isLoading ? [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={6} className="h-16"><div className="h-4 bg-muted animate-pulse rounded" /></TableCell></TableRow>) : filteredProducts?.map((product) => <TableRow key={product.id} className="hover:bg-white/5 border-glass-border group"><TableCell className="font-bold py-6 pl-8"><div className="flex items-center gap-4">{product.images?.[0] && <img src={product.images[0]} alt="" loading="lazy" className="w-12 h-12 rounded-xl object-cover bg-muted border border-glass-border" />}<span className="line-clamp-1 max-w-xs">{product.title}</span></div></TableCell><TableCell className="font-medium text-muted-foreground uppercase text-xs">{(product.marketplaces as any)?.name || 'External'}</TableCell><TableCell className="font-bold tabular-nums">R$ {(product.current_price ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell><TableCell className="text-center"><span className="text-[10px] font-black">{(product as any).offer_score?.toFixed(1) || '0.0'}</span>{(product as any).is_best_offer && <Badge className="ml-2 bg-amber-500/10 text-amber-500">BEST</Badge>}</TableCell><TableCell className="text-center"><Badge className={product.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}>{product.status}</Badge></TableCell><TableCell className="text-right pr-8"><div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="ghost" size="icon" onClick={() => { setSelectedProduct(product); setIsOfferGroupModalOpen(true); }}><Layers className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => { setSelectedProduct(product); setIsRelModalOpen(true); }}><Link2 className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => updateStatusMutation.mutate({ id: product.id, status: product.status === 'published' ? 'draft' : 'published' })}>{product.status === 'published' ? <EyeOff /> : <Eye />}</Button><Button variant="ghost" size="icon" onClick={() => openMediaEditor(product)}>IMG</Button></div></TableCell></TableRow>)}
        </TableBody></Table></div>
        <div className="lg:hidden divide-y divide-glass-border">{isLoading ? [...Array(3)].map((_, i) => <div key={i} className="p-6 animate-pulse"><div className="h-4 bg-muted rounded" /></div>) : filteredProducts?.map((product) => <div key={product.id} className="p-6 space-y-4"><div className="flex items-start justify-between"><div className="flex items-center gap-4">{product.images?.[0] && <img src={product.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover" />}<div><h3 className="font-bold text-sm">{product.title}</h3><div className="text-[10px] uppercase text-muted-foreground">{(product.marketplaces as any)?.name || 'External'}</div></div></div><span className="font-bold text-xs">R$ {(product.current_price ?? 0).toLocaleString('pt-BR')}</span></div><div className="flex gap-2"><Button size="icon" variant="ghost" onClick={() => { setSelectedProduct(product); setIsOfferGroupModalOpen(true); }}><Layers /></Button><Button size="icon" variant="ghost" onClick={() => { setSelectedProduct(product); setIsRelModalOpen(true); }}><Link2 /></Button><Button size="icon" variant="ghost" onClick={() => updateStatusMutation.mutate({ id: product.id, status: product.status === 'published' ? 'draft' : 'published' })}>{product.status === 'published' ? <EyeOff /> : <Eye />}</Button><Button size="icon" variant="ghost" onClick={() => openMediaEditor(product)}>IMG</Button></div></div>)}</div>
      </div>
      <Dialog open={isMediaModalOpen} onOpenChange={setIsMediaModalOpen}><DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-glass backdrop-blur-3xl"><DialogHeader><DialogTitle>{mediaProduct ? `Media · ${mediaProduct.title}` : 'Product Media'}</DialogTitle></DialogHeader>{mediaProduct ? <ProductMediaAdminForm product={mediaProduct} onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin-products'] })} onClose={() => setIsMediaModalOpen(false)} /> : <div className="py-10 text-center text-sm text-muted-foreground">Selecione um produto existente.</div>}</DialogContent></Dialog>
      <Dialog open={isRelModalOpen} onOpenChange={setIsRelModalOpen}><DialogContent><DialogHeader><DialogTitle>Product Relationships: {selectedProduct?.title}</DialogTitle></DialogHeader><div className="space-y-4 py-6"><div className="grid grid-cols-2 gap-4"><div><Label>Relationship Type</Label><select className="w-full h-12 rounded-xl bg-white/5 border px-4" value={relType} onChange={(e: any) => setRelType(e.target.value)}><option value="CROSS_SELL">Cross-sell</option><option value="UPSELL">Upsell</option><option value="DOWNSELL">Downsell</option></select></div><div><Label>Related Product ID</Label><Input value={relatedProductId} onChange={e => setRelatedProductId(e.target.value)} /></div></div><Button className="w-full" onClick={async () => { try { await addRelFn({ data: { productId: selectedProduct.id, relatedProductId, type: relType } }); toast.success('Relationship deployed'); setRelatedProductId(''); queryClient.invalidateQueries({ queryKey: ['product-rels', selectedProduct.id] }); } catch { toast.error('Failed to deploy relationship'); } }}>Link Products</Button></div></DialogContent></Dialog>
      <Dialog open={isOfferGroupModalOpen} onOpenChange={setIsOfferGroupModalOpen}><DialogContent><DialogHeader><DialogTitle><Award /> Offer Intelligence Grouping</DialogTitle></DialogHeader><div className="space-y-6 py-6"><div><Label>Assigned Offer Group</Label><select className="w-full h-12 rounded-xl bg-white/5 border px-4" value={selectedProduct?.offer_group_id || ""} onChange={async (e) => { try { await updateOfferGroupFn({ data: { productId: selectedProduct.id, offerGroupId: e.target.value || null } }); toast.success('Offer group updated'); queryClient.invalidateQueries({ queryKey: ["admin-products"] }); } catch { toast.error('Failed to link group'); } }}><option value="">-- NO GROUP --</option>{offerGroups?.map((group: any) => <option key={group.id} value={group.id}>{group.canonical_title}</option>)}</select></div><div className="flex gap-2"><Input placeholder="New group" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} /><Button onClick={async () => { if (!newGroupName) return; try { await saveOfferGroupFn({ data: { canonical_title: newGroupName } }); setNewGroupName(""); queryClient.invalidateQueries({ queryKey: ["admin-offer-groups"] }); toast.success('Group initialized'); } catch { toast.error('Failed to create group'); } }}><Plus /></Button></div><div className="text-xs text-muted-foreground">Offer Score compares price, discount, rating and availability.</div></div></DialogContent></Dialog>
    </div>
  );
}

function ImagePlusIcon() { return <span className="text-[11px] font-black">IMG</span>; }
