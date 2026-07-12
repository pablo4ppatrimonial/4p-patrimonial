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
