create or replace function public.get_collection_candidate_stats(p_collection_id uuid)
returns jsonb language sql security definer set search_path=public as $$
 select jsonb_build_object('pending',count(*) filter(where status='pending'),'approved',count(*) filter(where status='approved'),'rejected',count(*) filter(where status='rejected'),'total',count(*))
 from public.collection_candidates
 where collection_id=p_collection_id and has_role(auth.uid(),'owner'::app_role);
$$;
grant execute on function public.get_collection_candidate_stats(uuid) to authenticated;