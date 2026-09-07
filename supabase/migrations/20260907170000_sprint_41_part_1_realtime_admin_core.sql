-- Sprint 41 Part 1: enable Postgres Changes for core admin/storefront entities.
-- REPLICA IDENTITY FULL keeps complete old/new row data in UPDATE/DELETE payloads.
alter table public.products replica identity full;
alter table public.marketplaces replica identity full;
alter table public.offer_groups replica identity full;
alter table public.videos replica identity full;
alter table public.bridge_videos replica identity full;
alter table public.campaigns replica identity full;
alter table public.automation_rules replica identity full;
alter table public.home_modules_config replica identity full;
alter table public.banners replica identity full;
alter table public.notifications replica identity full;
alter table public.social_channels replica identity full;
alter table public.support_faq replica identity full;
alter table public.referral_tiers replica identity full;

alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.marketplaces;
alter publication supabase_realtime add table public.offer_groups;
alter publication supabase_realtime add table public.videos;
alter publication supabase_realtime add table public.bridge_videos;
alter publication supabase_realtime add table public.campaigns;
alter publication supabase_realtime add table public.automation_rules;
alter publication supabase_realtime add table public.home_modules_config;
alter publication supabase_realtime add table public.banners;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.social_channels;
alter publication supabase_realtime add table public.support_faq;
alter publication supabase_realtime add table public.referral_tiers;
