-- Immutable Master-only review trail. A review is an editorial decision, not proof of market response.
create table if not exists public.rubi_audience_evidence_reviews (
 id uuid primary key default gen_random_uuid(),
 movement_id uuid not null references public.rubi_movements(id) on delete restrict,
 movement_revision integer not null check (movement_revision > 0),
 evidence_snapshot text not null check (char_length(evidence_snapshot) between 40 and 1400),
 outcome text not null check (outcome in ('needs_more_evidence','document_reviewed')),
 reviewer_note text not null check (char_length(reviewer_note) between 20 and 1000),
 source_reference text not null check (char_length(source_reference) between 12 and 500),
 created_at timestamptz not null default now()
);
create index if not exists rubi_audience_evidence_reviews_movement_idx
 on public.rubi_audience_evidence_reviews(movement_id,created_at desc);
alter table public.rubi_audience_evidence_reviews enable row level security;
revoke all on public.rubi_audience_evidence_reviews from public,anon,authenticated;
comment on table public.rubi_audience_evidence_reviews is
 'Append-only Master evidence review decisions. Document reviewed does NOT establish product-market fit, A/B performance, media license, or marketing publication approval.';
-- Service-role writes can only append; even the service role cannot silently mutate historical decisions.
create or replace function public.rubi_audience_review_immutable()
returns trigger language plpgsql set search_path=public as $$
begin
 raise exception 'Audience evidence decisions are append-only';
end;
$$;
revoke all on function public.rubi_audience_review_immutable() from public,anon,authenticated;
drop trigger if exists rubi_audience_review_immutable_trg on public.rubi_audience_evidence_reviews;
create trigger rubi_audience_review_immutable_trg before update or delete
 on public.rubi_audience_evidence_reviews for each row execute function public.rubi_audience_review_immutable();

-- Prevent a stale evidence snapshot from being reviewed if the movement changes mid-request.
create or replace function public.rubi_audience_review_snapshot_guard()
returns trigger language plpgsql set search_path=public as $$
declare current_revision integer; current_evidence text;
begin
 select revision,evidence_notes into current_revision,current_evidence
  from public.rubi_movements where id=new.movement_id for update;
 if current_revision is distinct from new.movement_revision
    or current_evidence is distinct from new.evidence_snapshot then
  raise exception 'Movement evidence changed; reload before review';
 end if;
 return new;
end;
$$;
revoke all on function public.rubi_audience_review_snapshot_guard() from public,anon,authenticated;
drop trigger if exists rubi_audience_review_snapshot_guard_trg on public.rubi_audience_evidence_reviews;
create trigger rubi_audience_review_snapshot_guard_trg before insert
 on public.rubi_audience_evidence_reviews for each row execute function public.rubi_audience_review_snapshot_guard();
