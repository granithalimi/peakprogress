# PeakProgress - Workout Tracker Project Plan & Architecture

This document contains the complete design and implementation plan for the **PeakProgress** Workout Tracker application.

## 1. Authentication & Route Access Rules

- **Unauthenticated Users**:
  - Allowed routes: `/auth/login`, `/auth/sign-up`, `/login`, `/register`, `/auth/forgot-password`, `/auth/confirm`.
  - All other routes (`/`, `/plan`, `/track`, etc.) automatically redirect to `/auth/login`.
- **Authenticated Users**:
  - Full access to all protected app routes:
    - `/` (Dashboard / Progress Overview)
    - `/plan` (Weekly Workout Routine Planner)
    - `/track` (Today & Historical Workout Logger)
  - Visiting `/auth/*`, `/login`, or `/register` automatically redirects to `/`.

---

## 2. Core Routes & Features

### 1. Home / Progress Dashboard (`/`)
- **Key Metrics**: Total workouts, current streak, weekly completion rate, total volume.
- **Weekly Progress Chart**: Visual distribution of completed workouts over recent weeks.
- **Quick Links**: Direct actions to "Track Today's Workout" or "Edit Workout Plan".
- **Recent Activity**: List of recently logged workout sessions with details.

### 2. Plan Route (`/plan`)
- **7-Day Selector Bar** (Monday through Sunday: index `0` to `6`).
- **Day Selector UI**:
  - Horizontal tab bar with day abbreviations (`Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`).
  - Active tab highlighted in sky blue (`bg-sky-500` / `border-sky-500`).
  - Status badges under each day showing whether it is a **Rest** day or the count of planned exercises (e.g. `4 exercises`).
- **Per-Day Options & Controls**:
  - **Rest Day Toggle Switch**: Switch between Active Workout mode and Rest & Recovery mode (`is_rest: true/false`).
  - **Rest Day State**: Displays recovery guidance card with an option to toggle back to active workout.
  - **Exercise Table / List**:
    - Exercise Name (text input)
    - Target Sets (number input, minimum 1, default: 3)
    - Target Reps (number input, minimum 1, default: 10)
    - Target Weight (number input, minimum 0 kg, default: 0)
    - Delete button (trash icon with confirmation / instantaneous removal)
  - **Add Exercise Button**: Append new empty exercise row with defaults.
- **Save & Update Routine**:
  - Single **"Save Routine"** action that persists the full 7-day schedule to Supabase:
    - Upserts active `workout_plans` record for `auth.uid()`.
    - Upserts all 7 `plan_days` rows (`day_of_week` 0..6).
    - Synchronizes `plan_exercises` per day (insert/update/delete).
  - Clean feedback with toast / status alert and instant cache revalidation.

### 3. Track Route (`/track`)
- **Empty State**: If no active workout plan exists, displays *"No plan, create one"* with a button redirecting to `/plan`.
- **Active Tracker**:
  - **Week Navigation**: Previous Week (`<`), Next Week (`>`), and current week selector.
  - **Day Navigation**: 7 Day tabs (Monday through Sunday).
  - **Rest Day State**: If marked as Rest Day, shows a rest day banner with recovery tips and option to log an extra workout.
  - **Exercise Logging & Top Set**:
    - For every planned exercise, a dedicated **Top Set** section displays the weight and reps which users can directly edit.
    - Set-by-set checkboxes for logging completion during the workout.
  - **Save & Finish**: Saves the workout session for that specific week and day.

---

## 3. Design System & UI/UX Guidelines

- **Theme & Mode**:
  - **Light Mode Only** (no dark mode toggle or automatic dark system preference).
  - Clean, modern, high-contrast aesthetic with soft shadows, subtle borders, and rounded cards (`rounded-xl` / `rounded-2xl`).
- **Color Palette**:
  - **Base / Background**: White (`#ffffff`), soft neutral off-white/light gray (`#f8fafc` / `#f1f5f9`) for page backgrounds and card contrasts.
  - **Text & Structure**: Black (`#000000`) and deep slate/neutral dark tones (`#0f172a` / `#1e293b`) for high-legibility headings, primary text, and borders.
  - **Accent / Highlight**: **Light Blue / Sky Blue** (e.g., `#38bdf8` / `#0ea5e9` / `#e0f2fe` tints) for primary action buttons, active tab indicators, checkboxes, badges, and progress bar highlights.
- **Responsiveness (Mobile-First)**:
  - Optimized primarily for mobile viewport widths (360px - 430px) with touch-friendly targets (minimum 44px tap areas).
  - Bottom navigation bar or sticky clean header navigation for effortless thumb reach on mobile devices.
  - Horizontally scrollable or compact tab selectors for 7-day week switching (`/plan` and `/track`).
  - Fluid layouts scaling gracefully to tablet and desktop viewports with centered max-width containers (`max-w-md` to `max-w-xl` on mobile-first views).

---

## 4. Database Schema (Supabase PostgreSQL)

```sql
-- 1. Workout Plans
create table workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Plan Days (Monday through Sunday)
create table plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references workout_plans(id) on delete cascade not null,
  day_of_week smallint not null, -- 0 = Monday, 1 = Tuesday, ... 6 = Sunday
  is_rest boolean not null default false,
  order_index integer not null default 0
);

-- 3. Plan Exercises
create table plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid references plan_days(id) on delete cascade not null,
  name text not null,
  target_sets integer not null default 3,
  target_reps integer not null default 10,
  target_weight numeric default 0,
  order_index integer not null default 0
);

-- 4. Workout Logs (Sessions by week & day)
create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_id uuid references workout_plans(id) on delete set null,
  week_start_date date not null,
  day_of_week smallint not null,
  completed boolean not null default false,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Workout Log Entries (Sets & Top Set per exercise)
create table workout_log_entries (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid references workout_logs(id) on delete cascade not null,
  exercise_name text not null,
  top_weight numeric default 0,
  top_reps integer default 0,
  sets_completed integer default 0,
  total_sets integer default 3,
  completed boolean not null default false
);
```

---

## 5. Implementation Steps
1. **Route Protection & Aliases**: Auth guards for `/auth/*`, `/login`, `/register`, and protected routes (`/`, `/plan`, `/track`).
2. **Types & Schema**: TypeScript models and Supabase schema definition.
3. **App Navigation Bar**: Unified navigation header for all routes.
4. **Build `/plan`**: 7-day schedule with Rest Day toggles and exercise management.
5. **Build `/track`**: Week selector, Day selector, "No plan, create one" empty state, editable Top Set (weight & reps) per exercise, and set completion checkboxes.
6. **Build `/`**: Progress dashboard showing weekly workouts, streaks, and volume history.
7. **Verification**: Verify Next.js build, route protections, and end-to-end user workflows.
