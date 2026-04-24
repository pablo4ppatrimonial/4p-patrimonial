-- ================================================================
-- security_rls.sql — Auditoria e correção completa de RLS
-- Execute no SQL Editor do Supabase Dashboard (Run all)
-- ================================================================

-- ── 1. PROFILES ──
-- Sem migration original de RLS; adiciona proteção básica
alter table public.profiles enable row level security;

drop policy if exists "Usuário lê próprio perfil"        on public.profiles;
drop policy if exists "Usuário atualiza próprio perfil"  on public.profiles;

create policy "Usuário lê próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuário atualiza próprio perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- INSERT feito pelo webhook via service_role (bypassa RLS automaticamente)

-- ── 2. PROGRESSO ── (confirma correto)
alter table public.progresso enable row level security;

drop policy if exists "Aluno le proprio progresso"       on public.progresso;
drop policy if exists "Aluno insere proprio progresso"   on public.progresso;
drop policy if exists "Aluno atualiza proprio progresso" on public.progresso;

create policy "Aluno le proprio progresso"
  on public.progresso for select
  using (auth.uid() = user_id);

create policy "Aluno insere proprio progresso"
  on public.progresso for insert
  with check (auth.uid() = user_id);

create policy "Aluno atualiza proprio progresso"
  on public.progresso for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 3. AULAS_CONFIG ── (confirma correto)
alter table public.aulas_config enable row level security;

drop policy if exists "Alunos leem aulas publicadas" on public.aulas_config;

create policy "Alunos leem aulas publicadas"
  on public.aulas_config for select
  using (auth.uid() is not null and status = 'publicada');

-- ── 4. ENCONTROS ── (confirma correto)
alter table public.encontros enable row level security;

drop policy if exists "Alunos leem encontros ativos" on public.encontros;

create policy "Alunos leem encontros ativos"
  on public.encontros for select
  using (auth.uid() is not null and ativo = true);

-- ── 5. CONFIGURACOES ── (confirma correto — somente leitura)
alter table public.configuracoes enable row level security;

drop policy if exists "Alunos leem configuracoes" on public.configuracoes;

create policy "Alunos leem configuracoes"
  on public.configuracoes for select
  using (auth.uid() is not null);

-- ── 6. NOTIFICACOES ── (melhora: with check restringe aluno a só marcar lida=true)
alter table public.notificacoes enable row level security;

drop policy if exists "Aluno le proprias notificacoes"    on public.notificacoes;
drop policy if exists "Aluno marca notificacao como lida" on public.notificacoes;

create policy "Aluno le proprias notificacoes"
  on public.notificacoes for select
  using (auth.uid() is not null and (user_id = auth.uid() or user_id is null));

create policy "Aluno marca notificacao como lida"
  on public.notificacoes for update
  using (auth.uid() is not null and (user_id = auth.uid() or user_id is null))
  with check (lida = true);  -- aluno só pode marcar como lida, nunca desmarcar

-- ── 7. CASOS_REAIS ── (confirma correto)
alter table public.casos_reais enable row level security;

drop policy if exists "Alunos leem casos ativos" on public.casos_reais;

create policy "Alunos leem casos ativos"
  on public.casos_reais for select
  using (auth.uid() is not null and ativo = true);

-- ── 8. POSTS ── FIX CRÍTICO: update policy era demasiado permissiva
-- Qualquer aluno autenticado conseguia alterar fixado/deletado de qualquer post
alter table public.posts enable row level security;

drop policy if exists "Alunos leem posts ativos" on public.posts;
drop policy if exists "Aluno insere proprio post" on public.posts;
drop policy if exists "Aluno da like"             on public.posts;

create policy "Alunos leem posts ativos"
  on public.posts for select
  using (auth.uid() is not null and deletado = false);

-- Alunos só criam posts de nível raiz (não podem criar respostas admin)
create policy "Aluno insere proprio post"
  on public.posts for insert
  with check (
    auth.uid() = user_id
    and (is_admin_reply = false or is_admin_reply is null)
    and (parent_id is null)
  );

-- Alunos só podem atualizar likes em posts não deletados
create policy "Aluno da like"
  on public.posts for update
  using (auth.uid() is not null and deletado = false);

-- Impede que alunos (role 'authenticated') alterem colunas sensíveis
-- O admin usa service_role que bypassa isto automaticamente
revoke update (deletado, fixado, is_admin_reply, parent_id, user_id)
  on public.posts from authenticated;

-- ── 9. POPUPS ── (confirma correto)
alter table public.popups enable row level security;

drop policy if exists "Alunos leem popups ativos" on public.popups;

create policy "Alunos leem popups ativos"
  on public.popups for select
  using (auth.uid() is not null and ativo = true);

-- ── 10. MODULOS_MENTORIA ── (confirma correto)
alter table public.modulos_mentoria enable row level security;

drop policy if exists "Alunos leem módulos ativos" on public.modulos_mentoria;

create policy "Alunos leem módulos ativos"
  on public.modulos_mentoria for select
  using (auth.uid() is not null and ativo = true);
