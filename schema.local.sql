-- CV Maker Local Schema
-- For local PostgreSQL development only
-- Mirrors production (Supabase) schema exactly except:
--   1. A local `users` table replaces Supabase auth.users
--   2. RLS policies are omitted (not needed locally)

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- Users (mirrors Supabase auth.users locally)
-- ─────────────────────────────────────────
create table users (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- CVs
-- ─────────────────────────────────────────
create table cvs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  title       text not null,
  template    text not null default 'ats-classic',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- Personal Info (one per CV)
-- ─────────────────────────────────────────
create table personal_info (
  id          uuid primary key default gen_random_uuid(),
  cv_id       uuid not null references cvs(id) on delete cascade,
  full_name   text not null,
  job_title   text,
  email       text,
  phone       text,
  location    text,
  linkedin    text,
  github      text,
  website     text,
  summary     text
);

-- ─────────────────────────────────────────
-- Work Experience
-- ─────────────────────────────────────────
create table work_experience (
  id           uuid primary key default gen_random_uuid(),
  cv_id        uuid not null references cvs(id) on delete cascade,
  company      text not null,
  role         text not null,
  location     text,
  start_date   date not null,
  end_date     date,
  is_current   boolean not null default false,
  bullets      text[] not null default '{}',
  order_index  int not null default 0
);

-- ─────────────────────────────────────────
-- Education
-- ─────────────────────────────────────────
create table education (
  id           uuid primary key default gen_random_uuid(),
  cv_id        uuid not null references cvs(id) on delete cascade,
  institution  text not null,
  degree       text not null,
  field        text,
  start_date   date,
  end_date     date,
  is_current   boolean not null default false,
  achievements text[] not null default '{}',
  order_index  int not null default 0
);

-- ─────────────────────────────────────────
-- Skills
-- ─────────────────────────────────────────
create table skills (
  id          uuid primary key default gen_random_uuid(),
  cv_id       uuid not null references cvs(id) on delete cascade,
  category    text not null,
  items       text[] not null default '{}',
  order_index int not null default 0
);

-- ─────────────────────────────────────────
-- Projects
-- ─────────────────────────────────────────
create table projects (
  id          uuid primary key default gen_random_uuid(),
  cv_id       uuid not null references cvs(id) on delete cascade,
  name        text not null,
  description text,
  bullets     text[] not null default '{}',
  url         text,
  order_index int not null default 0
);

-- ─────────────────────────────────────────
-- Certifications
-- ─────────────────────────────────────────
create table certifications (
  id           uuid primary key default gen_random_uuid(),
  cv_id        uuid not null references cvs(id) on delete cascade,
  name         text not null,
  issuer       text,
  issue_date   date,
  expiry_date  date,
  url          text,
  order_index  int not null default 0
);

-- ─────────────────────────────────────────
-- Achievements
-- ─────────────────────────────────────────
create table achievements (
  id          uuid primary key default gen_random_uuid(),
  cv_id       uuid not null references cvs(id) on delete cascade,
  description text not null,
  order_index int not null default 0
);

-- ─────────────────────────────────────────
-- Auto-update updated_at on cvs
-- ─────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger cvs_updated_at
  before update on cvs
  for each row execute function update_updated_at();
