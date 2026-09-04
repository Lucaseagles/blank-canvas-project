import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FilterState { categories: string[]; minPrice: number; maxPrice: number; minDiscount: number; minRating: number; marketplaces: string[]; freeShipping: boolean; bestOffer: boolean; }
export interface FilterOption { id: string; name: string; count: number; checked: boolean; }
const DEFAULT_MAX_PRICE = 1_000_000_000;
const defaults: FilterState = { categories: [], minPrice: 0, maxPrice: DEFAULT_MAX_PRICE, minDiscount: 0, minRating: 0, marketplaces: [], freeShipping: false, bestOffer: false };

function readUrl(): FilterState {
  if (typeof window === "undefined") return defaults;
  const p = new URLSearchParams(window.location.search);
  const num = (key: string, fallback: number) => { const n = Number(p.get(key)); return Number.isFinite(n) && n >= 0 ? n : fallback; };
  return { categories: p.get("categories")?.split(",").filter(Boolean) ?? [], minPrice: num("min_price", 0), maxPrice: num("max_price", DEFAULT_MAX_PRICE), minDiscount: num("min_discount", 0), minRating: num("min_rating", 0), marketplaces: p.get("marketplaces")?.split(",").filter(Boolean) ?? [], freeShipping: p.get("free_shipping") === "true", bestOffer: p.get("best_offer") === "true" };
}

export function useFilters(pageType: "search" | "products" | "category" | "deals", categoryId?: string) {
  const [filters, setFilters] = useState<FilterState>(() => readUrl());
  const [availableFilters, setAvailableFilters] = useState({ categories: [] as FilterOption[], marketplaces: [] as FilterOption[], minPrice: 0, maxPrice: DEFAULT_MAX_PRICE });
  const [results, setResults] = useState<any[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);

  const updateURL = useCallback((next: FilterState) => {
    const p = new URLSearchParams(window.location.search);
    const set = (key: string, value: string | null) => value ? p.set(key, value) : p.delete(key);
    set("categories", pageType === "category" ? null : next.categories.length ? next.categories.join(",") : null);
    set("min_price", next.minPrice > 0 ? String(next.minPrice) : null);
    set("max_price", next.maxPrice < DEFAULT_MAX_PRICE ? String(next.maxPrice) : null);
    set("min_discount", next.minDiscount > 0 ? String(next.minDiscount) : null);
    set("min_rating", next.minRating > 0 ? String(next.minRating) : null);
    set("marketplaces", next.marketplaces.length ? next.marketplaces.join(",") : null);
    set("free_shipping", next.freeShipping ? "true" : null);
    set("best_offer", next.bestOffer ? "true" : null);
    window.history.replaceState({}, "", `${window.location.pathname}${p.toString() ? `?${p}` : ""}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [pageType]);

  const loadOptions = useCallback(async () => {
    const categoryQuery = supabase.from("categories").select("id,name").eq("is_active", true).order("name");
    const marketplaceQuery = supabase.from("marketplaces").select("id,name").order("name");
    const [cats, mps, minPriceQuery, maxPriceQuery] = await Promise.all([
      categoryQuery,
      marketplaceQuery,
      supabase.from("products").select("current_price").eq("status", "active").order("current_price", { ascending: true }).limit(1),
      supabase.from("products").select("current_price").eq("status", "active").order("current_price", { ascending: false }).limit(1),
    ]);
    if (cats.error) throw cats.error;
    if (mps.error) throw mps.error;
    if (minPriceQuery.error) throw minPriceQuery.error;
    if (maxPriceQuery.error) throw maxPriceQuery.error;

    const min = Number(minPriceQuery.data?.[0]?.current_price ?? 0);
    const max = Number(maxPriceQuery.data?.[0]?.current_price ?? DEFAULT_MAX_PRICE);
    const scopedCategories = pageType === "category" ? [] : filters.categories;
    setAvailableFilters({
      categories: (cats.data ?? []).map((c) => ({ id: c.id, name: c.name, count: 0, checked: scopedCategories.includes(c.id) })),
      marketplaces: (mps.data ?? []).map((m) => ({ id: m.id, name: m.name, count: 0, checked: filters.marketplaces.includes(m.id) })),
      minPrice: Number.isFinite(min) ? Math.floor(min) : 0,
      maxPrice: Number.isFinite(max) ? Math.ceil(max) : DEFAULT_MAX_PRICE,
    });
  }, [filters.categories, filters.marketplaces, pageType]);

  const applyFilters = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase.from("products").select("*, marketplaces(name)", { count: "exact" }).eq("status", "active");
      if (categoryId) q = q.eq("category_id", categoryId);
      if (pageType !== "category" && filters.categories.length) q = q.in("category_id", filters.categories);
      if (filters.marketplaces.length) q = q.in("marketplace_id", filters.marketplaces);
      if (filters.minPrice > 0) q = q.gte("current_price", filters.minPrice);
      if (filters.maxPrice < DEFAULT_MAX_PRICE) q = q.lte("current_price", filters.maxPrice);
      if (filters.minDiscount > 0) q = q.gte("discount", filters.minDiscount);
      if (filters.minRating > 0) q = q.gte("rating", filters.minRating);
      if (filters.freeShipping) q = q.eq("free_shipping" as never, true);
      if (filters.bestOffer) q = q.eq("is_best_offer", true);
      const { data, error, count } = await q.order("created_at", { ascending: false }).range(0, 49);
      if (error) throw error;
      setResults((data ?? []) as any[]);
      setTotalResults(count ?? 0);
    } finally { setLoading(false); }
  }, [categoryId, filters, pageType]);

  useEffect(() => { loadOptions().catch(console.error); }, [loadOptions]);
  useEffect(() => { applyFilters().catch(console.error); }, [applyFilters]);
  useEffect(() => { const onPop = () => setFilters(readUrl()); window.addEventListener("popstate", onPop); return () => window.removeEventListener("popstate", onPop); }, []);

  return useMemo(() => ({ pageType, filters, setFilters, updateURL, availableFilters, results, totalResults, loading, applyFilters }), [pageType, filters, updateURL, availableFilters, results, totalResults, loading, applyFilters]);
}
