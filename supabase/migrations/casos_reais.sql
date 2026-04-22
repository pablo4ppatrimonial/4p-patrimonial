create table if not exists public.casos_reais (
  id             uuid        primary key default gen_random_uuid(),
  titulo         text        not null,
  descricao      text,
  valor_entrada  text,
  valor_saida    text,
  prazo          text,
  tipo_operacao  text,
  ativo          boolean     not null default true,
  ordem          integer     not null default 0,
  created_at     timestamptz not null default now()
);
alter table public.casos_reais enable row level security;
create policy "Alunos leem casos ativos"
  on public.casos_reais for select
  using (auth.uid() is not null and ativo = true);
create index if not exists casos_reais_ordem_idx on public.casos_reais (ativo, ordem);
