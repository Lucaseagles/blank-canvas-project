-- Sprint 131: idempotent visit events for one referral link and client-generated navigation token.
-- A token identifies a browser navigation/session attempt, NOT a person or a paid conversion.
alter table public.hub_partner_referral_visits
 add column if not exists visit_token uuid;

create unique index if not exists hub_partner_referral_visits_token_uniq
 on public.hub_partner_referral_visits(referral_link_id,visit_token)
 where visit_token is not null;

comment on column public.hub_partner_referral_visits.visit_token is
 'Optional random navigation token: repeated submissions of the same referral link + token count once. Not visitor ID, fingerprint, fraud score, purchase or commission. Legacy NULL-token visits remain undeduplicated.';
