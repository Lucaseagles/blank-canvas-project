import { useState } from "react";
import { Eye, EyeOff, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { saveIntegrationSecret } from "@/lib/integrations.functions";
import { PLATFORMS } from "../config/platforms";

export function CredentialForm({ platformId, onSuccess, onCancel }: { platformId: string; onSuccess: () => void; onCancel: () => void }) {
  const platform = PLATFORMS[platformId];
  const save = saveIntegrationSecret;
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  if (!platform) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const missing = platform.credentialFields.find((field) => field.required && !values[field.key]?.trim());
    if (missing) { toast.error(`${missing.label} é obrigatório.`); return; }
    setSaving(true);
    try {
      for (const field of platform.credentialFields) {
        const value = values[field.key]?.trim();
        if (!value) continue;
        await save({ data: { platformId, fieldKey: field.key, value } });
      }
      toast.success(`${platform.name}: credenciais salvas no Vault.`);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar as credenciais.");
    } finally { setSaving(false); }
  };

  return <form onSubmit={submit} className="space-y-6 rounded-[2rem] border border-glass-border bg-glass-fallback p-6 backdrop-blur-xl">
    <div><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-black text-white" style={{ backgroundColor: platform.color }}>{platform.icon}</div><div><h2 className="text-xl font-black">{platform.name}</h2><p className="text-xs text-muted-foreground">Os valores nunca são exibidos novamente após o envio.</p></div></div><a href={platform.docsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-primary hover:underline">Abrir documentação oficial ↗</a></div>
    <div className="space-y-4">{platform.credentialFields.map((field) => <div key={field.key} className="space-y-2"><Label htmlFor={`${platformId}-${field.key}`}>{field.label}{field.required && <span className="ml-1 text-destructive">*</span>}</Label><div className="relative"><Input id={`${platformId}-${field.key}`} type={field.type === "password" && !visible[field.key] ? "password" : "text"} value={values[field.key] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} placeholder={field.placeholder} autoComplete="off" className="h-11 rounded-xl pr-11" />{field.type === "password" && <button type="button" aria-label={visible[field.key] ? "Ocultar valor" : "Mostrar valor"} onClick={() => setVisible((current) => ({ ...current, [field.key]: !current[field.key] }))} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:text-foreground">{visible[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}</div>{field.helpText && <p className="text-[11px] text-muted-foreground">{field.helpText}</p>}</div>)}</div>
    <div className="flex gap-2"><Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onCancel}>Cancelar</Button><Button type="submit" disabled={saving} className="flex-1 rounded-xl">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar credenciais</Button></div>
  </form>;
}
