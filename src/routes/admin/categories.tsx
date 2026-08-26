import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCategoriesAdmin, saveCategory, deleteCategory } from "@/lib/admin_intel.functions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, FolderIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const getCats = useServerFn(getCategoriesAdmin);
  const saveCat = useServerFn(saveCategory);
  const deleteCat = useServerFn(deleteCategory);
  const queryClient = useQueryClient();

  const { data: categories } = useSuspenseQuery({
    queryKey: ["admin-categories"],
    queryFn: () => getCats({ data: undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCat({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category deleted");
    }
  });

  return (
    <div className="container mx-auto py-8 lg:py-12 px-4 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3">Structure</Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">Categories</h1>
        </div>
        <Button className="h-12 px-8 font-black uppercase tracking-tighter italic gap-2 rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus className="w-5 h-5" />
          Add Category
        </Button>
      </div>

      <div className="bg-glass-fallback border border-glass-border rounded-[2.5rem] backdrop-blur-xl overflow-hidden elevation-1 shadow-2xl reveal-on-scroll">
        <div className="hidden lg:block">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-glass-border">
                <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground py-6 pl-8">Name</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground">Slug</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground">Parent</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id} className="hover:bg-white/5 border-glass-border transition-colors group">
                  <TableCell className="font-bold py-6 pl-8">
                    <div className="flex items-center gap-3">
                      <FolderIcon className="w-4 h-4 text-primary" />
                      {cat.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground font-mono text-xs">{cat.slug}</TableCell>
                  <TableCell className="text-muted-foreground text-xs uppercase font-black">
                    {cat.parent_id ? categories.find(c => c.id === cat.parent_id)?.name : "Root"}
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 bg-white/5 border border-white/5 transition-all"
                        onClick={() => {
                          if (confirm("Delete this category?")) deleteMutation.mutate(cat.id);
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
          {categories.map((cat) => (
            <div key={cat.id} className="p-6 space-y-4 hover:bg-white/5 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <FolderIcon className="w-4 h-4 text-primary" />
                  <div>
                    <h3 className="font-bold text-sm">{cat.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono">{cat.slug}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[8px] uppercase font-black opacity-50 border-glass-border">
                  {cat.parent_id ? categories.find(c => c.id === cat.parent_id)?.name : "Root"}
                </Badge>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button size="icon" variant="ghost" className="h-9 w-9 bg-white/5 border border-white/5">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-9 w-9 bg-rose-500/10 text-rose-500 border border-rose-500/10" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(cat.id); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
