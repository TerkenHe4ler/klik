create table if not exists public.game_saves (
    user_id uuid primary key references auth.users (id) on delete cascade,
    save_data jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now(),
    constraint game_saves_save_data_object check (jsonb_typeof(save_data) = 'object')
);

alter table public.game_saves enable row level security;

grant select, insert, update on table public.game_saves to authenticated;
revoke all on table public.game_saves from anon;

drop policy if exists "Users can read their own game save" on public.game_saves;
create policy "Users can read their own game save"
    on public.game_saves for select to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own game save" on public.game_saves;
create policy "Users can create their own game save"
    on public.game_saves for insert to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own game save" on public.game_saves;
create policy "Users can update their own game save"
    on public.game_saves for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);
