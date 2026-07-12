# Viabilizion

Site estático (HTML/CSS/JS puro, sem framework) para estudo de viabilidade imobiliária no Brasil.

## Estrutura

```
viabilizion/
├── index.html      # Página inicial (layout de busca por cidade)
├── config.js       # Credenciais do Supabase (URL + chave anon/publishable)
├── sql/
│   └── schema.sql  # Criação das tabelas no Postgres (Supabase)
└── README.md
```

## Tabelas (sql/schema.sql)

- **cidades** — dados urbanísticos por cidade (coeficiente de aproveitamento, gabarito, taxa de ocupação, etc.).
- **faixas_mcmv** — faixas de renda e condições do Minha Casa Minha Vida por faixa de população.
- **metragem_minima_mcmv** — metragem mínima exigida por tipo de imóvel no programa.

## Status atual

Apenas a estrutura inicial do projeto está pronta:

- Layout de boas-vindas em `index.html` (sem lógica de busca implementada ainda).
- `config.js` com placeholder da chave do Supabase (é necessário completar a chave publishable real antes de conectar).
- Schema SQL pronto para ser executado no Supabase.

Nenhuma integração com o Supabase foi feita ainda.
