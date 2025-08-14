
-- Tablas para préstamos y recibos auto-generados
create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references public.investors(id) on delete cascade,
  title text,
  principal numeric(12,2) not null check (principal > 0),
  annual_rate numeric(6,4) not null check (annual_rate >= 0), -- 0.10 = 10%
  start_date date not null,
  end_date date, -- opcional
  payment_day int not null default 5 check (payment_day between 1 and 28),
  retention_pct numeric(5,2) not null default 19.00, -- % retención IRPF
  active boolean not null default true,
  created_at timestamptz default now()
);
alter table public.loans enable row level security;

do $$ begin
  create policy if not exists "loans:select-own" on public.loans for select to authenticated using (investor_id = auth.uid());
  create policy if not exists "loans:admin-all" on public.loans for all to authenticated using (coalesce(auth.jwt()->>'role','')='admin') with check (coalesce(auth.jwt()->>'role','')='admin');
end $$;

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references public.investors(id) on delete cascade,
  loan_id uuid not null references public.loans(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  gross_interest numeric(12,2) not null,
  retention_pct numeric(5,2) not null,
  retention_amount numeric(12,2) not null,
  net_amount numeric(12,2) not null,
  currency text not null default 'EUR',
  payment_date date,
  storage_path text not null,
  created_at timestamptz default now(),
  unique (loan_id, period_start, period_end)
);
alter table public.receipts enable row level security;

do $$ begin
  create policy if not exists "receipts:select-own" on public.receipts for select to authenticated using (investor_id = auth.uid());
  create policy if not exists "receipts:admin-all" on public.receipts for all to authenticated using (coalesce(auth.jwt()->>'role','')='admin') with check (coalesce(auth.jwt()->>'role','')='admin');
end $$;
