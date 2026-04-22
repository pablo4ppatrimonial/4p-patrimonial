create table if not exists public.posts (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references auth.users(id) on delete cascade,
  autor_nome text        not null default 'Anônimo',
  conteudo   text        not null,
  fixado     boolean     not null default false,
  deletado   boolean     not null default false,
  likes      integer     not null default 0,
  criado_em  timestamptz not null default now()
);
alter table public.posts enable row level security;
create policy "Alunos leem posts ativos"
  on public.posts for select
  using (auth.uid() is not null and deletado = false);
create policy "Aluno insere proprio post"
  on public.posts for insert
  with check (auth.uid() = user_id);
create policy "Aluno da like"
  on public.posts for update
  using (auth.uid() is not null);
create index if not exists posts_criado_em_idx on public.posts (fixado desc, criado_em desc);
