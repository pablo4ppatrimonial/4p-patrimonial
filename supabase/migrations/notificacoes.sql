create table if not exists public.notificacoes (
  id         uuid        primary key default gen_random_uuid(),
  titulo     text        not null,
  mensagem   text,
  user_id    uuid        references auth.users(id) on delete cascade, -- null = para todos
  lida       boolean     not null default false,
  criado_em  timestamptz not null default now()
);
alter table public.notificacoes enable row level security;
create policy "Aluno le proprias notificacoes"
  on public.notificacoes for select
  using (auth.uid() is not null and (user_id = auth.uid() or user_id is null));
create policy "Aluno marca notificacao como lida"
  on public.notificacoes for update
  using (auth.uid() is not null and (user_id = auth.uid() or user_id is null))
  with check (true);
create index if not exists notificacoes_user_idx      on public.notificacoes (user_id);
create index if not exists notificacoes_criado_em_idx on public.notificacoes (criado_em desc);
