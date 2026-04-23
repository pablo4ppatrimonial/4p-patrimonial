-- Allow PostgREST to join posts → profiles via user_id
-- PostgreSQL allows multiple FK constraints on the same column;
-- posts.user_id already references auth.users(id), this adds a second FK
-- so Supabase client .select('profiles(nome)') works without a custom RPC.
alter table public.posts
  add constraint if not exists posts_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;
