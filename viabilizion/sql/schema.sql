-- Viabilizion — schema inicial (Postgres / Supabase)

create table if not exists cidades (
  id bigint generated always as identity primary key,
  nome text not null,
  uf char(2) not null,
  populacao integer,
  coeficiente_aproveitamento numeric(5,2),
  gabarito_metros numeric(6,2),
  taxa_ocupacao numeric(5,2),
  fonte_dado text,
  atualizado_em timestamptz not null default now()
);

create table if not exists faixas_mcmv (
  id bigint generated always as identity primary key,
  faixa text not null,
  renda_min numeric(12,2) not null,
  renda_max numeric(12,2) not null,
  teto_imovel numeric(12,2) not null,
  populacao_cidade_min integer,
  populacao_cidade_max integer,
  subsidio_max numeric(12,2),
  taxa_juros_min numeric(5,2),
  taxa_juros_max numeric(5,2),
  atualizado_em timestamptz not null default now()
);

create table if not exists metragem_minima_mcmv (
  id bigint generated always as identity primary key,
  tipo_imovel text not null,
  metragem_minima numeric(6,2) not null
);

create table if not exists bairros (
  id bigint generated always as identity primary key,
  cidade_id bigint not null references cidades(id),
  nome text not null,
  preco_m2_medio numeric(10,2),
  velocidade_venda_dias integer,
  tipo_predominante text,
  tendencia text check (tendencia in ('em alta', 'estagnado', 'em queda')),
  atualizado_em timestamptz not null default now()
);

create table if not exists empreendimentos (
  id bigint generated always as identity primary key,
  bairro_id bigint not null references bairros(id),
  nome text not null,
  construtora text,
  tipologia text,
  status text check (status in ('lancamento', 'em_obra', 'entregue')),
  unidades integer,
  preco_venda numeric(12,2),
  dias_no_mercado integer,
  fonte_dado text,
  atualizado_em timestamptz not null default now()
);
