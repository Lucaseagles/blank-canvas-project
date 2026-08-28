import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSocialProofEvents, getSocialProofConfig, getAggregatedSocialProof } from '@/lib/social-proof.functions';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Eye, Heart, ExternalLink, Play, Users, ArrowDown, X } from 'lucide-react';

type SocialEvent = {
  id: string;
  type: string;
  userName: string;
  location?: string;
  productId?: string;
  timestamp: string;
};

type Format = 'session' | 'favorite' | 'offer_click' | 'price_alert_conversion' | 'aggregate_count';

const DISMISS_KEY = 'social_proof_dismissed';
const SWIPE_THRESHOLD = 90;

function getFormat(event: SocialEvent): Format {
  if (event.type === 'ADD_FAVORITE') return 'favorite';
  if (event.type === 'OUTBOUND_CLICK') return 'offer_click';
  if (event.type === 'SESSION_START') return 'session';
  if (event.type === 'PRICE_ALERT_CONVERSION') return 'price_alert_conversion';
  return 'favorite';
}

export function SocialProofPopup() {
  const [visible, setVisible] = useState(false);
  const [event, setEvent] = useState<SocialEvent | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [aggregate, setAggregate] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-220, 0, 220], [0, 1, 0]);
  const shownIds = useRef<Set<string>>(new Set());

  const { data: config } = useQuery({
    queryKey: ['socialProofConfig'],
    queryFn: getSocialProofConfig,
    staleTime: 30_000,
  });

  const enabled = Boolean((config as any)?.is_enabled) && !dismissed;
  const { data: events = [] } = useQuery({
    queryKey: ['socialProofEvents'],
    queryFn: getSocialProofEvents,
    enabled,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === 'true');
  }, []);

  const eligibleFormats = useMemo<Format[]>(() => {
    const configured = (config as any)?.enabled_formats as string[] | undefined;
    const allowed = configured?.length ? new Set(configured) : new Set<Format>(['session', 'favorite', 'offer_click', 'price_alert_conversion', 'aggregate_count']);
    const result = new Set<Format>();
    for (const e of events as SocialEvent[]) {
      if (e.productId && allowed.has(getFormat(e))) result.add(getFormat(e));
    }
    if (aggregate && allowed.has('aggregate_count')) result.add('aggregate_count');
    return [...result];
  }, [events, aggregate, config]);

  const chooseEvent = (list: SocialEvent[]) => {
    const fresh = list.filter(e => !shownIds.current.has(e.id));
    const pool = fresh.length ? fresh : list;
    if (!pool.length) return null;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    if (!selected) return null;
    shownIds.current.add(selected.id);
    if (shownIds.current.size > 100) shownIds.current.clear();
    return selected;
  };

  useEffect(() => {
    if (!enabled || !events.length || visible) return;
    let cancelled = false;
    const run = async () => {
      const allowed = new Set(((config as any)?.enabled_formats?.length ? (config as any).enabled_formats : ['session', 'favorite', 'offer_click', 'price_alert_conversion']) as string[]);
      const candidates = (events as SocialEvent[]).filter(e => e.productId && allowed.has(getFormat(e)));
      const selected = chooseEvent(candidates);
      if (!selected || cancelled) return;

      const { data: p } = await supabase.from('products').select('id,title,images').eq('id', selected.productId ?? '').maybeSingle();
      if (cancelled || !p) return;
      setProduct(p);
      setEvent(selected);
      setVisible(true);
      await (supabase as any).rpc('trackEvent', { p_event_type: 'SOCIAL_PROOF_VIEW', p_metadata: { source_event_id: selected.id, format: getFormat(selected) } }).catch(() => undefined);
    };
    const timer = window.setTimeout(run, 3500);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [enabled, events, config, visible]);

  useEffect(() => {
    if (!enabled || visible || !eligibleFormats.includes('aggregate_count')) return;
    const candidate = (events as SocialEvent[]).find(e => e.productId);
    if (!candidate?.productId) return;
    getAggregatedSocialProof({ data: { productId: candidate.productId } } as any).then(data => {
      if (data && !dismissed) setAggregate({ ...data, productId: candidate.productId, title: undefined });
    }).catch(() => undefined);
  }, [enabled, visible, eligibleFormats, events, dismissed]);

  const close = async (reason: 'dismiss' | 'swipe' = 'dismiss') => {
    if (!event) return;
    await (supabase as any).rpc('record_popup_event', {
      p_rule_id: event.id,
      p_user_id: null,
      p_event_type: 'dismiss',
      p_metadata: { social_proof_format: getFormat(event), reason },
    }).catch(() => undefined);
    setVisible(false);
    setEvent(null);
    setProduct(null);
    if (reason === 'dismiss' || reason === 'swipe') {
      sessionStorage.setItem(DISMISS_KEY, 'true');
      setDismissed(true);
    }
  };

  if (!event || !product || !visible || dismissed) return null;

  const format = getFormat(event);
  const image = Array.isArray(product.images) ? product.images[0] : null;
  const copy = {
    favorite: <> <b>{event.userName}</b> favoritou <strong>{product.title}</strong></>,
    offer_click: <> <b>{event.userName}</b> está vendo uma oferta em <strong>{product.title}</strong></>,
    price_alert_conversion: <> <b>{event.userName}</b> aproveitou uma queda de preço em <strong>{product.title}</strong></>,
    session: <> <b>{event.userName}</b> entrou recentemente no app</>,
    aggregate_count: <><strong>{aggregate?.views ?? 0}</strong> pessoas viram esta oferta recentemente</>,
  }[format];

  const icon = {
    favorite: <Heart className="h-3.5 w-3.5 fill-current" />,
    offer_click: <ExternalLink className="h-3.5 w-3.5" />,
    price_alert_conversion: <ArrowDown className="h-3.5 w-3.5" />,
    session: <Users className="h-3.5 w-3.5" />,
    aggregate_count: <Eye className="h-3.5 w-3.5" />,
  }[format];

  return (
    <AnimatePresence>
      <motion.div
        key={event.id}
        role="status"
        aria-live="polite"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        style={{ x, opacity }}
        onDragStart={() => setDragging(true)}
        onDragEnd={(_, info) => {
          setDragging(false);
          if (Math.abs(info.offset.x) >= SWIPE_THRESHOLD) void close('swipe');
          else x.set(0);
        }}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="fixed bottom-[88px] left-4 right-4 z-[110] mx-auto w-auto max-w-[380px] cursor-grab select-none touch-pan-y md:bottom-6 md:left-auto md:right-6"
        data-social-proof-format={format}
        data-dragging={dragging}
      >
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-background/95 p-3 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {image ? <img src={image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>}
            <div className="min-w-0 flex-1 pr-7">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                <span className="text-primary">{icon}</span> Prova social real
              </div>
              <p className="text-[13px] leading-snug text-foreground/90">{copy}</p>
            </div>
            <button type="button" onClick={() => void close()} aria-label="Dispensar prova social" className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
