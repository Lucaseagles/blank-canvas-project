import { createFileRoute } from "@tanstack/react-router";
import { exportProductsToCSV } from "@/lib/supabase/importExport";

export const Route=createFileRoute("/admin/products/export")({
 component:()=>{const run=async()=>{const csv=await exportProductsToCSV();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`produtos_${new Date().toISOString().slice(0,10)}.csv`;a.click()};return <div className="container mx-auto py-12 px-4"><div className="rounded-3xl border border-glass-border p-8 text-center space-y-4"><h1 className="text-2xl font-black">Exportar produtos</h1><p className="text-muted-foreground">Gere um CSV com o catálogo atual.</p><button className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold" onClick={run}>Baixar CSV</button></div></div>}
});
