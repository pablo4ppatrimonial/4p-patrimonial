alter table public.posts
  add column if not exists parent_id      uuid    references public.posts(id) on delete cascade,
  add column if not exists is_admin_reply boolean not null default false,
  add column if not exists deletado       boolean not null default false;

create index if not exists posts_parent_id_idx on public.posts(parent_id);
create index if not exists posts_deletado_idx  on public.posts(deletado);
