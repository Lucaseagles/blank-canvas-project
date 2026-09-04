import { useEffect, useState } from "react";
import { Filter, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import type { FilterState } from "./useFilters";
import { useFilters } from "./useFilters";
import { FilterCheckbox } from "./FilterCheckbox";
import { FilterToggle } from "./FilterToggle";
import { FilterChips } from "./FilterChips";
import { FilterSlider } from "./FilterSlider";

export function FilterDrawer({ isOpen, onClose, pageType, categoryId }: { isOpen: boolean; onClose: () => void; pageType: "search" | "products" | "category" | "deals"; categoryId?: string }) {
  const api = useFilters(pageType, categoryId);
  const [draft, setDraft] = useState<FilterState>(api.filters);
  useEffect(() => { if (isOpen) setDraft(api.filters); }, [api.filters, isOpen]);
  if (!isOpen) return null;
  const active = [draft.categories.length > 0, draft.marketplaces.length > 0, draft.minPrice > api.availableFilters.minPrice, draft.maxPrice < api.availableFilters.maxPrice, draft.minDiscount > 0, draft.minRating > 0, draft.freeShipping, draft.bestOffer].filter(Boolean).length;
  const reset: FilterState = { categories: [], minPrice: api.availableFilters.minPrice, maxPrice: api.availableFilters.maxPrice, minDiscount: 0, minRating: 0, marketplaces: [], freeShipping: false, bestOffer: false };
  const remove = (key: keyof FilterState, value?: string) => { if (key === "categories" || key === "marketplaces") setDraft({ ...draft, [key]: draft[key].filter((x) => x !== value) }); else setDraft({ ...draft, [key]: key === "minPrice" ? api.availableFilters.minPrice : key === "maxPrice" ? api.availableFilters.maxPrice : key === "minDiscount" || key === "minRating" ? 0 : false }); };
  return <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Filtros avançados" onClick={onClose}>
    <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <header className="flex items-center justify-between border-b border-border p-5"><div className="flex items-center gap-3"><SlidersHorizontal className="h-5 w-5 text-primary"/><h2 className="font-black">Filtros avançados</h2><span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{active}</span></div><button aria-label="Fechar filtros" onClick={onClose} className="rounded-xl p-2 hover:bg-muted"><X className="h-5 w-5"/></button></header>
      <FilterChips filters={draft} onRemove={remove} onClearAll={() => setDraft(reset)} />
      <div className="flex-1 space-y-7 overflow-y-auto p-5">
        {pageType !== "category" && <section><h3 className="mb-3 text-sm font-bold">Categorias</h3><div className="max-h-48 space-y-1 overflow-auto">{api.availableFilters.categories.map((x) => <FilterCheckbox key={x.id} id={x.id} label={x.name} count={x.count} checked={draft.categories.includes(x.id)} onChange={(checked) => setDraft({ ...draft, categories: checked ? [...draft.categories, x.id] : draft.categories.filter((v) => v !== x.id) })} />)}</div></section>}
        <section><h3 className="mb-3 text-sm font-bold">Faixa de preço</h3><FilterSlider min={api.availableFilters.minPrice} max={api.availableFilters.maxPrice} valueMin={draft.minPrice} valueMax={draft.maxPrice} onChange={(min, max) => setDraft({ ...draft, minPrice: min, maxPrice: max })} formatValue={(v) => `R$ ${v.toLocaleString("pt-BR")}`} /></section>
        <section><h3 className="mb-3 text-sm font-bold">Desconto mínimo: {draft.minDiscount}%</h3><input aria-label="Desconto mínimo" type="range" min={0} max={100} value={draft.minDiscount} onChange={(e) => setDraft({ ...draft, minDiscount: Number(e.target.value) })} className="w-full accent-primary"/></section>
        <section><h3 className="mb-3 text-sm font-bold">Avaliação mínima</h3><div className="flex flex-wrap gap-2">{[1,2,3,4,5].map((r) => <button type="button" key={r} onClick={() => setDraft({ ...draft, minRating: draft.minRating === r ? 0 : r })} className={`rounded-xl border px-3 py-2 text-sm ${draft.minRating === r ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{r} ★</button>)}</div></section>
        <section><h3 className="mb-3 text-sm font-bold">Marketplaces</h3>{api.availableFilters.marketplaces.map((x) => <FilterCheckbox key={x.id} id={`marketplace-${x.id}`} label={x.name} count={x.count} checked={draft.marketplaces.includes(x.id)} onChange={(checked) => setDraft({ ...draft, marketplaces: checked ? [...draft.marketplaces, x.id] : draft.marketplaces.filter((v) => v !== x.id) })} />)}</section>
        <FilterToggle label="Frete grátis" checked={draft.freeShipping} onChange={(checked) => setDraft({ ...draft, freeShipping: checked })}/><FilterToggle label="Apenas melhor oferta" checked={draft.bestOffer} onChange={(checked) => setDraft({ ...draft, bestOffer: checked })}/>
      </div>
      <footer className="flex gap-3 border-t border-border p-5"><button type="button" onClick={() => { setDraft(reset); api.setFilters(reset); }} className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm"><RotateCcw className="h-4 w-4"/>Limpar</button><button type="button" disabled={api.loading} onClick={() => { api.setFilters(draft); onClose(); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"><Filter className="h-4 w-4"/>Aplicar {api.loading ? "…" : `(${api.totalResults.toLocaleString("pt-BR")})`}</button></footer>
    </aside>
  </div>;
}
