-- Row-level security policies and server-side functions.

-- ---------------------------------------------------------------------------
-- Helpers. security definer so they can read users/students without
-- recursing into those tables' own policies.
-- ---------------------------------------------------------------------------
create function public.current_role_name()
returns text
language sql stable security definer set search_path = ''
as $$ select role from public.users where id = auth.uid() $$;

create function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce((select role = 'admin' from public.users where id = auth.uid()), false) $$;

create function public.is_staff()
returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce((select role in ('admin', 'co_teacher') from public.users where id = auth.uid()), false) $$;

-- The calling student's id, or null if not an active student.
create function public.my_student_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select id from public.students
  where user_id = auth.uid() and is_active and deleted_at is null
$$;

create function public.my_batch_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select batch_id from public.students
  where user_id = auth.uid() and is_active and deleted_at is null
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.batches enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.announcements enable row level security;
alter table public.homework enable row level security;
alter table public.materials enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.fees enable row level security;
alter table public.receipt_counters enable row level security;
alter table public.enquiries enable row level security;
alter table public.audit_log enable row level security;

-- users: read own row (staff read all); only `language` is user-writable.
create policy users_select on public.users for select to authenticated
  using (id = auth.uid() or public.is_staff());
create policy users_update_self on public.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.users from authenticated, anon;
grant update (language) on public.users to authenticated;

-- batches / subjects: any signed-in user can read; admin writes.
create policy batches_select on public.batches for select to authenticated using (true);
create policy batches_admin on public.batches for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy subjects_select on public.subjects for select to authenticated using (true);
create policy subjects_admin on public.subjects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- students: own row, or staff; admin writes.
create policy students_select on public.students for select to authenticated
  using (user_id = auth.uid() or public.is_staff());
create policy students_admin on public.students for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- announcements: own batch or all-batches; staff read all; admin writes.
create policy announcements_select on public.announcements for select to authenticated
  using (
    public.is_staff()
    or (public.my_batch_id() is not null
        and (target_batch_id is null or target_batch_id = public.my_batch_id()))
  );
create policy announcements_admin on public.announcements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- homework: own batch; staff read; admin writes.
create policy homework_select on public.homework for select to authenticated
  using (public.is_staff() or batch_id = public.my_batch_id());
create policy homework_admin on public.homework for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- materials: own batch; staff (admin + co-teacher) write.
create policy materials_select on public.materials for select to authenticated
  using (public.is_staff() or batch_id = public.my_batch_id());
create policy materials_staff on public.materials for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- quizzes: own batch; staff read; admin writes.
create policy quizzes_select on public.quizzes for select to authenticated
  using (public.is_staff() or batch_id = public.my_batch_id());
create policy quizzes_admin on public.quizzes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- quiz_questions: staff only. Students go through quiz_questions_for_student().
create policy quiz_questions_staff_select on public.quiz_questions for select to authenticated
  using (public.is_staff());
create policy quiz_questions_admin on public.quiz_questions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- quiz_attempts: own rows; staff read. Inserts only via submit_quiz().
create policy quiz_attempts_select on public.quiz_attempts for select to authenticated
  using (public.is_staff() or student_id = public.my_student_id());
create policy quiz_attempts_admin_delete on public.quiz_attempts for delete to authenticated
  using (public.is_admin());

-- fees: own rows; staff read; admin writes (paid/unpaid via functions).
create policy fees_select on public.fees for select to authenticated
  using (public.is_staff() or student_id = public.my_student_id());
create policy fees_admin on public.fees for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- receipt_counters: no direct access (functions only).

-- enquiries: anyone may submit a new one; admin manages.
create policy enquiries_insert on public.enquiries for insert to anon, authenticated
  with check (status = 'new');
create policy enquiries_admin on public.enquiries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- audit_log: staff append their own entries; admin reads.
create policy audit_insert on public.audit_log for insert to authenticated
  with check (public.is_staff() and actor_id = auth.uid());
create policy audit_select on public.audit_log for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Quiz functions
-- ---------------------------------------------------------------------------

-- Questions for a student, without correct answers. Only for the student's
-- own batch and only once the quiz has opened.
create function public.quiz_questions_for_student(p_quiz_id uuid)
returns table (id uuid, "position" int, question_text text, options jsonb, marks int)
language sql stable security definer set search_path = ''
as $$
  select qq.id, qq.position, qq.question_text, qq.options, qq.marks
  from public.quiz_questions qq
  join public.quizzes q on q.id = qq.quiz_id
  where qq.quiz_id = p_quiz_id
    and q.batch_id = public.my_batch_id()
    and q.opens_at <= now()
  order by qq.position, qq.id
$$;

