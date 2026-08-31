import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useEngagement } from "@/hooks/useEngagement";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ShoppingCart, Heart, PlayCircle, Award, Layers, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackOutboundClick } from "@/lib/analytics";
import { validateAffiliateLink } from "@/lib/compliance.functions";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { AggregatedSocialProof } from "@/components/AggregatedSocialProof";

export interface ProductCardProps {
  id: string; slug: string; categoryId?: string | null | undefined; title?: string; price?: number;
  previousPrice?: number | null | undefined; discount?: number | null | undefined; image?: string;
  marketplace?: string; rating?: number | null | undefined; reviewCount?: number | null | undefined;
  affiliateUrl?: string | null; isLoading?: boolean; hasVideo?: boolean; isBestOffer?: boolean;
  offerScore?: number; affinityScore?: number | null;
}

export function ProductCard({ id, slug, categoryId, title, price, previousPrice, discount, image, marketplace, rating, reviewCount, affiliateUrl, isLoading, hasVideo, isBestOffer, offerScore, affinityScore }: ProductCardProps) {
  const { isFavorited, setIsFavorited, handleToggleFavorite } = useEngagement(id, categoryId);
  const validateLink = useServerFn(validateAffiliateLink);
  useEffect(() => { const checkFavorite = async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { data } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("product_id", id).maybeSingle(); if (data) setIsFavorited(true); }; checkFavorite(); }, [id, setIsFavorited]);
  if (isLoading) return (<Card className="overflow-hidden border border-glass-border bg-glass-fallback rounded-[2.5rem]"><div className="aspect-[4/5] w-full relative overflow-hidden bg-muted"><Skeleton className="w-full h-full rounded-none animate-pulse"/><div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent"/></div><CardHeader className="p-6 space-y-3"><Skeleton className="h-7 w-3/4 rounded-lg bg-muted/30"/><Skeleton className="h-4 w-1/2 rounded-md bg-muted/20"/></CardHeader><CardContent className="p-6 pt-0 space-y-4"><Skeleton className="h-10 w-full rounded-xl bg-muted/30"/><div className="flex gap-2"><Skeleton className="h-12 w-full rounded-2xl bg-muted/40"/></div></CardContent></Card>);
  return (<Card className="overflow-hidden group border border-glass-border elevation-1 hover:elevation-2 hover:-translate-y-2 transition-all duration-700 rounded-[2.5rem] relative">
    <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-20"/>
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"><div className="w-full h-[2px] bg-primary/40 shadow-[0_0_15px_var(--color-primary)] animate-scan"/></div>
    <div className="relative aspect-[4/5] overflow-hidden bg-muted">
      {image ? <img src={image} alt={title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out"/> : <div className="flex items-center justify-center w-full h-full text-muted-foreground">No image</div>}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60"/>
      <Button variant="ghost" size="icon" className={`absolute top-4 right-4 z-40 w-10 h-10 rounded-xl backdrop-blur-md border border-white/10 transition-all duration-300 group/heart ${isFavorited ? 'bg-primary text-primary-foreground' : 'bg-background/20 text-white hover:bg-primary/20'}`} onClick={async (e) => { e.preventDefault(); e.stopPropagation(); const { data: { user } } = await supabase.auth.getUser(); if (!user) { toast.error("Por favor, faça login para salvar favoritos"); return; } handleToggleFavorite(user.id); }}><Heart className={`w-5 h-5 group-hover/heart:scale-110 transition-transform ${isFavorited ? 'fill-current' : ''}`}/></Button>
      {discount && <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground font-black rounded-tr-none rounded-bl-none rounded-tl-xl rounded-br-xl px-4 py-1.5 shadow-2xl text-[10px] tracking-tighter z-30 border-none">-{discount}%</Badge>}
      {affinityScore !== null && affinityScore !== undefined && affinityScore >= 70 && <Badge className="absolute bottom-4 left-4 z-40 rounded-full border border-primary/30 bg-background/80 px-3 py-1.5 text-[10px] font-black tracking-wide text-primary shadow-xl backdrop-blur-md"><Target className="mr-1.5 h-3 w-3"/> {Math.round(affinityScore)}% compatível com você</Badge>}
      {hasVideo && <div className="absolute top-16 left-4 z-30"><div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-[9px] font-black uppercase tracking-widest"><PlayCircle className="w-3 h-3 text-primary animate-pulse"/>Assistir</div></div>}
      {marketplace && <Badge variant="secondary" className="absolute bottom-4 right-4 bg-background/50 border border-white/20 text-white rounded-full font-bold shadow-2xl px-3 py-1 text-[10px] tracking-widest uppercase z-30">{marketplace}</Badge>}
      {isBestOffer && <div className="absolute top-4 right-16 z-30"><Badge className="bg-amber-500 text-white border-none font-black rounded-full px-3 py-1 shadow-2xl text-[9px] tracking-widest uppercase flex items-center gap-1 italic"><Award className="w-3 h-3"/>Melhor Oferta</Badge></div>}
    </div>
    <CardContent className="p-6 space-y-4 relative z-10">
      <div className="space-y-2"><Link to="/product/$slug" params={{ slug }} className="block"><h3 className="font-black text-lg md:text-xl leading-[1.1] tracking-tight line-clamp-2 min-h-[2.5rem] md:min-h-[2.75rem] group-hover:text-primary transition-colors italic uppercase">{title}</h3></Link><div className="flex items-center gap-2 text-xs font-bold text-muted-foreground tracking-tighter"><div className="flex items-center gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(rating || 0) ? 'fill-primary text-primary' : 'fill-muted text-muted'}`}/>)}</div><span className="text-foreground">{rating}</span><span className="opacity-40 uppercase truncate">({reviewCount} avaliações)</span></div></div>
      <div className="flex flex-col gap-1"><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0"><span className="text-2xl md:text-3xl font-black tracking-[-0.05em] leading-none">R$ {price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>{previousPrice && <span className="text-sm text-muted-foreground/60 line-through decoration-primary/60 font-black tracking-tighter">R$ {previousPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}</div>{price && price > 100 && <p className="text-[10px] font-bold text-primary/80 uppercase tracking-tighter">ou 10x de R$ {(price / 10).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>}<div className="flex items-center gap-2 mt-1"><div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"/><p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-black">{isBestOffer ? 'Melhor Preço Global' : 'Oferta Verificada por IA'}</p>{offerScore && offerScore > 0 && <div className="flex items-center gap-1 ml-auto"><Layers className="w-3 h-3 text-primary/40"/><span className="text-[9px] font-black text-primary/60">{offerScore.toFixed(1)}</span></div>}</div></div>
      <AggregatedSocialProof productId={id} variant="compact" className="mt-2"/>
    </CardContent>
    <CardFooter className="p-6 pt-0 relative z-10"><Button className="w-full gap-2 md:gap-3 rounded-2xl h-12 md:h-14 text-sm md:text-base font-black uppercase tracking-tighter shadow-2xl shadow-primary/20 group-hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={async (e) => { if (affiliateUrl) { e.preventDefault(); const validation = await validateLink({ data: { url: affiliateUrl, marketplaceId: '00000000-0000-0000-0000-000000000000' } }); if (validation && !validation.valid) { console.warn("[Compliance] Link violation detected, blocking navigation."); toast.error("Alerta de segurança: Este link não atende aos padrões de conformidade."); return; } await trackOutboundClick(id, marketplace || 'Unknown', affiliateUrl); window.open(affiliateUrl, '_blank', 'noopener,noreferrer'); } }}><ShoppingCart className="w-5 h-5"/>Adquirir Agora</Button></CardFooter>
  </Card>);
}
