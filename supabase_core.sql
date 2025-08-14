
-- Núcleo (igual que el starter básico)
create type if not exists public.document_type as enum ('recibo','resumen_anual','contrato');

create table if not exists public.investors (
  id uuid primary key default auth.uid(),
  email text unique not null,
  nombre text
);
alter table public.investors enable row level security;

do $$ begin
  create policy if not exists "investors:select-own" on public.investors for select using (id = auth.uid());
  create policy if not exists "investors:admin-select-all" on public.investors for select to authenticated using (coalesce(auth.jwt()->>'role','')='admin');
  create policy if not exists "investors:self-insert" on public.investors for insert with check (id = auth.uid());
  create policy if not exists "investors:admin-all" on public.investors for all to authenticated using (coalesce(auth.jwt()->>'role','')='admin') with check (coalesce(auth.jwt()->>'role','')='admin');
end $$;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references public.investors(id) on delete cascade,
  tipo public.document_type not null,
  anio int not null check (anio between 2000 and 2100),
  path text not null,
  nombre_mostrar text not null,
  uploaded_at timestamptz default now()
);
alter table public.documents enable row level security;

do $$ begin
  create policy if not exists "documents:select-own" on public.documents for select to authenticated using (investor_id = auth.uid());
  create policy if not exists "documents:admin-all" on public.documents for all to authenticated using (coalesce(auth.jwt()->>'role','')='admin') with check (coalesce(auth.jwt()->>'role','')='admin');
end $$;

create table if not exists public.download_logs (
  id bigserial primary key,
  doc_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null,
  ts timestamptz default now()
);
alter table public.download_logs enable row level security;
do $$ begin
  create policy if not exists "download_logs:admin-all" on public.download_logs for all to authenticated using (coalesce(auth.jwt()->>'role','')='admin') with check (coalesce(auth.jwt()->>'role','')='admin');
end $$;

select storage.create_bucket('docs', public => false);

do $$ begin
  create policy if not exists "storage:read-own" on storage.objects for select to authenticated using (bucket_id='docs' and (split_part(name,'/',1)=auth.uid()::text or coalesce(auth.jwt()->>'role','')='admin'));
  create policy if not exists "storage:admin-insert" on storage.objects for insert to authenticated with check (bucket_id='docs' and coalesce(auth.jwt()->>'role','')='admin');
  create policy if not exists "storage:admin-delete" on storage.objects for delete to authenticated using (bucket_id='docs' and coalesce(auth.jwt()->>'role','')='admin');
  create policy if not exists "storage:admin-update" on storage.objects for update to authenticated using (bucket_id='docs' and coalesce(auth.jwt()->>'role','')='admin') with check (bucket_id='docs' and coalesce(auth.jwt()->>'role','')='admin');
end $$;
