import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Construction, Timer, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminPipelinePlaceholder = ({ title, sprint }: { title: string; sprint: number }) => (
  <div className="container mx-auto py-12 px-8 min-h-[80vh] flex flex-col items-center justify-center text-center space-y-8">
    <div className="relative">
      <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
      <div className="relative w-24 h-24 rounded-full bg-glass border border-glass-border flex items-center justify-center mb-4">
        <Construction className="w-12 h-12 text-primary" />
      </div>
    </div>
    
    <div className="space-y-4 max-w-xl">
      <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3">Neural Pipeline</Badge>
      <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-none">
        {title} <br />
        <span className="text-primary">System</span>
      </h1>
      <p className="text-xl text-muted-foreground font-medium tracking-tight">
        This protocol is scheduled for deployment in <span className="text-foreground font-bold">Sprint {sprint}</span> of the development roadmap.
      </p>
    </div>

    <div className="flex flex-col sm:flex-row gap-4 pt-8">
      <div className="h-14 px-8 rounded-2xl border border-glass-border bg-glass flex items-center gap-3 font-black uppercase tracking-tighter italic text-xs">
        <Timer className="w-4 h-4 text-primary" />
        ETA: Q{Math.ceil(sprint/4)} 2026
      </div>
      <Button className="h-14 px-8 rounded-2xl font-black uppercase tracking-tighter italic gap-2 shadow-2xl shadow-primary/20">
        View Roadmap <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  </div>
);

export const Route = createFileRoute("/admin/settings")({ component: () => <AdminPipelinePlaceholder title="Core Config" sprint={16} /> });
