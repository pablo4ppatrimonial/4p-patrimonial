-- Tabela de configuração de aulas (CMS)
create table if not exists public.aulas_config (
  id           uuid        primary key default gen_random_uuid(),
  numero       integer     not null,
  titulo       text        not null,
  descricao    text,
  duracao      text,
  url_video    text,
  url_pdf      text,
  url_planilha text,
  tarefa       text,
  status       text        not null default 'rascunho'
               check (status in ('publicada', 'rascunho')),
  ordem        integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.aulas_config enable row level security;

-- Alunos autenticados leem apenas aulas publicadas
create policy "Alunos leem aulas publicadas"
  on public.aulas_config for select
  using (auth.uid() is not null and status = 'publicada');

-- Service role tem acesso total (admin) — RLS é bypassado automaticamente

create index if not exists aulas_config_ordem_idx  on public.aulas_config (ordem);
create index if not exists aulas_config_status_idx on public.aulas_config (status);
