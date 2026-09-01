import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, EyeOff, Eye, Trash2, Search, Link2, TrendingUp, Award, Layers } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useServerFn } from "@tanstack/react-start";
import { addRelationship, removeRelationship, getRelatedProducts } from "@/lib/relationships.functions";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { getOfferGroups, saveOfferGroup, updateProductOfferGroup } from "@/lib/admin_intel.functions";


export const Route = createFileRoute("/admin/products")({
  component: AdminProductsPage,
});

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


  const { data: currentRelationships } = useQuery({
    queryKey: ['product-rels', selectedProduct?.id],
    queryFn: () => getRelFn({ data: { productId: selectedProduct.id } }),
    enabled: !!selectedProduct?.id
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, marketplaces(name)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: offerGroups } = useQuery({
    queryKey: ["admin-offer-groups"],
    queryFn: () => getOfferGroupsFn({ data: {} as any })
  });



  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("products")
        .update({ status })
        .eq("id", id);
      
      if (error) throw error;
      
      const eventType = status === 'published' ? 'ADMIN_PRODUCT_PUBLISHED' : 'ADMIN_PRODUCT_UNPUBLISHED';
      await trackEvent(eventType, { product_id: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product status updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    }
  });

  const filteredProducts = products?.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl space-y-8 pb-safe">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3">Management</Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">Product Catalog</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Filter products..." 
              className="pl-10 w-64 bg-background/50 border-glass-border h-12 rounded-2xl focus:ring-primary/20 transition-all shadow-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="h-12 px-8 font-black uppercase tracking-tighter italic gap-2 rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Plus className="w-4 h-4" />
            Add New
          </Button>
        </div>
      </div>

      <div className="bg-glass-fallback border border-glass-border rounded-[2.5rem] backdrop-blur-xl overflow-hidden shadow-2xl elevation-1 reveal-on-scroll">
        <div className="hidden lg:block">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-glass-border">
                <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground py-6 pl-8">Product</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground">Marketplace</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground">Price</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground text-center">Score</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground text-center">Status</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i} className="border-glass-border">
                    <TableCell className="pl-8 py-6"><div className="h-4 w-48 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell className="text-center"><div className="h-6 w-16 mx-auto bg-muted animate-pulse rounded-full" /></TableCell>
                    <TableCell className="text-right pr-8"><div className="h-8 w-24 ml-auto bg-muted animate-pulse rounded" /></TableCell>
                  </TableRow>
                ))
              ) : filteredProducts?.map((product) => (
                <TableRow key={product.id} className="hover:bg-white/5 border-glass-border transition-colors group">
                  <TableCell className="font-bold py-6 pl-8">
                    <div className="flex items-center gap-4">
                      {product.images?.[0] && (
                        <img src={product.images[0]} alt="" loading="lazy" decoding="async" className="w-12 h-12 rounded-xl object-cover bg-muted border border-glass-border group-hover:scale-110 transition-transform duration-500" />
                      )}
                      <span className="line-clamp-1 max-w-xs">{product.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground uppercase text-xs">
                    {(product.marketplaces as any)?.name || 'External'}
                  </TableCell>
                  <TableCell className="font-bold tabular-nums">
                    R$ {(product.current_price ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-black tabular-nums">{(product as any).offer_score?.toFixed(1) || '0.0'}</span>
                      {(product as any).is_best_offer && (
                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] px-1 py-0 h-4">BEST</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase ${
                      product.status === 'published' 
                        ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                        title="Offer Intelligence Grouping"
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsOfferGroupModalOpen(true);
                        }}
                      >
                        <Layers className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                        title="Manage Relationships"
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsRelModalOpen(true);
                        }}
                      >
                        <Link2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                        onClick={() => updateStatusMutation.mutate({ 
                          id: product.id, 
                          status: product.status === 'published' ? 'draft' : 'published' 
                        })}
                      >
                        {product.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 bg-white/5 border border-white/5 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="lg:hidden divide-y divide-glass-border">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="p-6 space-y-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted" />
                  <div className="h-4 w-32 bg-muted rounded" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
            ))
          ) : filteredProducts?.map((product) => (
            <div key={product.id} className="p-6 space-y-4 hover:bg-white/5 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {product.images?.[0] && (
                    <img src={product.images[0]} alt="" loading="lazy" decoding="async" className="w-12 h-12 rounded-xl object-cover bg-muted border border-glass-border" />
                  )}
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm line-clamp-2">{product.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-muted-foreground">{(product.marketplaces as any)?.name || 'External'}</span>
                      <Badge className={`rounded-full px-2 py-0 text-[8px] font-black uppercase ${
                        product.status === 'published' 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {product.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-bold text-xs">R$ {(product.current_price ?? 0).toLocaleString('pt-BR')}</span>
                  <Badge variant="outline" className="text-[8px] px-1 py-0 border-glass-border opacity-50 uppercase tracking-tighter">
                    Score: {(product as any).offer_score?.toFixed(1) || '0.0'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="h-9 w-9 bg-white/5 border border-white/5" onClick={() => { setSelectedProduct(product); setIsOfferGroupModalOpen(true); }}>
                    <Layers className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 bg-white/5 border border-white/5" onClick={() => { setSelectedProduct(product); setIsRelModalOpen(true); }}>
                    <Link2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 bg-white/5 border border-white/5" onClick={() => updateStatusMutation.mutate({ id: product.id, status: product.status === 'published' ? 'draft' : 'published' })}>
                    {product.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="h-9 w-9 bg-white/5 border border-white/5">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 bg-rose-500/10 text-rose-500 border border-rose-500/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isRelModalOpen} onOpenChange={setIsRelModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-glass backdrop-blur-3xl border-glass-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
              Product Relationships: {selectedProduct?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Relationship Type</Label>
                <select 
                  className="w-full h-12 rounded-xl bg-white/5 border border-glass-border px-4 font-bold"
                  value={relType}
                  onChange={(e: any) => setRelType(e.target.value)}
                >
                  <option value="CROSS_SELL" className="bg-background">Cross-sell (Bought with)</option>
                  <option value="UPSELL" className="bg-background">Upsell (Premium version)</option>
                  <option value="DOWNSELL" className="bg-background">Downsell (Alternative)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Related Product ID</Label>
                <Input 
                  placeholder="Paste UUID"
                  className="h-12 bg-white/5 border-glass-border font-mono text-xs"
                  value={relatedProductId}
                  onChange={e => setRelatedProductId(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              className="w-full h-12 rounded-xl font-black uppercase tracking-widest"
              onClick={async () => {
                try {
                  await addRelFn({ data: { productId: selectedProduct.id, relatedProductId, type: relType } });
                  toast.success('Relationship deployed');
                  setRelatedProductId('');
                  queryClient.invalidateQueries({ queryKey: ['product-rels', selectedProduct.id] });
                } catch (e) {
                  toast.error('Failed to deploy relationship');
                }
              }}
            >
              Link Products
            </Button>

            <div className="space-y-4 pt-4 border-t border-glass-border">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Active Links</h4>
              {['cross_sell', 'upsell', 'downsell'].map((type: any) => (
                <div key={type} className="space-y-2">
                  <Badge variant="outline" className="text-[9px] uppercase tracking-widest">{type}</Badge>
                  {(currentRelationships as any)?.[type]?.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                      <span className="text-sm font-bold truncate pr-4">{p.title}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                        onClick={async () => {
                          // This needs relationship ID, which getProductRelationships should return
                          // For simplicity, we'll re-run migrations to add RLS policies and fix the query if needed
                          toast.info('Feature pending full ID mapping');
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isOfferGroupModalOpen} onOpenChange={setIsOfferGroupModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-glass backdrop-blur-3xl border-glass-border rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <Award className="text-amber-500" />
              Offer Intelligence Grouping
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
              <h4 className="text-sm font-black uppercase tracking-tight italic">Product Instance</h4>
              <p className="text-xs text-muted-foreground line-clamp-1">{selectedProduct?.title}</p>
              <div className="flex gap-2 items-center">
                <Badge variant="outline" className="text-[9px] uppercase tracking-widest italic">{(selectedProduct?.marketplaces as any)?.name}</Badge>
                <span className="text-xs font-bold italic">R$ {selectedProduct?.current_price.toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Assigned Offer Group</Label>
              <select 
                className="w-full h-14 rounded-2xl bg-white/5 border border-glass-border px-4 font-black uppercase italic tracking-tighter text-sm focus:ring-primary/20 transition-all"
                value={selectedProduct?.offer_group_id || ""}
                onChange={async (e) => {
                  try {
                    await updateOfferGroupFn({ 
                      data: { 
                        productId: selectedProduct.id, 
                        offerGroupId: e.target.value || null 
                      } 
                    });
                    toast.success('Offer group intelligence updated');
                    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
                  } catch (e) {
                    toast.error('Failed to link group');
                  }
                }}
              >
                <option value="" className="bg-background">-- NO GROUP (STANDALONE) --</option>
                {offerGroups?.map((group: any) => (
                  <option key={group.id} value={group.id} className="bg-background">
                    {group.canonical_title}
                  </option>
                ))}
              </select>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                * Products in the same group are compared by Offer Score.
              </p>
            </div>

            <div className="space-y-4 pt-6 border-t border-glass-border">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Create New Intelligence Group</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. iPhone 15 Pro 128GB"
                  className="h-14 bg-white/5 border-glass-border font-black uppercase tracking-tighter rounded-2xl"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                />
                <Button 
                  className="h-14 px-6 rounded-2xl font-black uppercase italic tracking-tighter"
                  onClick={async () => {
                    if (!newGroupName) return;
                    try {
                      await saveOfferGroupFn({ data: { canonical_title: newGroupName } });
                      toast.success('Group initialized');
                      setNewGroupName("");
                      queryClient.invalidateQueries({ queryKey: ["admin-offer-groups"] });
                    } catch (e) {
                      toast.error('Failed to create group');
                    }
                  }}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
            <TrendingUp className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-[10px] font-black uppercase tracking-tight text-amber-500">Heuristic Engine Active</h5>
              <p className="text-[9px] text-muted-foreground leading-relaxed font-medium">
                Offer Score calculates the winner based on price, discount, rating, and availability. Selo <span className="text-amber-500 font-bold italic">"Melhor Oferta"</span> is automatically applied.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
