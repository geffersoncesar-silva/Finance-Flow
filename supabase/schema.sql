create extension if not exists pgcrypto;

create table if not exists public.categories (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text not null default '📁',
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.accounts (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  bank text not null,
  name text not null,
  type text not null check (type in ('checking', 'savings', 'wallet', 'digital', 'investment')),
  initial_balance bigint not null default 0,
  current_balance bigint not null default 0,
  identifier text,
  status text not null check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.credit_cards (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  bank text not null,
  limit_amount bigint not null default 0,
  available_limit bigint not null default 0,
  closing_day smallint not null check (closing_day between 1 and 31),
  due_day smallint not null check (due_day between 1 and 31),
  color text not null default '#4f46e5',
  status text not null check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.goals (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  target bigint not null check (target > 0),
  current bigint not null default 0 check (current >= 0),
  deadline date not null,
  description text not null default '',
  status text not null check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.transactions (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  description text not null,
  type text not null check (type in ('income', 'expense')),
  amount bigint not null check (amount > 0),
  date date not null,
  category_id text not null,
  account_id text,
  card_id text,
  payment_method text not null check (payment_method in ('cash', 'debit', 'credit', 'transfer')),
  status text not null check (status in ('paid', 'pending', 'cancelled')),
  notes text not null default '',
  recurring text not null default 'none' check (recurring in ('none', 'monthly', 'weekly', 'annual')),
  installment_current integer check (installment_current is null or installment_current >= 1),
  installments_total integer check (installments_total is null or installments_total >= 1),
  recurrence_parent_id text,
  installment_group_id text,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists transactions_user_date_idx on public.transactions(user_id, date desc);
create index if not exists transactions_user_category_idx on public.transactions(user_id, category_id);
create index if not exists transactions_user_account_idx on public.transactions(user_id, account_id);
create index if not exists transactions_user_card_idx on public.transactions(user_id, card_id);
create index if not exists goals_user_deadline_idx on public.goals(user_id, deadline);

alter table public.categories enable row level security;
alter table public.accounts enable row level security;
alter table public.credit_cards enable row level security;
alter table public.goals enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "Users manage their own categories" on public.categories;
create policy "Users manage their own categories" on public.categories
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own accounts" on public.accounts;
create policy "Users manage their own accounts" on public.accounts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own credit cards" on public.credit_cards;
create policy "Users manage their own credit cards" on public.credit_cards
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own goals" on public.goals;
create policy "Users manage their own goals" on public.goals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own transactions" on public.transactions;
create policy "Users manage their own transactions" on public.transactions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.accounts to authenticated;
grant select, insert, update, delete on public.credit_cards to authenticated;
grant select, insert, update, delete on public.goals to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
