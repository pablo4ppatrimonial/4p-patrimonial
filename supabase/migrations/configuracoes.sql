create table if not exists public.configuracoes (
  chave      text        primary key,
  valor      text,
  updated_at timestamptz not null default now()
);
alter table public.configuracoes enable row level security;
create policy "Alunos leem configuracoes"
  on public.configuracoes for select
  using (auth.uid() is not null);

-- Dados padrão — usa upsert para atualizar se já existir
insert into public.configuracoes (chave, valor) values
  ('nome_mentor',       'Pablo Dantas'),
  ('mentor_nome',       'Pablo Dantas'),
  ('plataforma_nome',   '4P Patrimonial'),
  ('nome_plataforma',   '4P Patrimonial'),
  ('bio_mentor',        'Investidor imobiliário na Baixada Santista com método próprio de multiplicação patrimonial'),
  ('mentor_bio',        'Investidor imobiliário na Baixada Santista com método próprio de multiplicação patrimonial'),
  ('mentor_foto',       ''),
  ('titulo_upsell',     'Mentoria 4P Patrimonial'),
  ('upsell_titulo',     'Mentoria 4P Patrimonial'),
  ('descricao_upsell',  'Acompanhamento direto com Pablo Dantas. 24 encontros quinzenais ao vivo, 7 módulos completos e evento presencial em novembro'),
  ('upsell_descricao',  'Acompanhamento direto com Pablo Dantas. 24 encontros quinzenais ao vivo, 7 módulos completos e evento presencial em novembro'),
  ('whatsapp_link',     'https://wa.me/5513992097189'),
  ('portal_etapas',     '[]')
on conflict (chave) do update set valor = excluded.valor, updated_at = now();
