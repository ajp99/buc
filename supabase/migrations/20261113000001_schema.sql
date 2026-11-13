-- Core schema for the tuition class app.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Users (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'student' check (role in ('admin', 'co_teacher', 'student')),
  phone text,
  username text unique,
  language text not null default 'en' check (language in ('en', 'hi')),
  created_at timestamptz not null default now()
);

-- Create a public.users row whenever an auth user is created. Role and
-- username come from app_metadata, which only the service role can set.
create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, role, phone, username)
  values (
    new.id,
    coalesce(new.raw_app_meta_data ->> 'role', 'student'),
    new.raw_app_meta_data ->> 'phone',
    new.raw_app_meta_data ->> 'username'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Batches, subjects, students
-- ---------------------------------------------------------------------------
create table public.batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  standard int not null unique check (standard between 5 and 10),
  created_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches (id) on delete cascade,
  name text not null,
  unique (batch_id, name)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  full_name text not null,
  batch_id uuid not null references public.batches (id),
  parent_phone text not null,
  monthly_fee numeric(10, 2) not null default 0 check (monthly_fee >= 0),
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index students_batch_idx on public.students (batch_id);

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  target_batch_id uuid references public.batches (id) on delete cascade,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index announcements_batch_idx on public.announcements (target_batch_id, created_at desc);

create table public.homework (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  title text not null,
  description text not null default '',
  due_date date not null,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index homework_batch_due_idx on public.homework (batch_id, due_date);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  title text not null,
  type text not null check (type in ('pdf', 'image', 'link')),
  url text not null check (url ~* '^https://'),
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index materials_batch_idx on public.materials (batch_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Quizzes
-- ---------------------------------------------------------------------------
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  title text not null,
  description text not null default '',
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  show_answers_after_submit boolean not null default true,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (closes_at > opens_at)
);
create index quizzes_batch_idx on public.quizzes (batch_id, opens_at desc);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  position int not null default 0,
  question_text text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  correct_option int not null check (correct_option between 0 and 3),
  marks int not null default 1 check (marks > 0)
);
create index quiz_questions_quiz_idx on public.quiz_questions (quiz_id, position);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  answers jsonb not null,
  score int not null,
  total int not null,
  submitted_at timestamptz not null default now(),
  unique (quiz_id, student_id)
);

-- ---------------------------------------------------------------------------
-- Fees
-- ---------------------------------------------------------------------------
create table public.fees (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  month text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  amount numeric(10, 2) not null check (amount >= 0),
  status text not null default 'unpaid' check (status in ('paid', 'unpaid')),
  paid_at timestamptz,
  receipt_no text unique,
  marked_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, month)
);

create table public.receipt_counters (
  year int primary key,
  last_no int not null
);

-- ---------------------------------------------------------------------------
-- Enquiries and audit log
-- ---------------------------------------------------------------------------
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  phone text not null check (phone ~ '^\+?\d{10,13}$'),
  standard int not null check (standard between 5 and 10),
  message text not null default '' check (char_length(message) <= 1000),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.users (id) on delete set null,
  action text not null check (action in ('create', 'update', 'delete')),
  entity text not null,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);
