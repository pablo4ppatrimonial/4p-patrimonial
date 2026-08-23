-- ================================================================
-- leiloes_rls.sql — RLS para a tela de Alertas de Leilão
-- Execute no SQL Editor do Supabase Dashboard (Run all)
-- ================================================================

-- ── LEILOES ── leitura para qualquer usuário autenticado da plataforma
alter table public.leiloes enable row level security;

drop policy if exists "Leitura autenticada de leiloes" on public.leiloes;

create policy "Leitura autenticada de leiloes"
  on public.leiloes for select
  to authenticated
  using (true);

-- INSERT/UPDATE feitos pelo scraper via service_role (bypassa RLS automaticamente)

-- ── PREFERENCIAS_LEILAO ── cada usuário só vê/gerencia as próprias preferências
alter table public.preferencias_leilao enable row level security;

drop policy if exists "Usuario gerencia proprias preferencias de leilao" on public.preferencias_leilao;

create policy "Usuario gerencia proprias preferencias de leilao"
  on public.preferencias_leilao for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
