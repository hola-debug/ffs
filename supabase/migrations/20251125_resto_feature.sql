-- Create restaurants table
create table public.restaurants (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for restaurants
alter table public.restaurants enable row level security;

-- Policies for restaurants
create policy "Users can view their own restaurants"
  on public.restaurants for select
  using (auth.uid() = owner_id);

create policy "Users can insert their own restaurants"
  on public.restaurants for insert
  with check (auth.uid() = owner_id);

create policy "Users can update their own restaurants"
  on public.restaurants for update
  using (auth.uid() = owner_id);

create policy "Users can delete their own restaurants"
  on public.restaurants for delete
  using (auth.uid() = owner_id);

-- Create inventories table
create table public.inventories (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  item_name text not null,
  quantity integer default 0 not null,
  unit_price numeric default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for inventories
alter table public.inventories enable row level security;

-- Policies for inventories
create policy "Users can view inventory of their restaurants"
  on public.inventories for select
  using (
    exists (
      select 1 from public.restaurants
      where restaurants.id = inventories.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

create policy "Users can insert inventory to their restaurants"
  on public.inventories for insert
  with check (
    exists (
      select 1 from public.restaurants
      where restaurants.id = inventories.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

create policy "Users can update inventory of their restaurants"
  on public.inventories for update
  using (
    exists (
      select 1 from public.restaurants
      where restaurants.id = inventories.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

create policy "Users can delete inventory of their restaurants"
  on public.inventories for delete
  using (
    exists (
      select 1 from public.restaurants
      where restaurants.id = inventories.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

-- Create invoices table
create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  total numeric default 0 not null,
  pdf_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for invoices
alter table public.invoices enable row level security;

-- Policies for invoices
create policy "Users can view invoices of their restaurants"
  on public.invoices for select
  using (
    exists (
      select 1 from public.restaurants
      where restaurants.id = invoices.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

create policy "Users can insert invoices to their restaurants"
  on public.invoices for insert
  with check (
    exists (
      select 1 from public.restaurants
      where restaurants.id = invoices.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

-- Storage bucket setup (if not exists)
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Users can upload invoices"
  on storage.objects for insert
  with check (
    bucket_id = 'invoices' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own invoices"
  on storage.objects for select
  using (
    bucket_id = 'invoices' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
