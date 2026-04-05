-- =========================================================
-- Supabase Setup: Fix student_groups + Live Assessment Feature
-- =========================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- 1) Hotfix for existing error:
-- Could not find the 'description' column of 'student_groups'
-- ---------------------------------------------------------
alter table if exists public.student_groups
add column if not exists description text;

-- ---------------------------------------------------------
-- 2) Main table: live_assessments
-- ---------------------------------------------------------
create table if not exists public.live_assessments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  grade text not null,
  duration_minutes integer not null default 20 check (duration_minutes between 5 and 180),
  scheduled_start timestamptz null,
  started_at timestamptz null,
  ended_at timestamptz null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'live', 'completed')),
  total_questions integer not null default 0,
  created_date timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_live_assessments_status on public.live_assessments(status);
create index if not exists idx_live_assessments_grade on public.live_assessments(grade);
create index if not exists idx_live_assessments_schedule on public.live_assessments(scheduled_start);

-- ---------------------------------------------------------
-- 3) Questions table
-- ---------------------------------------------------------
create table if not exists public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.live_assessments(id) on delete cascade,
  question_order integer not null check (question_order > 0),
  phrase_text text not null,
  points integer not null default 100 check (points between 1 and 100),
  created_date timestamptz not null default now()
);

create unique index if not exists uq_assessment_question_order
on public.assessment_questions(assessment_id, question_order);

create index if not exists idx_assessment_questions_assessment
on public.assessment_questions(assessment_id);

-- ---------------------------------------------------------
-- 4) Attempts table
-- ---------------------------------------------------------
create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.live_assessments(id) on delete cascade,
  student_id text not null,
  student_name text null,
  joined_at timestamptz not null default now(),
  started_at timestamptz null,
  completed_at timestamptz null,
  status text not null default 'joined' check (status in ('joined', 'in_progress', 'completed', 'abandoned')),
  total_score numeric(10,2) not null default 0,
  answered_count integer not null default 0,
  total_questions integer not null default 0,
  created_date timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, student_id)
);

create index if not exists idx_assessment_attempts_assessment
on public.assessment_attempts(assessment_id);

create index if not exists idx_assessment_attempts_student
on public.assessment_attempts(student_id);

-- ---------------------------------------------------------
-- 5) Submissions table
-- ---------------------------------------------------------
create table if not exists public.assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.live_assessments(id) on delete cascade,
  question_id uuid not null references public.assessment_questions(id) on delete cascade,
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  student_id text not null,
  student_name text null,
  question_order integer null,
  phrase_text text null,
  audio_url text null,
  transcribed_text text null,
  ai_feedback text null,
  score numeric(5,2) not null default 0,
  analysis_details jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  created_date timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index if not exists idx_assessment_submissions_assessment
on public.assessment_submissions(assessment_id);

create index if not exists idx_assessment_submissions_attempt
on public.assessment_submissions(attempt_id);

create index if not exists idx_assessment_submissions_student
on public.assessment_submissions(student_id);

-- ---------------------------------------------------------
-- 6) updated_at trigger helper
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_live_assessments_updated_at on public.live_assessments;
create trigger trg_live_assessments_updated_at
before update on public.live_assessments
for each row execute function public.set_updated_at();

drop trigger if exists trg_assessment_attempts_updated_at on public.assessment_attempts;
create trigger trg_assessment_attempts_updated_at
before update on public.assessment_attempts
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- 7) RLS (simple permissive mode like current app style)
-- ---------------------------------------------------------
alter table public.live_assessments enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.assessment_submissions enable row level security;

-- Drop old policies (if any)
drop policy if exists p_live_assessments_all on public.live_assessments;
drop policy if exists p_assessment_questions_all on public.assessment_questions;
drop policy if exists p_assessment_attempts_all on public.assessment_attempts;
drop policy if exists p_assessment_submissions_all on public.assessment_submissions;

-- Allow full access for app anon/authenticated (matches current app usage)
create policy p_live_assessments_all on public.live_assessments
for all to anon, authenticated
using (true)
with check (true);

create policy p_assessment_questions_all on public.assessment_questions
for all to anon, authenticated
using (true)
with check (true);

create policy p_assessment_attempts_all on public.assessment_attempts
for all to anon, authenticated
using (true)
with check (true);

create policy p_assessment_submissions_all on public.assessment_submissions
for all to anon, authenticated
using (true)
with check (true);
