import { useEffect, useMemo, useState } from "react";
import { Filter, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import type { FilterState } from "./useFilters";
import { useFilters } from "./useFilters";
import { FilterCheckbox } from "./FilterCheckbox";
import { FilterToggle } from "./FilterToggle";
import { FilterChips } from "./FilterChips";
import { FilterSlider } from "./FilterSlider";
import { FilterCounter } from "./FilterCounter";

export function FilterDrawer({ isOpen, onClose, pageType, categoryId }: { isOpen: boolean; onClose: () => void; pageType: "search" | "products" | "category" | "deals"; categoryId?: string }) {
  const api = useFilters(pageType, categoryId);
  const [draft, setDraft] = useState<FilterState>(api.filters);
  useEffect(() => { if (isOpen) setDraft(api.filters); }, [api.filters, isOpen]);
  useEffect(() => { if (!isOpen) return; const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; const previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; document.addEventListener("keydown", onKey); return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKey); }; }, [isOpen, onClose]);

  const active = useMemo(() => [draft.categories.length > 0, draft.marketplaces.length > 0, draft.minPrice > api.availableFilters.minPrice, draft.maxPrice < api.availableFilters.maxPrice, draft.minDiscount > 0, draft.minRating > 0, draft.freeShipping, draft.bestOffer].filter(Boolean).length, [api.availableFilters.maxPrice, api.availableFilters.minPrice, draft]);
  const reset: FilterState = { categories: [], minPrice: api.availableFilters.minPrice, maxPrice: api.availableFilters.maxPrice, minDiscount: 0, minRating: 0, marketplaces: [], freeShipping: false, bestOffer: false };
  const remove = (key: keyof FilterState, value?: string) => { if (key === "categories" || key === "marketplaces") setDraft({ ...draft, [key]: draft[key].filter((x) => x !== value) }); else setDraft({ ...draft, [key]: key === "minPrice" ? api.availableFilters.minPrice : key === "maxPrice" ? api.availableFilters.maxPrice : key === "minDiscount" || key === "minRating" ? 0 : false }); };
  const apply = () => { api.setFilters(draft); onClose(); };
  const clear = () => setDraft(reset);

  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md transition-opacity duration-300" role="dialog" aria-modal="true" aria-label="Filtros avançados" onClick={onClose}>
    <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border/60 bg-background/95 shadow-2xl backdrop-blur-2xl motion-safe:animate-[filter-drawer-in_300ms_cubic-bezier(.16,1,.3,1)]" onClick={(e) => e.stopPropagation()}>
      <header className="flex items-center justify-between border-b border-border/60 bg-card/40 p-5"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><SlidersHorizontal className="h-5 w-5" /></div><h2 className="font-black tracking-tight">Filtros avançados</h2><FilterCounter count={active} /></div><button aria-label="Fechar filtros" onClick={onClose} className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"><X className="h-5 w-5" /></button></header>
      <FilterChips filters={draft} availableFilters={api.availableFilters} onRemove={remove} onClearAll={clear} />
      <div className="flex-1 space-y-7 overflow-y-auto p-5">
        {pageType !== "category" && <section><h3 className="mb-3 text-sm font-bold">Categorias</h3><div className="max-h-56 space-y-1 overflow-auto pr-1">{api.availableFilters.categories.map((x) => <FilterCheckbox key={x.id} id={x.id} label={x.name} count={x.count} checked={draft.categories.includes(x.id)} onChange={(checked) => setDraft({ ...draft, categories: checked ? [...draft.categories, x.id] : draft.categories.filter((v) => v !== x.id) })} />)}</div></section>}
        <section><h3 className="mb-3 text-sm font-bold">Faixa de preço</h3><div className="rounded-2xl border border-border/50 bg-card/30 p-4"><FilterSlider min={api.availableFilters.minPrice} max={api.availableFilters.maxPrice} valueMin={draft.minPrice} valueMax={draft.maxPrice} onChange={(min, max) => setDraft({ ...draft, minPrice: min, maxPrice: max })} formatValue={(v) => `R$ ${v.toLocaleString("pt-BR")}`} /></div></section>
        <section><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold">Desconto mínimo</h3><span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{draft.minDiscount}%</span></div><input aria-label="Desconto mínimo" type="range" min={0} max={100} value={draft.minDiscount} onChange={(e) => setDraft({ ...draft, minDiscount: Number(e.target.value) })} className="h-2 w-full cursor-pointer accent-primary"/></section>
        <section><h3 className="mb-3 text-sm font-bold">Avaliação mínima</h3><div className="grid grid-cols-5 gap-2">{[1,2,3,4,5].map((r) => <button type="button" key={r} onClick={() => setDraft({ ...draft, minRating: draft.minRating === r ? 0 : r })} className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition-all ${draft.minRating === r ? "border-primary/50 bg-primary/10 text-primary shadow-sm" : "border-border/70 bg-card/20 text-muted-foreground hover:bg-muted"}`}>{r} ★</button>)}</div></section>
        <section><h3 className="mb-3 text-sm font-bold">Marketplaces</h3><div className="space-y-1">{api.availableFilters.marketplaces.map((x) => <FilterCheckbox key={x.id} id={`marketplace-${x.id}`} label={x.name} count={x.count} checked={draft.marketplaces.includes(x.id)} onChange={(checked) => setDraft({ ...draft, marketplaces: checked ? [...draft.marketplaces, x.id] : draft.marketplaces.filter((v) => v !== x.id) })} />)}</div></section>
        <section className="space-y-2"><FilterToggle label="Frete grátis" checked={draft.freeShipping} onChange={(checked) => setDraft({ ...draft, freeShipping: checked })}/><FilterToggle label="Apenas melhor oferta" checked={draft.bestOffer} onChange={(checked) => setDraft({ ...draft, bestOffer: checked })}/></section>
      </div>
      <footer className="flex items-center gap-3 border-t border-border/60 bg-card/50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"><button type="button" onClick={clear} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"><RotateCcw className="h-4 w-4"/> Limpar</button><button type="button" disabled={api.loading} onClick={apply} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/15 transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60"><Filter className="h-4 w-4"/> Aplicar {api.loading ? "…" : `(${api.totalResults.toLocaleString("pt-BR")})`}</button></footer>
    </aside>
  </div>;
}
