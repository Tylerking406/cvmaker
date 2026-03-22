-- CV Maker Schema
-- Run this in Supabase SQL Editor
-- Supabase Auth handles the users table automatically

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- CVs
-- ─────────────────────────────────────────
create table cvs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,              -- e.g. "Software Engineer CV"
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
  category    text not null,   -- e.g. "Languages", "Frameworks", "DevOps"
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

-- ─────────────────────────────────────────
-- Row Level Security (RLS)
-- Users can only access their own CVs and data
-- ─────────────────────────────────────────
alter table cvs               enable row level security;
alter table personal_info     enable row level security;
alter table work_experience   enable row level security;
alter table education         enable row level security;
alter table skills            enable row level security;
alter table projects          enable row level security;
alter table certifications    enable row level security;
alter table achievements      enable row level security;

-- CVs: owner only
create policy "owner access" on cvs
  for all using (auth.uid() = user_id);

-- All child tables: access via cv ownership
create policy "owner access" on personal_info
  for all using (cv_id in (select id from cvs where user_id = auth.uid()));

create policy "owner access" on work_experience
  for all using (cv_id in (select id from cvs where user_id = auth.uid()));

create policy "owner access" on education
  for all using (cv_id in (select id from cvs where user_id = auth.uid()));

create policy "owner access" on skills
  for all using (cv_id in (select id from cvs where user_id = auth.uid()));

create policy "owner access" on projects
  for all using (cv_id in (select id from cvs where user_id = auth.uid()));

create policy "owner access" on certifications
  for all using (cv_id in (select id from cvs where user_id = auth.uid()));

create policy "owner access" on achievements
  for all using (cv_id in (select id from cvs where user_id = auth.uid()));
