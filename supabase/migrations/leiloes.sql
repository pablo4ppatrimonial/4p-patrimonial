create table if not exists public.leiloes (
  id                   uuid        primary key default gen_random_uuid(),
  titulo               text        not null,
  cidade               text,
  estado               text,
  bairro               text,
  valor_avaliacao      numeric,
  valor_lance_minimo   numeric,
  percentual_desconto  numeric,
  data_leilao          timestamptz,
  tipo_imovel          text,
  url_original         text        not null,
  imagem_url           text,
  fonte                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
alter table public.leiloes add constraint leiloes_url_original_key unique (url_original);
alter table public.leiloes enable row level security;
create policy "Leitura publica de leiloes"
  on public.leiloes for select
  using (true);
create index if not exists leiloes_cidade_estado_idx on public.leiloes (estado, cidade);
create index if not exists leiloes_data_leilao_idx on public.leiloes (data_leilao);
