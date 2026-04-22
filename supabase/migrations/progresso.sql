-- Tabela de progresso de aulas por aluno
create table if not exists public.progresso (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  aula_num       integer     not null check (aula_num >= 1),
  concluida      boolean     not null default true,
  data_conclusao timestamptz not null default now(),
  constraint progresso_user_aula_unique unique (user_id, aula_num)
);

alter table public.progresso enable row level security;

-- Aluno lê apenas o próprio progresso
create policy "Aluno le proprio progresso"
  on public.progresso for select
  using (auth.uid() = user_id);

-- Aluno insere apenas o próprio progresso
create policy "Aluno insere proprio progresso"
  on public.progresso for insert
  with check (auth.uid() = user_id);

-- Aluno atualiza apenas o próprio progresso
create policy "Aluno atualiza proprio progresso"
  on public.progresso for update
  using (auth.uid() = user_id);

-- Índice para buscas por aluno
create index if not exists progresso_user_id_idx on public.progresso (user_id);

-- Índice para contagem de conclusões por aula (usado pelo admin)
create index if not exists progresso_aula_num_idx on public.progresso (aula_num);
