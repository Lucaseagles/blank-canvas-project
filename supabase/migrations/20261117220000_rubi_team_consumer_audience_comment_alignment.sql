-- Sprint 225: keep the database function descriptions aligned with the actual audience model.
comment on function public.rubi_create_team_campaign_assignment_audited(uuid,uuid,uuid,uuid,uuid,text)
 is 'Owner-only creator-team assignment; both the campaign and movement target consumers while the creator team is the distribution channel.';
comment on function public.rubi_transition_team_campaign_assignment_audited(uuid,uuid,text,text)
 is 'Owner-only audited transition; ready requires an approved consumer campaign and reviewed consumer movement with confirmed media rights.';
