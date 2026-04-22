-- Função SECURITY DEFINER para ranking público (bypassa RLS da tabela progresso)
create or replace function public.get_leaderboard()
returns table(
  user_id          uuid,
  nome             text,
  aulas_concluidas bigint,
  pontos           bigint
)
language sql
security definer
stable
as $$
  select
    p.user_id,
    coalesce(pr.nome, 'Investidor') as nome,
    count(p.aula_num)::bigint        as aulas_concluidas,
    (count(p.aula_num) * 100)::bigint as pontos
  from public.progresso p
  left join public.profiles pr on pr.id = p.user_id
  where p.concluida = true
  group by p.user_id, pr.nome
  order by pontos desc
  limit 20;
$$;

grant execute on function public.get_leaderboard() to authenticated;
