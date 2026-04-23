create table if not exists public.popups (
  id              uuid        primary key default gen_random_uuid(),
  titulo          text        not null,
  imagem_url      text,
  mensagem        text,
  link_whatsapp   text,
  ativo           boolean     not null default true,
  frequencia      text        not null default '2dias', -- 'sempre' | '1dia' | '2dias' | '7dias'
  delay_segundos  integer     not null default 30,
  publico         text        not null default 'todos', -- 'todos' | 'lowticket' | 'mentoria'
  created_at      timestamptz not null default now()
);

alter table public.popups enable row level security;

create policy "Alunos leem popups ativos"
  on public.popups for select
  using (auth.uid() is not null and ativo = true);

-- Storage bucket for popup images
insert into storage.buckets (id, name, public)
  values ('popups', 'popups', true)
  on conflict (id) do nothing;

create policy if not exists "popups_upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'popups');

create policy if not exists "popups_read"
  on storage.objects for select
  to public
  using (bucket_id = 'popups');
