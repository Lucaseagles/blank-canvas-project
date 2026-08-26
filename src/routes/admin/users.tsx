import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Shield, Calendar, Mail } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // In a real app, we would query auth.users via a secure view or edge function
      // For now, we query the public profiles table which mirrors users
      const { data, error } = await supabase
        .from("profiles")
        .select("*, user_roles(role)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl space-y-8">
      <div className="space-y-2">
        <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3">Identity Pipeline</Badge>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">User Control</h1>
      </div>

      <div className="bg-glass-fallback border border-glass-border rounded-[2.5rem] backdrop-blur-xl overflow-hidden shadow-2xl reveal-on-scroll">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-glass-border">
              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground py-6 pl-8">Operator</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground">Access Level</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground">Identity Sector</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground text-right pr-8">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i} className="border-glass-border">
                  <TableCell className="pl-8 py-6"><div className="h-4 w-48 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell className="text-right pr-8"><div className="h-4 w-20 ml-auto bg-muted animate-pulse rounded" /></TableCell>
                </TableRow>
              ))
            ) : users?.map((user) => (
              <TableRow key={user.id} className="hover:bg-white/5 border-glass-border transition-colors group">
                <TableCell className="font-bold py-6 pl-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="font-black uppercase tracking-tight italic">{user.display_name || 'Anonymous'}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">UID: {user.user_id?.slice(0, 8)}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="rounded-full px-3 py-0.5 text-[10px] font-black uppercase bg-primary/10 text-primary border-primary/20">
                    {(user.user_roles as any)?.[0]?.role || 'User'}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-muted-foreground text-xs uppercase italic flex items-center gap-2">
                  <Shield size={12} className="text-primary/40" />
                  Protocol: {(user.user_roles as any)?.[0]?.role === 'owner' ? 'ROOT' : 'STANDARD'}
                </TableCell>
                <TableCell className="text-right pr-8 font-bold tabular-nums text-xs text-muted-foreground">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
