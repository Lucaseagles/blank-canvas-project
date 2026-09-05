import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, BookOpen, Headphones, Search, Sparkles } from "lucide-react";
import { SupportKnowledgeBase } from "@/support/SupportKnowledgeBase";
import { SupportGaps } from "@/support/SupportGaps";
import { SupportAnalytics } from "@/support/SupportAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/support")({ component: SupportAdminPage });

function SupportAdminPage() {
  const [activeTab, setActiveTab] = useState("knowledge");
  const initialQuestion = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("question")?.trim().slice(0, 300) ?? "";
  }, []);

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-8 lg:py-12">
      <header className="relative overflow-hidden rounded-[2rem] border border-glass-border bg-glass-fallback p-6 backdrop-blur-xl lg:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              <Headphones className="h-3.5 w-3.5" /> Central de Suporte
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter lg:text-5xl">Support Command Center</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-muted-foreground">Gerencie conhecimento, identifique lacunas e acompanhe a operação do atendimento em um único lugar.</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground lg:flex">
            <Sparkles className="h-4 w-4 text-primary" /> Fonte única de conhecimento
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-2xl border border-glass-border bg-glass-fallback p-1.5 backdrop-blur-xl sm:grid-cols-3">
          <TabsTrigger value="knowledge" className="h-11 gap-2 rounded-xl text-xs font-black uppercase tracking-wide data-[state=active]:bg-background data-[state=active]:shadow-lg"><BookOpen className="h-4 w-4" /> Base de Conhecimento</TabsTrigger>
          <TabsTrigger value="gaps" className="h-11 gap-2 rounded-xl text-xs font-black uppercase tracking-wide data-[state=active]:bg-background data-[state=active]:shadow-lg"><Search className="h-4 w-4" /> Lacunas</TabsTrigger>
          <TabsTrigger value="analytics" className="h-11 gap-2 rounded-xl text-xs font-black uppercase tracking-wide data-[state=active]:bg-background data-[state=active]:shadow-lg"><BarChart3 className="h-4 w-4" /> Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge" className="mt-0"><SupportKnowledgeBase initialQuestion={initialQuestion} /></TabsContent>
        <TabsContent value="gaps" className="mt-0"><SupportGaps /></TabsContent>
        <TabsContent value="analytics" className="mt-0"><SupportAnalytics /></TabsContent>
      </Tabs>
    </div>
  );
}
