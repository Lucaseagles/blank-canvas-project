create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  type text unique not null,
  template text not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.notification_templates (type, template) values
('price_drop','Produto {product_name} baixou de preço. Agora por R$ {new_price}.'),
('new_deal','Nova oferta disponível: {product_name} por R$ {price}.'),
('referral_activated','Seu amigo {friend_name} se cadastrou usando seu código. Recompensa: {reward}.'),
('offer_reminder','A oferta de {product_name} termina em {hours} horas.')
on conflict (type) do nothing;

create table if not exists public.external_videos (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  external_url text not null,
  thumbnail_url text,
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null,
  description text,
  is_active boolean not null default false,
  view_count integer not null default 0,
  click_count integer not null default 0,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_templates enable row level security;
alter table public.external_videos enable row level security;
