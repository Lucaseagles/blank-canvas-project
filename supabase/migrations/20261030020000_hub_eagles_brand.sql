-- Renomeação confirmada: Rubi e Ragles -> Hub Eagles.
-- Preserva nomes personalizados que o proprietário já tenha configurado.
alter table public.brand_identity alter column display_name set default 'Hub Eagles';
update public.brand_identity
set display_name = 'Hub Eagles', updated_at = now()
where id = true and display_name = 'Rubi e Ragles';
insert into public.brand_identity (id, display_name)
values (true, 'Hub Eagles')
on conflict (id) do nothing;
