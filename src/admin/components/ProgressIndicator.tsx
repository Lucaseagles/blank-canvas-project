import { Loader2 } from "lucide-react";
export function ProgressIndicator({label="Processando..."}:{label?:string}){return <div className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin"/>{label}</div>}
