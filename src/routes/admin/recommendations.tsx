import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { 
  getCategoryHighlightsAdmin, 
  saveManualHighlight, 
  deleteHighlight,
  recalculateCategoryHighlights 
} from "@/lib/highlights.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Target, 
  Zap, 
  RefreshCcw, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  Lock,
  Unlock,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/recommendations")({
  component: AdminRecommendationsPage,
});

function AdminRecommendationsPage() {
  const queryClient = useQueryClient();
  const getAdminData = useServerFn(getCategoryHighlightsAdmin);
  const saveManual = useServerFn(saveManualHighlight);
  const removeHighlight = useServerFn(deleteHighlight);
  const forceRecalculate = useServerFn(recalculateCategoryHighlights);

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedRank, setSelectedRank] = useState<string>("1");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const { data } = useSuspenseQuery({
    queryKey: ["admin-highlights-data"],
    queryFn: () => getAdminData({ data: undefined }),
  });

  const recalculateMutation = useMutation({
    mutationFn: () => forceRecalculate({ data: undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-highlights-data"] });
      toast.success("Category highlights recalculated");
    }
  });

  const saveMutation = useMutation({
    mutationFn: (vars: { categoryId: string; productId: string; rank: number }) => saveManual({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-highlights-data"] });
      toast.success("Manual override applied");
      setSelectedProduct("");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeHighlight({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-highlights-data"] });
      toast.success("Highlight removed");
    }
  });

  const handleProductSearch = async (query: string) => {
    if (query.length < 3) return;
    setIsSearching(true);
    const { data: products } = await supabase
      .from("products")
      .select("id, title, current_price")
      .ilike("title", `%${query}%`)
      .limit(5);
    setSearchResults(products || []);
    setIsSearching(false);
  };

  return (
    <div className="container mx-auto py-12 px-8 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <Badge className="bg-primary/10 text-primary border-primary/20 font-black px-4 py-1 uppercase tracking-widest text-[10px]">Neural Intelligence</Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-none">
            Offer <span className="text-primary">Intelligence</span>
          </h1>
          <p className="text-muted-foreground font-bold tracking-tight max-w-2xl">
            Manage automatic category highlights and editorial overrides. The engine recalculates scores every X hours based on conversion and offer value.
          </p>
        </div>
        
        <Button 
          onClick={() => recalculateMutation.mutate()}
          disabled={recalculateMutation.isPending}
          className="h-14 px-8 rounded-2xl font-black uppercase tracking-tighter italic gap-2 shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <RefreshCcw className={`w-5 h-5 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
          Force Recalculate
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Section */}
        <Card className="bg-glass-fallback border-glass-border backdrop-blur-xl rounded-[2.5rem] p-8 space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Editorial Override</h2>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Manually promote a specific product to a category rank.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-glass-border font-bold uppercase tracking-widest text-xs">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-glass-fallback backdrop-blur-3xl border-glass-border rounded-xl">
                  {data.categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id} className="font-bold uppercase tracking-widest text-[10px]">{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Rank Position</label>
              <Select value={selectedRank} onValueChange={setSelectedRank}>
                <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-glass-border font-bold uppercase tracking-widest text-xs">
                  <SelectValue placeholder="Select Rank" />
                </SelectTrigger>
                <SelectContent className="bg-glass-fallback backdrop-blur-3xl border-glass-border rounded-xl">
                  <SelectItem value="1" className="font-bold uppercase tracking-widest text-[10px]">Rank #1 (Hero)</SelectItem>
                  <SelectItem value="2" className="font-bold uppercase tracking-widest text-[10px]">Rank #2</SelectItem>
                  <SelectItem value="3" className="font-bold uppercase tracking-widest text-[10px]">Rank #3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Product Search</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Type product name..."
                  className="w-full h-14 rounded-2xl bg-white/5 border border-glass-border px-6 font-bold text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onChange={(e) => handleProductSearch(e.target.value)}
                />
                {isSearching && <div className="absolute right-4 top-4 animate-spin"><RefreshCcw className="w-5 h-5 text-primary/30" /></div>}
              </div>
              
              {searchResults.length > 0 && (
                <div className="mt-2 rounded-2xl border border-glass-border overflow-hidden bg-black/40">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProduct(p.id)}
                      className={`w-full p-4 text-left text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-primary/10 ${selectedProduct === p.id ? 'bg-primary/20 text-primary' : ''}`}
                    >
                      {p.title} — ${p.current_price}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button 
              disabled={!selectedCategory || !selectedProduct || saveMutation.isPending}
              onClick={() => saveMutation.mutate({ 
                categoryId: selectedCategory, 
                productId: selectedProduct, 
                rank: parseInt(selectedRank) 
              })}
              className="w-full h-16 rounded-2xl font-black uppercase tracking-tighter italic gap-2 shadow-2xl shadow-primary/20"
            >
              <Plus className="w-5 h-5" />
              Apply Protocol
            </Button>
          </div>
        </Card>

        {/* Status Table Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Current Highlights</h2>
            </div>
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest opacity-50">Heuristic Node Status</Badge>
          </div>

          <Card className="bg-glass-fallback border-glass-border backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-glass-border hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 px-6">Category</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-14">Rank</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-14">Product</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-14">Score</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-14">Type</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 px-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.highlights.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs font-black uppercase tracking-widest opacity-30">
                      No active highlights. Trigger recalculation to initialize.
                    </TableCell>
                  </TableRow>
                ) : data.highlights.map((h: any) => (
                  <TableRow key={h.id} className="border-glass-border hover:bg-white/5 transition-colors">
                    <TableCell className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {data.categories.find((c: any) => c.id === h.category_id)?.name || 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-black">#{h.rank}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 overflow-hidden">
                          {h.products?.images?.[0] && <img src={h.products.images[0]} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tight line-clamp-1 max-w-[150px]">
                          {h.products?.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-black text-primary italic">{(h.offer_score || 0).toFixed(1)}</span>
                    </TableCell>
                    <TableCell>
                      {h.is_manual_override ? (
                        <div className="flex items-center gap-1.5 text-blue-500">
                          <Lock className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Editorial</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-green-500">
                          <Unlock className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Auto</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-6 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteMutation.mutate(h.id)}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      {/* Neural Logic Info */}
      <Card className="bg-primary/5 border-primary/20 backdrop-blur-xl rounded-[2rem] p-8 border-dashed">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary/10 rounded-xl">
            <AlertCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-primary">Automation Protocol 7.2-CAT</h3>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                The "Best in Category" algorithm uses the <span className="text-primary font-bold italic">Offer Score</span> calculation. 
                Manual overrides are locked and protected from automatic recalculation until manually deleted or modified.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
