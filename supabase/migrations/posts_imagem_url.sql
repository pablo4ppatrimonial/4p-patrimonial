alter table public.posts
  add column if not exists imagem_url text;

-- Storage bucket for community post images
insert into storage.buckets (id, name, public)
  values ('comunidade', 'comunidade', true)
  on conflict (id) do nothing;

-- Allow authenticated users to upload their own images
create policy if not exists "comunidade_upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'comunidade' and (storage.foldername(name))[1] = 'posts');

-- Allow public read access
create policy if not exists "comunidade_read"
  on storage.objects for select
  to public
  using (bucket_id = 'comunidade');
