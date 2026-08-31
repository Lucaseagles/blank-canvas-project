import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { listBundles, saveBundle, removeBundle } from '@/lib/relationships.functions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Package, Eye } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute('/admin/bundles')({ component: AdminBundlesPage });

function AdminBundlesPage() {
  const queryClient = useQueryClient();
  const fetchBundles = useServerFn(listBundles);
  const saveBundleFn = useServerFn(saveBundle);
  const deleteBundleFn = useServerFn(removeBundle);
  const [isModalOpen,setIsModalOpen]=useState(false);
  const [editingBundle,setEditingBundle]=useState<any>(null);
  const [formData,setFormData]=useState({title:'',slug:'',description:'',image_url:'',is_active:true,bundle_discount_price:''});
  const {data:bundles,isLoading}=useQuery({queryKey:['admin-bundles'],queryFn:()=>fetchBundles()});
  const mutation=useMutation({mutationFn:(data:any)=>saveBundleFn({data}),onSuccess:()=>{queryClient.invalidateQueries({queryKey:['admin-bundles']});toast.success('Bundle saved successfully');setIsModalOpen(false);setEditingBundle(null);reset();},onError:()=>toast.error('Failed to save bundle')});
  const deleteMutation=useMutation({mutationFn:(id:string)=>deleteBundleFn({data:id}),onSuccess:()=>{queryClient.invalidateQueries({queryKey:['admin-bundles']});toast.success('Bundle removed')}});
  const reset=()=>setFormData({title:'',slug:'',description:'',image_url:'',is_active:true,bundle_discount_price:''});
  const handleSubmit=(e:React.FormEvent)=>{e.preventDefault();const discount=formData.bundle_discount_price.trim();mutation.mutate({...formData,id:editingBundle?.id,bundle_discount_price:discount?Number(discount):undefined});};
  const handleEdit=(bundle:any)=>{setEditingBundle(bundle);setFormData({title:bundle.title,slug:bundle.slug,description:bundle.description||'',image_url:bundle.image_url||'',is_active:bundle.is_active,bundle_discount_price:bundle.bundle_discount_price!=null?String(bundle.bundle_discount_price):''});setIsModalOpen(true);};
  if(isLoading)return <div className="p-8">Loading...</div>;
  return <div className="p-8 space-y-8 max-w-7xl mx-auto">
    <div className="flex justify-between items-end"><div className="space-y-2"><Badge variant="outline" className="px-4 py-1 rounded-full border-primary/30 bg-primary/5 text-primary glass-surface">COMMANDER INTERFACE</Badge><h1 className="text-4xl font-black italic uppercase tracking-tighter">Bundle Management</h1><p className="text-muted-foreground font-medium">Curate premium product kits and editorial collections.</p></div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}><DialogTrigger asChild><Button className="h-12 rounded-xl font-black uppercase tracking-widest gap-2" onClick={()=>{setEditingBundle(null);reset()}}><Plus className="w-5 h-5"/>Create Bundle</Button></DialogTrigger>
        <DialogContent className="sm:max-w-[500px] bg-glass backdrop-blur-3xl border-glass-border"><form onSubmit={handleSubmit}><DialogHeader><DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">{editingBundle?'Edit Bundle':'New Curated Collection'}</DialogTitle></DialogHeader>
          <div className="grid gap-5 py-6">
            <div className="space-y-2"><Label>Title</Label><Input value={formData.title} onChange={e=>setFormData({...formData,title:e.target.value})} required/></div>
            <div className="space-y-2"><Label>URL Slug</Label><Input value={formData.slug} onChange={e=>setFormData({...formData,slug:e.target.value})} required/></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={e=>setFormData({...formData,description:e.target.value})}/></div>
            <div className="space-y-2"><Label>Preço real do combo (opcional)</Label><Input type="number" min="0" step="0.01" value={formData.bundle_discount_price} onChange={e=>setFormData({...formData,bundle_discount_price:e.target.value})} placeholder="Ex.: 199.90"/><p className="text-xs text-muted-foreground">Só será exibido se for menor que a soma real dos produtos.</p></div>
          </div><DialogFooter><Button type="submit" className="w-full h-12 rounded-xl font-black uppercase tracking-widest" disabled={mutation.isPending}>{mutation.isPending?'Processing...':'Deploy Bundle'}</Button></DialogFooter>
        </form></DialogContent></Dialog>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{bundles?.map((bundle:any)=><div key={bundle.id} className="group relative bg-glass border border-glass-border rounded-3xl overflow-hidden shadow-xl hover:border-primary/50 transition-all p-6 space-y-6"><div className="flex justify-between items-start"><div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20"><Package className="w-7 h-7"/></div><div className="flex gap-2"><Button variant="ghost" size="icon" onClick={()=>handleEdit(bundle)}><Edit2 className="w-4 h-4"/></Button><Button variant="ghost" size="icon" className="text-red-500" onClick={()=>deleteMutation.mutate(bundle.id)}><Trash2 className="w-4 h-4"/></Button></div></div><div className="space-y-2"><h3 className="text-xl font-black uppercase italic tracking-tighter">{bundle.title}</h3><p className="text-sm text-muted-foreground line-clamp-2">{bundle.description||'No description provided.'}</p>{bundle.bundle_discount_price!=null&&<Badge variant="secondary" className="font-black">Combo: R$ {Number(bundle.bundle_discount_price).toLocaleString('pt-BR',{minimumFractionDigits:2})}</Badge>}</div><div className="pt-4 flex items-center justify-between border-t border-glass-border"><Badge variant={bundle.is_active?'secondary':'outline'}>{bundle.is_active?'Active Protocol':'Offline'}</Badge><Button variant="ghost" size="sm" asChild><a href={`/bundle/${bundle.slug}`} target="_blank" rel="noreferrer"><Eye className="w-3.5 h-3.5"/>Preview</a></Button></div></div>)}</div>
  </div>;
}
