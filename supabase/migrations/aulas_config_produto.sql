-- Adiciona coluna produto para separar low ticket de mentoria
alter table public.aulas_config
  add column if not exists produto text not null default 'lowticket';

-- Garante que registros existentes tenham o valor padrão
update public.aulas_config set produto = 'lowticket' where produto is null or produto = '';

-- Índice para filtrar por produto
create index if not exists aulas_config_produto_idx on public.aulas_config (produto, ordem);
