-- ── mapa_oportunidades ──
create table if not exists public.mapa_oportunidades (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  bairro      text,
  lat         double precision not null,
  lng         double precision not null,
  pilar       text,
  nivel       text default 'Alta',
  descricao   text,
  foto_url    text,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.mapa_oportunidades enable row level security;
create policy "Admin full access mapa_oportunidades"
  on public.mapa_oportunidades for all using (true) with check (true);

-- ── aulas_mentoria ──
create table if not exists public.aulas_mentoria (
  id          uuid primary key default gen_random_uuid(),
  modulo_num  integer not null,
  aula_id     text not null,   -- '1.1', '2.3', etc.
  titulo      text not null,
  url_video   text,
  url_pdf     text,
  url_planilha text,
  tarefa      text,
  status      text not null default 'ativo',
  updated_at  timestamptz not null default now()
);
alter table public.aulas_mentoria enable row level security;
create policy "Admin full access aulas_mentoria"
  on public.aulas_mentoria for all using (true) with check (true);
create unique index if not exists aulas_mentoria_aula_id_idx on public.aulas_mentoria(aula_id);
