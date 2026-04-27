create table if not exists public.ranking_comprovantes (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        references auth.users on delete cascade,
  valor_declarado   numeric     not null,
  descricao         text,
  imagem_url        text,
  status            text        not null default 'pendente', -- pendente | aprovado | reprovado
  motivo_reprovacao text,
  created_at        timestamptz not null default now(),
  reviewed_at       timestamptz,
  reviewed_by       text
);

alter table public.ranking_comprovantes enable row level security;

-- Aluno vê e insere os próprios comprovantes
create policy "Aluno vê seus comprovantes"
  on public.ranking_comprovantes for select
  using (auth.uid() = user_id);

create policy "Aluno insere comprovante"
  on public.ranking_comprovantes for insert
  with check (auth.uid() = user_id);

-- Admin (service key) tem acesso total
create policy "Service role full access"
  on public.ranking_comprovantes for all
  using (true) with check (true);

-- Bucket no Storage (executar via dashboard ou CLI)
-- insert into storage.buckets (id, name, public) values ('ranking-comprovantes', 'ranking-comprovantes', true)
-- on conflict do nothing;
