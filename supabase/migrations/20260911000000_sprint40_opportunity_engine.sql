create table if not exists public.opportunity_alerts (
 id uuid primary key default gen_random_uuid(),
 opportunity_type text not null check (opportunity_type in ('product','campaign','collection','channel')),
 source_id uuid not null,
 title text not null,
 score numeric not null default 0 check (score >= 0 and score <= 100),
 priority integer not null default 0 check (priority between 0 and 100),
 reasons jsonb not null default '[]'::jsonb,
 recommended_action text not null,
 status text not null default 'open' check (status in ('open','dismissed','actioned')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(opportunity_type, source_id)
);
create index if not exists opportunity_alerts_status_score_idx on public.opportunity_alerts(status, score desc);
create index if not exists opportunity_alerts_type_idx on public.opportunity_alerts(opportunity_type);
alter table public.opportunity_alerts enable row level security;
create policy opportunity_alerts_owner_all on public.opportunity_alerts for all to authenticated using (has_role(auth.uid(),'owner')) with check (has_role(auth.uid(),'owner'));
create or replace function public.refresh_opportunity_alerts() returns integer language plpgsql security definer set search_path=public as $$ declare v_count integer:=0; begin if auth.uid() is null or not has_role(auth.uid(),'owner') then raise exception 'owner access required'; end if; insert into public.opportunity_alerts(opportunity_type,source_id,title,score,priority,reasons,recommended_action,status,updated_at) select 'product',p.id,p.title,least(100,greatest(0,coalesce(p.demand_score,0)*.35+coalesce(p.trend_velocity,0)*.35+coalesce(p.offer_score,0)*.20+least(coalesce(p.discount,0),100)*.10)),least(100,greatest(0,round(coalesce(p.trend_velocity,0)*.5+coalesce(p.demand_score,0)*.3+coalesce(p.discount,0)*.2))),jsonb_build_array(case when coalesce(p.trend_velocity,0)>=70 then 'Alta velocidade de tendência' end,case when coalesce(p.demand_score,0)>=70 then 'Alta demanda' end,case when coalesce(p.offer_score,0)>=70 then 'Oferta forte' end,case when coalesce(p.discount,0)>=20 then 'Desconto relevante' end),'Revisar para possível promoção','open',now() from public.products p where p.status in ('active','published') on conflict(opportunity_type,source_id) do update set title=excluded.title,score=excluded.score,priority=excluded.priority,reasons=excluded.reasons,recommended_action=excluded.recommended_action,updated_at=now(),status=case when opportunity_alerts.status='actioned' then 'actioned' else 'open' end; get diagnostics v_count=row_count; return v_count; end; $$;
revoke all on function public.refresh_opportunity_alerts() from public;
grant execute on function public.refresh_opportunity_alerts() to authenticated;
create or replace function public.get_opportunity_alerts(p_status text default 'open') returns setof public.opportunity_alerts language sql security definer set search_path=public as $$ select * from public.opportunity_alerts where (p_status is null or status=p_status) order by score desc,priority desc,updated_at desc; $$;
revoke all on function public.get_opportunity_alerts(text) from public;
grant execute on function public.get_opportunity_alerts(text) to authenticated;
create or replace function public.update_opportunity_alert_status(p_id uuid,p_status text) returns boolean language plpgsql security definer set search_path=public as $$ begin if auth.uid() is null or not has_role(auth.uid(),'owner') then raise exception 'owner access required'; end if; if p_status not in ('open','dismissed','actioned') then raise exception 'invalid status'; end if; update public.opportunity_alerts set status=p_status,updated_at=now() where id=p_id; return found; end; $$;
revoke all on function public.update_opportunity_alert_status(uuid,text) from public;
grant execute on function public.update_opportunity_alert_status(uuid,text) to authenticated;