-- Grade and record a student's single attempt.
-- p_answers: {"<question_id>": <option index 0-3>, ...}
create function public.submit_quiz(p_quiz_id uuid, p_answers jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_student uuid := public.my_student_id();
  v_quiz public.quizzes;
  v_score int;
  v_total int;
begin
  if v_student is null then
    raise exception 'not_a_student' using errcode = '42501';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'invalid_answers' using errcode = '22023';
  end if;

  select * into v_quiz from public.quizzes where id = p_quiz_id;
  if not found or v_quiz.batch_id <> public.my_batch_id() then
    raise exception 'quiz_not_found' using errcode = 'P0002';
  end if;
  if now() < v_quiz.opens_at or now() > v_quiz.closes_at then
    raise exception 'quiz_closed' using errcode = '22023';
  end if;
  if exists (select 1 from public.quiz_attempts where quiz_id = p_quiz_id and student_id = v_student) then
    raise exception 'already_attempted' using errcode = '23505';
  end if;

  select
    coalesce(sum(qq.marks) filter (
      where (p_answers ->> qq.id::text) ~ '^[0-3]$'
        and (p_answers ->> qq.id::text)::int = qq.correct_option), 0),
    coalesce(sum(qq.marks), 0)
  into v_score, v_total
  from public.quiz_questions qq
  where qq.quiz_id = p_quiz_id;

  insert into public.quiz_attempts (quiz_id, student_id, answers, score, total)
  values (p_quiz_id, v_student, p_answers, v_score, v_total);

  return jsonb_build_object('score', v_score, 'total', v_total);
end;
$$;

-- Review of a submitted attempt. Correct answers only when the quiz allows it.
create function public.quiz_review(p_quiz_id uuid)
returns table (
  id uuid, "position" int, question_text text, options jsonb, marks int,
  chosen_option int, correct_option int
)
language sql stable security definer set search_path = ''
as $$
  select
    qq.id, qq.position, qq.question_text, qq.options, qq.marks,
    case when (a.answers ->> qq.id::text) ~ '^[0-3]$' then (a.answers ->> qq.id::text)::int end,
    case when q.show_answers_after_submit then qq.correct_option end
  from public.quiz_attempts a
  join public.quizzes q on q.id = a.quiz_id
  join public.quiz_questions qq on qq.quiz_id = a.quiz_id
  where a.quiz_id = p_quiz_id
    and a.student_id = public.my_student_id()
  order by qq.position, qq.id
$$;

-- ---------------------------------------------------------------------------
-- Fee functions (admin only)
-- ---------------------------------------------------------------------------

-- Mark a fee paid, assigning RCPT-<year>-<nnnn> atomically. Re-marking a fee
-- that already has a receipt number keeps that number.
create function public.mark_fee_paid(p_fee_id uuid)
returns public.fees
language plpgsql security definer set search_path = ''
as $$
declare
  v_fee public.fees;
  v_year int := extract(year from now() at time zone 'Asia/Kolkata')::int;
  v_no int;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_fee from public.fees where id = p_fee_id for update;
  if not found then
    raise exception 'fee_not_found' using errcode = 'P0002';
  end if;

  if v_fee.receipt_no is null then
    insert into public.receipt_counters (year, last_no) values (v_year, 1)
    on conflict (year) do update set last_no = public.receipt_counters.last_no + 1
    returning last_no into v_no;
    v_fee.receipt_no := format('RCPT-%s-%s', v_year, lpad(v_no::text, 4, '0'));
  end if;

  update public.fees
     set status = 'paid',
         paid_at = coalesce(paid_at, now()),
         receipt_no = v_fee.receipt_no,
         marked_by = auth.uid()
   where id = p_fee_id
  returning * into v_fee;
  return v_fee;
end;
$$;

create function public.mark_fee_unpaid(p_fee_id uuid)
returns public.fees
language plpgsql security definer set search_path = ''
as $$
declare
  v_fee public.fees;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.fees
     set status = 'unpaid', paid_at = null, marked_by = auth.uid()
   where id = p_fee_id
  returning * into v_fee;
  if not found then
    raise exception 'fee_not_found' using errcode = 'P0002';
  end if;
  return v_fee;
end;
$$;

-- Create unpaid fee rows for every active student for a month. Returns the
-- number of rows created; existing rows are left alone.
create function public.generate_fees(p_month text)
returns int
language plpgsql security definer set search_path = ''
as $$
declare
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_month !~ '^\d{4}-(0[1-9]|1[0-2])$' then
    raise exception 'invalid_month' using errcode = '22023';
  end if;
  insert into public.fees (student_id, month, amount)
  select s.id, p_month, s.monthly_fee
  from public.students s
  where s.is_active and s.deleted_at is null
  on conflict (student_id, month) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Function privileges: nothing callable by anon except what is listed.
-- ---------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
revoke execute on function public.handle_new_auth_user() from authenticated;
