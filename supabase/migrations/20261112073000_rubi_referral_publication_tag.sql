-- Creator publication tag on the existing partner referral visit, not a parallel tracker.
-- This is a URL-tagged landing event; never proof of social platform impression,
-- purchase, settled commission or the actual referring publication.
alter table public.hub_partner_referral_visits
 add column if not exists publication_id uuid
 references public.rubi_creator_team_publication_evidence(id) on delete set null;

create index if not exists hub_partner_referral_visits_publication_idx
 on public.hub_partner_referral_visits(publication_id,visited_at)
 where publication_id is not null;

comment on column public.hub_partner_referral_visits.publication_id is
 'Optional creator publication URL tag, verified at write-time against partner, product and approved team campaign; not payment attribution or proof of actual post impression.';
