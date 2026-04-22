create table if not exists public.encontros (
  id         uuid        primary key default gen_random_uuid(),
  titulo     text        not null,
  data       date        not null,
  hora       time,
  link       text,
  descricao  text,
  ativo      boolean     not null default true,
  created_at timestamptz not null default now()
);
alter table public.encontros enable row level security;
create policy "Alunos leem encontros ativos"
  on public.encontros for select
  using (auth.uid() is not null and ativo = true);
create index if not exists encontros_data_idx on public.encontros (data);
