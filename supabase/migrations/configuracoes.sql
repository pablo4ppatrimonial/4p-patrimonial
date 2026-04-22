create table if not exists public.configuracoes (
  chave      text        primary key,
  valor      text,
  updated_at timestamptz not null default now()
);
alter table public.configuracoes enable row level security;
create policy "Alunos leem configuracoes"
  on public.configuracoes for select
  using (auth.uid() is not null);

-- Dados padrão
insert into public.configuracoes (chave, valor) values
  ('mentor_nome',       'Pablo Angelys'),
  ('mentor_bio',        'Especialista em patrimônio e investimentos com mais de 10 anos de experiência ajudando famílias a construírem riqueza duradoura.'),
  ('mentor_foto',       ''),
  ('upsell_titulo',     'Mentoria Premium 4P'),
  ('upsell_descricao',  'Acompanhamento direto com Pablo. Sessões ao vivo toda semana, revisão de carteira e suporte personalizado.'),
  ('whatsapp_link',     'https://wa.me/5511999999999'),
  ('plataforma_nome',   '4P Patrimonial')
on conflict (chave) do nothing;
