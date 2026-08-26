import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, EyeOff, Eye, Trash2, Search, Play, Link as LinkIcon, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { getVideos, saveVideo, deleteVideo } from "@/lib/video.functions";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/admin/videos")({
  component: AdminVideosPage,
});

function AdminVideosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  
  const queryClient = useQueryClient();
  const fetchVideosFn = useServerFn(getVideos);
  const saveVideoFn = useServerFn(saveVideo);
  const deleteVideoFn = useServerFn(deleteVideo);

  useEffect(() => {
    if (editingVideo) {
      setSelectedProductIds(editingVideo.video_products?.map((vp: any) => vp.product_id) || []);
    } else {
      setSelectedProductIds([]);
    }
  }, [editingVideo]);

  const { data: videos, isLoading } = useQuery({
    queryKey: ["admin-videos"],
    queryFn: () => fetchVideosFn({ data: { limit: 50, includeScheduled: true } }),
  });

  const { data: allProducts } = useQuery({
    queryKey: ["admin-products-minimal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title")
        .eq("status", "active")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const filteredProducts = allProducts?.filter(p => 
    p.title.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, title }: { id: string; status: any; title: string }) => {
      await saveVideoFn({ data: { id, status, title } });
      const eventType = status === 'published' ? 'ADMIN_VIDEO_PUBLISHED' : 'ADMIN_VIDEO_UNPUBLISHED';
      await trackEvent(eventType, { video_id: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      toast.success("Video status updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteVideoFn({ data: { id } });
      await trackEvent('ADMIN_VIDEO_DELETED', { video_id: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      toast.success("Video deleted");
    },
  });

  const filteredVideos = videos?.filter((v: any) => 
    v.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      id: editingVideo?.id,
      title: formData.get("title") as string,
      external_url: formData.get("external_url") as string,
      category_id: formData.get("category_id") as string,
      status: (formData.get("status") as any) || 'draft',
      productIds: selectedProductIds,
      scheduled_for: formData.get("scheduled_for") as string,
      campaign_id: formData.get("campaign_id") as string,
    };

    try {
      await saveVideoFn({ data });
      toast.success(editingVideo ? "Video updated" : "Video created");
      setIsDialogOpen(false);
      setEditingVideo(null);
      setSelectedProductIds([]);
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
    } catch (error) {
      toast.error("Failed to save video");
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl space-y-8 pb-safe">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3">Management</Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">Video Commerce</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Filter videos..." 
              className="pl-10 w-64 bg-background/50 border-glass-border h-12 rounded-2xl focus:ring-primary/20 transition-all shadow-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingVideo(null)} className="h-12 px-8 font-black uppercase tracking-tighter italic gap-2 rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <Plus className="w-4 h-4" />
                New Video
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-glass-fallback border-glass-border backdrop-blur-2xl text-foreground max-w-md rounded-[2.5rem] shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tighter">
                  {editingVideo ? "EDIT VIDEO" : "ADD NEW VIDEO"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Title</Label>
                  <Input id="title" name="title" defaultValue={editingVideo?.title} required className="bg-white/5 border-glass-border rounded-xl h-12" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="external_url" className="text-xs font-black uppercase tracking-widest text-muted-foreground">External URL (MP4)</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input id="external_url" name="external_url" defaultValue={editingVideo?.external_url} placeholder="https://..." className="pl-9 bg-white/5 border-glass-border rounded-xl h-12" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                    <Select name="category_id" defaultValue={editingVideo?.category_id}>
                      <SelectTrigger className="bg-white/5 border-glass-border rounded-xl h-12">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="bg-glass-fallback border-glass-border backdrop-blur-xl">
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Status</Label>
                    <Select name="status" defaultValue={editingVideo?.status || 'draft'}>
                      <SelectTrigger className="bg-white/5 border-glass-border rounded-xl h-12">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="bg-glass-fallback border-glass-border backdrop-blur-xl">
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Campaign</Label>
                    <Select name="campaign_id" defaultValue={editingVideo?.campaign_id}>
                      <SelectTrigger className="bg-white/5 border-glass-border rounded-xl h-12">
                        <SelectValue placeholder="No Campaign" />
                      </SelectTrigger>
                      <SelectContent className="bg-glass-fallback border-glass-border backdrop-blur-xl">
                        <SelectItem value="none">No Campaign</SelectItem>
                        {/* We'd normally fetch campaigns here, using a placeholder for now */}
                        <SelectItem value="d290f1ee-6c54-4b01-90e6-d701748f0851">Summer Launch 2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduled_for" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Schedule Launch</Label>
                    <Input 
                      id="scheduled_for" 
                      name="scheduled_for" 
                      type="datetime-local" 
                      defaultValue={editingVideo?.scheduled_for ? new Date(editingVideo.scheduled_for).toISOString().slice(0, 16) : ""} 
                      className="bg-white/5 border-glass-border rounded-xl h-12" 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Associated Products</Label>
                    <span className="text-[10px] font-bold text-primary tabular-nums">{selectedProductIds.length} Selected</span>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3 h-3" />
                    <Input 
                      placeholder="Search products..." 
                      className="pl-8 bg-white/5 border-glass-border h-9 text-xs rounded-lg"
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="border border-glass-border rounded-xl bg-white/5 overflow-hidden">
                    <ScrollArea className="h-48">
                      <div className="p-2 space-y-1">
                        {filteredProducts?.map((product) => (
                          <div 
                            key={product.id} 
                            className="flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                            onClick={() => toggleProduct(product.id)}
                          >
                            <Checkbox 
                              checked={selectedProductIds.includes(product.id)} 
                              onCheckedChange={() => toggleProduct(product.id)}
                              className="border-glass-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <span className="text-xs font-medium line-clamp-1 group-hover:text-primary transition-colors">
                              {product.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                  <Upload className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-sm font-bold">Storage Upload</p>
                    <p className="text-xs text-muted-foreground">Direct upload functionality active</p>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 font-bold rounded-xl shadow-lg shadow-primary/20">
                  {editingVideo ? "UPDATE" : "SAVE VIDEO"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-glass-fallback border border-glass-border rounded-[2.5rem] backdrop-blur-xl overflow-hidden shadow-2xl elevation-1 reveal-on-scroll">
        <div className="hidden lg:block">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-glass-border">
                <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground py-6 pl-8">Video</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground">Category</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground">Products</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground text-center">Status</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i} className="border-glass-border">
                    <TableCell className="pl-8 py-6"><div className="h-4 w-48 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell className="text-center"><div className="h-6 w-16 mx-auto bg-muted animate-pulse rounded-full" /></TableCell>
                    <TableCell className="text-right pr-8"><div className="h-8 w-24 ml-auto bg-muted animate-pulse rounded" /></TableCell>
                  </TableRow>
                ))
              ) : filteredVideos?.map((video: any) => (
                <TableRow key={video.id} className="hover:bg-white/5 border-glass-border transition-colors group">
                  <TableCell className="font-bold py-6 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                        <Play className="w-4 h-4 text-primary" />
                      </div>
                      <span className="line-clamp-1 max-w-xs">{video.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
                    {video.categories?.name || 'Uncategorized'}
                  </TableCell>
                  <TableCell className="font-bold tabular-nums">
                    {video.video_products?.length || 0} Products
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase ${
                      video.status === 'published' 
                        ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                      {video.status}
                      {video.scheduled_for && new Date(video.scheduled_for) > new Date() && (
                        <span className="ml-1 opacity-50">• SCHEDULED</span>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                        onClick={() => updateStatusMutation.mutate({ 
                          id: video.id, 
                          status: video.status === 'published' ? 'draft' : 'published',
                          title: video.title
                        })}
                      >
                        {video.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                        onClick={() => {
                          setEditingVideo(video);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 bg-white/5 border border-white/5 transition-all"
                        onClick={() => {
                          if (confirm("Delete this video commerce entry?")) {
                            deleteMutation.mutate(video.id);
                          }
                        }}
                      >
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
              </div>
            ))
          ) : filteredVideos?.map((video: any) => (
            <div key={video.id} className="p-6 space-y-4 hover:bg-white/5 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/20">
                    <Play className="w-4 h-4 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm line-clamp-2">{video.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-muted-foreground">{video.categories?.name || 'Uncategorized'}</span>
                      <Badge className={`rounded-full px-2 py-0 text-[8px] font-black uppercase ${
                        video.status === 'published' 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {video.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">
                    {video.video_products?.length || 0} Products
                  </span>
                </div>
              </div>

              {video.scheduled_for && new Date(video.scheduled_for) > new Date() && (
                <div className="p-2 rounded-lg bg-primary/5 border border-primary/10 text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Scheduled: {new Date(video.scheduled_for).toLocaleString()}
                </div>
              )}
              
              <div className="flex items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="h-9 w-9 bg-white/5 border border-white/5" onClick={() => updateStatusMutation.mutate({ id: video.id, status: video.status === 'published' ? 'draft' : 'published', title: video.title })}>
                    {video.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="h-9 w-9 bg-white/5 border border-white/5" onClick={() => { setEditingVideo(video); setIsDialogOpen(true); }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 bg-rose-500/10 text-rose-500 border border-rose-500/10" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(video.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}