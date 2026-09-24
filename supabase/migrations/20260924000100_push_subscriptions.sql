create table if not exists public.sparky_push_subscriptions (
  endpoint text primary key,
  account_key text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_sent_at timestamptz
);

create index if not exists sparky_push_subscriptions_account_idx on public.sparky_push_subscriptions (account_key);
create index if not exists sparky_push_subscriptions_due_idx on public.sparky_push_subscriptions (last_sent_at);
alter table public.sparky_push_subscriptions enable row level security;
revoke all on public.sparky_push_subscriptions from anon, authenticated;
