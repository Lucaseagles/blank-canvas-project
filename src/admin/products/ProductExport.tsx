import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportProductsToCSV } from "@/lib/supabase/importExport";
import { toast } from "sonner";
import { useState } from "react";

interface ProductExportProps { status?: string; categoryId?: string; }

export function ProductExport({ status = "all", categoryId = "all" }: ProductExportProps) {
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try {
      const csv = await exportProductsToCSV({ status, category_id: categoryId });
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `produtos_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV exportado com sucesso");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível exportar"); }
    finally { setLoading(false); }
  };
  return <Button variant="outline" onClick={run} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Download />}{loading ? "Exportando..." : "Exportar"}</Button>;
}
