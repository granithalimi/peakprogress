-- ============================================================================
-- PeakProgress Database Setup Script
-- Paste and run this in your Supabase SQL Editor.
-- ============================================================================

-- Enable pgcrypto / uuid-ossp if not already enabled
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. Workout Plans Table
-- ============================================================================
create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 2. Plan Days Table (Monday through Sunday: 0 = Mon ... 6 = Sun)
-- ============================================================================
create table if not exists public.plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.workout_plans(id) on delete cascade not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_rest boolean not null default false,
  order_index integer not null default 0
);

-- ============================================================================
-- 3. Plan Exercises Table
-- ============================================================================
create table if not exists public.plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid references public.plan_days(id) on delete cascade not null,
  name text not null,
  image text,
  order_index integer not null default 0
);

-- ============================================================================
-- 4. Workout Logs Table (Sessions logged per week and day)
-- ============================================================================
create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  plan_id uuid references public.workout_plans(id) on delete set null,
  week_start_date date not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  completed boolean not null default false,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 5. Workout Log Entries Table (Exercise performance, top sets & completions)
-- ============================================================================
create table if not exists public.workout_log_entries (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid references public.workout_logs(id) on delete cascade not null,
  exercise_name text not null,
  top_weight numeric default 0,
  top_reps integer default 0,
  completed boolean not null default false
);

-- ============================================================================
-- 6. Indexes for Optimized Query Performance
-- ============================================================================
create index if not exists idx_workout_plans_user_id on public.workout_plans(user_id);
create index if not exists idx_plan_days_plan_id on public.plan_days(plan_id);
create index if not exists idx_plan_exercises_plan_day_id on public.plan_exercises(plan_day_id);
create index if not exists idx_workout_logs_user_week on public.workout_logs(user_id, week_start_date);
create index if not exists idx_workout_log_entries_log_id on public.workout_log_entries(workout_log_id);

-- ============================================================================
-- 7. Row Level Security (RLS) Policies
-- ============================================================================
alter table public.workout_plans enable row level security;
alter table public.plan_days enable row level security;
alter table public.plan_exercises enable row level security;
alter table public.workout_logs enable row level security;
alter table public.workout_log_entries enable row level security;

-- Workout Plans Policies
create policy "Users can view their own workout plans"
  on public.workout_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert their own workout plans"
  on public.workout_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own workout plans"
  on public.workout_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete their own workout plans"
  on public.workout_plans for delete
  using (auth.uid() = user_id);

-- Plan Days Policies
create policy "Users can view plan days of their plans"
  on public.plan_days for select
  using (exists (
    select 1 from public.workout_plans
    where public.workout_plans.id = public.plan_days.plan_id
    and public.workout_plans.user_id = auth.uid()
  ));

create policy "Users can insert plan days for their plans"
  on public.plan_days for insert
  with check (exists (
    select 1 from public.workout_plans
    where public.workout_plans.id = public.plan_days.plan_id
    and public.workout_plans.user_id = auth.uid()
  ));

create policy "Users can update plan days of their plans"
  on public.plan_days for update
  using (exists (
    select 1 from public.workout_plans
    where public.workout_plans.id = public.plan_days.plan_id
    and public.workout_plans.user_id = auth.uid()
  ));

create policy "Users can delete plan days of their plans"
  on public.plan_days for delete
  using (exists (
    select 1 from public.workout_plans
    where public.workout_plans.id = public.plan_days.plan_id
    and public.workout_plans.user_id = auth.uid()
  ));

-- Plan Exercises Policies
create policy "Users can view exercises of their plans"
  on public.plan_exercises for select
  using (exists (
    select 1 from public.plan_days
    join public.workout_plans on public.workout_plans.id = public.plan_days.plan_id
    where public.plan_days.id = public.plan_exercises.plan_day_id
    and public.workout_plans.user_id = auth.uid()
  ));

create policy "Users can insert exercises for their plans"
  on public.plan_exercises for insert
  with check (exists (
    select 1 from public.plan_days
    join public.workout_plans on public.workout_plans.id = public.plan_days.plan_id
    where public.plan_days.id = public.plan_exercises.plan_day_id
    and public.workout_plans.user_id = auth.uid()
  ));

create policy "Users can update exercises of their plans"
  on public.plan_exercises for update
  using (exists (
    select 1 from public.plan_days
    join public.workout_plans on public.workout_plans.id = public.plan_days.plan_id
    where public.plan_days.id = public.plan_exercises.plan_day_id
    and public.workout_plans.user_id = auth.uid()
  ));

create policy "Users can delete exercises of their plans"
  on public.plan_exercises for delete
  using (exists (
    select 1 from public.plan_days
    join public.workout_plans on public.workout_plans.id = public.plan_days.plan_id
    where public.plan_days.id = public.plan_exercises.plan_day_id
    and public.workout_plans.user_id = auth.uid()
  ));

-- Workout Logs Policies
create policy "Users can view their own workout logs"
  on public.workout_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own workout logs"
  on public.workout_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own workout logs"
  on public.workout_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own workout logs"
  on public.workout_logs for delete
  using (auth.uid() = user_id);

-- Workout Log Entries Policies
create policy "Users can view their workout log entries"
  on public.workout_log_entries for select
  using (exists (
    select 1 from public.workout_logs
    where public.workout_logs.id = public.workout_log_entries.workout_log_id
    and public.workout_logs.user_id = auth.uid()
  ));

create policy "Users can insert entries to their workout logs"
  on public.workout_log_entries for insert
  with check (exists (
    select 1 from public.workout_logs
    where public.workout_logs.id = public.workout_log_entries.workout_log_id
    and public.workout_logs.user_id = auth.uid()
  ));

create policy "Users can update entries in their workout logs"
  on public.workout_log_entries for update
  using (exists (
    select 1 from public.workout_logs
    where public.workout_logs.id = public.workout_log_entries.workout_log_id
    and public.workout_logs.user_id = auth.uid()
  ));

create policy "Users can delete entries from their workout logs"
  on public.workout_log_entries for delete
  using (exists (
    select 1 from public.workout_logs
    where public.workout_logs.id = public.workout_log_entries.workout_log_id
    and public.workout_logs.user_id = auth.uid()
  ));
