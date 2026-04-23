create table if not exists public.modulos_mentoria (
  id         uuid        primary key default gen_random_uuid(),
  numero     integer     not null,
  titulo     text        not null,
  tags       text,
  status     text        not null default 'disponivel',
  ordem      integer     not null default 0,
  ativo      boolean     not null default true,
  created_at timestamptz not null default now()
);
alter table public.modulos_mentoria enable row level security;
create policy "Alunos leem módulos ativos"
  on public.modulos_mentoria for select
  using (auth.uid() is not null and ativo = true);
create index if not exists modulos_mentoria_ordem_idx on public.modulos_mentoria (ativo, ordem);

insert into public.modulos_mentoria (numero, titulo, tags, status, ordem) values
  (1, 'Diagnóstico patrimonial',    '4 sessões, Diagnóstico completo, Planilha personalizada', 'disponivel', 1),
  (2, 'Estruturação de holding',    '3 sessões, Template jurídico, Q&A exclusivo',               'disponivel', 2),
  (3, 'Alocação de ativos',         '4 sessões, Carteira modelo, Análise ao vivo',               'disponivel', 3),
  (4, 'Blindagem e proteção',       '3 sessões, Consulta jurídica, Checklist',                   'disponivel', 4),
  (5, 'FIIs e renda variável',      '4 sessões, Relatórios premium, Watchlist',                  'bloqueado',  5),
  (6, 'Previdência e PGBL/VGBL',    '2 sessões, Simulações, Comparativo',                        'bloqueado',  6),
  (7, 'Planejamento sucessório',     '3 sessões, Modelo testamentário, Consultoria',              'bloqueado',  7),
  (8, 'Legado e perpetuação',        '2 sessões, Plano estratégico, Mentoria vitalícia',          'bloqueado',  8)
on conflict do nothing;
