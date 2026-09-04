import { X } from "lucide-react";
import type { FilterState, FilterOption } from "./useFilters";

interface FilterChipsProps {
  filters: FilterState;
  availableFilters?: { categories?: FilterOption[]; marketplaces?: FilterOption[]; minPrice?: number; maxPrice?: number };
  onRemove: (key: keyof FilterState, value?: string) => void;
  onClearAll: () => void;
}

export function FilterChips({ filters, availableFilters, onRemove, onClearAll }: FilterChipsProps) {
  const categories = availableFilters?.categories ?? [];
  const marketplaces = availableFilters?.marketplaces ?? [];
  const minPrice = availableFilters?.minPrice ?? 0;
  const maxPrice = availableFilters?.maxPrice ?? 1_000_000_000;
  const chips: Array<{ key: keyof FilterState; label: string; value?: string }> = [];

  filters.categories.forEach((id) => {
    const option = categories.find((item) => item.id === id);
    chips.push({ key: "categories", label: `Categoria: ${option?.name ?? id}`, value: id });
  });
  filters.marketplaces.forEach((id) => {
    const option = marketplaces.find((item) => item.id === id);
    chips.push({ key: "marketplaces", label: `Marketplace: ${option?.name ?? id}`, value: id });
  });
  if (filters.minPrice > minPrice || filters.maxPrice < maxPrice) chips.push({ key: "minPrice", label: `Preço: R$ ${filters.minPrice.toLocaleString("pt-BR")} – R$ ${filters.maxPrice.toLocaleString("pt-BR")}` });
  if (filters.minDiscount > 0) chips.push({ key: "minDiscount", label: `Desconto ≥ ${filters.minDiscount}%` });
  if (filters.minRating > 0) chips.push({ key: "minRating", label: `Avaliação ≥ ${filters.minRating}★` });
  if (filters.freeShipping) chips.push({ key: "freeShipping", label: "Frete grátis" });
  if (filters.bestOffer) chips.push({ key: "bestOffer", label: "Melhor oferta" });

  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-background/20 px-5 py-3">
      {chips.map((chip, index) => (
        <span key={`${chip.key}-${chip.value ?? index}`} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
          <span className="truncate">{chip.label}</span>
          <button type="button" aria-label={`Remover ${chip.label}`} onClick={() => onRemove(chip.key, chip.value)} className="shrink-0 rounded-full p-0.5 text-muted-foreground transition hover:bg-background hover:text-foreground"><X className="h-3 w-3" /></button>
        </span>
      ))}
      <button type="button" onClick={onClearAll} className="rounded-full px-2 py-1 text-xs font-bold text-primary transition hover:bg-primary/10">Limpar todos</button>
    </div>
  );
}
