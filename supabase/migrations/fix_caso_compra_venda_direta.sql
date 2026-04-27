-- Corrige prazo do case "Compra e venda direta" de 6 meses para 9 meses
update public.casos_reais
  set prazo = '9 meses'
  where titulo ilike '%compra e venda direta%'
    and prazo = '6 meses';
