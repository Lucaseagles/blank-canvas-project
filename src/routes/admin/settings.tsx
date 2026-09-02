import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminSettings, getAdminAuditLog, updateAdminSetting } from "@/lib/admin-settings.functions";

export default function AdminSettingsPage() {
  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState("");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(0);
  const settingsQuery = useQuery({ queryKey: ["admin-settings"], queryFn: () => getAdminSettings() });
  const auditQuery = useQuery({ queryKey: ["admin-audit", page, actionType, entityType], queryFn: () => getAdminAuditLog({ data: { page, pageSize: 25, actionType: actionType || undefined, entityType: entityType || undefined } }) });
  const filtered = (settingsQuery.data ?? []).filter((section) => !search || `${section.label} ${section.category}`.toLowerCase().includes(search.toLowerCase()));
  const categories = [...new Set(filtered.map((section) => section.category))];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div><h1 className="text-2xl font-black">Configurações Globais</h1><p className="text-sm text-muted-foreground">Fonte única sobre as configurações reais do sistema.</p></div>
      <Tabs defaultValue="settings">
        <TabsList><TabsTrigger value="settings">Configurações</TabsTrigger><TabsTrigger value="audit">Auditoria</TabsTrigger></TabsList>
        <TabsContent value="settings" className="space-y-6">
          <Input placeholder="Buscar configuração..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {categories.map((category) => <section key={category} className="space-y-3"><h2 className="text-sm font-black uppercase tracking-wider">{category}</h2>{filtered.filter((s) => s.category === category).map((section) => <div key={section.key} className="rounded-2xl border p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-bold">{section.label}</h3>{!section.available && <Badge variant="destructive">Indisponível</Badge>}</div><div className="space-y-3">{section.rows.map((row, index) => <SettingRow key={String((row as Record<string, unknown>)["id"] ?? index)} row={row as Record<string, unknown>} editable={section.editable} pending={false} onSave={() => undefined} />)}</div></div>)}</section>)}
        </TabsContent>
        <TabsContent value="audit"><AuditTable data={auditQuery.data} loading={auditQuery.isLoading} page={page} setPage={(next) => setPage(Math.max(0, next))} actionType={actionType} entityType={entityType} setActionType={(value) => { setActionType(value); setPage(0); }} setEntityType={(value) => { setEntityType(value); setPage(0); }} /></TabsContent>
      </Tabs>
    </div>
  );
}

function SettingRow({ row, editable, pending, onSave }: { row: Record<string, unknown>; editable: readonly string[]; pending: boolean; onSave: (patch: Record<string, unknown>) => void }) {
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const changed = Object.keys(draft).length > 0;
  const displayName = row["name"] ?? row["signal_key"] ?? row["action_key"] ?? row["rule_key"] ?? row["key"] ?? row["id"];
  const updatedAt = row["updated_at"];
  const rowId = row["id"];
  return <div className="space-y-4 rounded-2xl bg-background/50 p-4"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold">{String(displayName)}</p><p className="text-[10px] text-muted-foreground">Atualizado: {updatedAt ? new Date(String(updatedAt)).toLocaleString() : "não informado"}</p></div><Badge variant="outline">ID {String(rowId).slice(0, 8)}</Badge></div><div className="grid grid-cols-1 gap-3 md:grid-cols-2">{editable.map((key) => { const value = draft[key] ?? row[key]; if (typeof value === "boolean") return <label key={key} className="flex items-center justify-between rounded-xl border p-3"><span className="text-xs font-bold">{key}</span><Switch checked={Boolean(value)} onCheckedChange={(v) => setDraft((d) => ({ ...d, [key]: v }))} /></label>; return <label key={key} className="space-y-1"><span className="text-[10px] font-bold uppercase text-muted-foreground">{key}</span><Input value={typeof value === "object" ? JSON.stringify(value) : String(value ?? "")} onChange={(e) => { const raw = e.target.value; let parsed: unknown = raw; try { parsed = JSON.parse(raw); } catch {} setDraft((d) => ({ ...d, [key]: parsed })); }} /></label>; })}</div>{changed && <Button disabled={pending} onClick={() => { onSave(draft); setDraft({}); }}>Salvar e auditar</Button>}</div>;
}

function AuditTable({ data, loading, page, setPage, actionType, entityType, setActionType, setEntityType }: { data: { rows: unknown[]; count: number; page: number; pageSize: number } | undefined; loading: boolean; page: number; setPage: (page: number) => void; actionType: string; entityType: string; setActionType: (value: string) => void; setEntityType: (value: string) => void }) {
  if (loading) return <div className="p-6 text-sm text-muted-foreground">Carregando auditoria...</div>;
  return <div className="space-y-4"><div className="grid grid-cols-1 gap-3 md:grid-cols-2"><Input placeholder="Ação (ex.: UPDATE)" value={actionType} onChange={(e) => setActionType(e.target.value)} /><Input placeholder="Entidade" value={entityType} onChange={(e) => setEntityType(e.target.value)} /></div><div className="overflow-x-auto rounded-2xl border"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Data</th><th className="p-3">Ação</th><th className="p-3">Entidade</th><th className="p-3">Ator</th></tr></thead><tbody>{data?.rows.map((item, index) => { const row = item as Record<string, unknown>; return <tr key={String(row["id"] ?? index)} className="border-b"><td className="p-3">{String(row["created_at"] ?? "—")}</td><td className="p-3">{String(row["action_type"] ?? "—")}</td><td className="p-3">{String(row["entity_type"] ?? "—")}</td><td className="p-3">{String(row["actor_email"] ?? "—")}</td></tr>; })}</tbody></table></div><div className="flex items-center justify-between"><Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button><span className="text-xs text-muted-foreground">Página {page + 1}</span><Button variant="outline" disabled={!data || (page + 1) * data.pageSize >= data.count} onClick={() => setPage(page + 1)}>Próxima</Button></div></div>;
}
