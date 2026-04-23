insert into public.configuracoes (chave, valor) values
  ('hub_titulo',       'Mentoria 4P Patrimonial'),
  ('hub_descricao',    'Acompanhamento direto com Pablo Dantas. Sessões ao vivo quinzenais, revisão de carteira personalizada e suporte completo para você construir um patrimônio sólido e duradouro.'),
  ('hub_link_sessao',  'https://wa.me/5511999999999'),
  ('hub_num_modulos',  '8')
on conflict (chave) do update set valor = excluded.valor, updated_at = now();
