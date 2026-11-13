-- RLS and function tests. Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(34);

-- ---------------------------------------------------------------------------
-- Fixtures (as postgres, bypassing RLS)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_app_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 't-admin@tuition.local',   '{"role":"admin","username":"t-admin"}'),
  ('00000000-0000-0000-0000-00000000000c', 't-co@tuition.local',      '{"role":"co_teacher","username":"t-co"}'),
  ('00000000-0000-0000-0000-000000000001', 't9000000001@students.tuition.local', '{"role":"student","phone":"9000000001"}'),
  ('00000000-0000-0000-0000-000000000002', 't9000000002@students.tuition.local', '{"role":"student","phone":"9000000002"}'),
  ('00000000-0000-0000-0000-000000000003', 't9000000003@students.tuition.local', '{"role":"student","phone":"9000000003"}');

insert into public.batches (id, name, standard) values
  ('b0000000-0000-0000-0000-000000000006', 'Std 6', 6),
  ('b0000000-0000-0000-0000-000000000009', 'Std 9', 9);
insert into public.subjects (id, batch_id, name) values
  ('50000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', 'Maths'),
  ('50000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000009', 'Maths');

insert into public.students (id, user_id, full_name, batch_id, parent_phone, monthly_fee, is_active) values
  ('51000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Asha',  'b0000000-0000-0000-0000-000000000006', '9000000001', 1000, true),
  ('51000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Ravi',  'b0000000-0000-0000-0000-000000000009', '9000000002', 1500, true),
  ('51000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Old',   'b0000000-0000-0000-0000-000000000006', '9000000003', 1000, false);

insert into public.homework (batch_id, subject_id, title, due_date) values
  ('b0000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000006', 'HW6', current_date),
  ('b0000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000009', 'HW9', current_date);
insert into public.materials (batch_id, subject_id, title, type, url) values
  ('b0000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000006', 'M6', 'link', 'https://example.com/6'),
  ('b0000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000009', 'M9', 'link', 'https://example.com/9');
insert into public.announcements (title, body, target_batch_id) values
  ('All', 'x', null),
  ('A6',  'x', 'b0000000-0000-0000-0000-000000000006'),
  ('A9',  'x', 'b0000000-0000-0000-0000-000000000009');

insert into public.quizzes (id, batch_id, subject_id, title, opens_at, closes_at) values
  ('90000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000006', 'Q6', now() - interval '1 day', now() + interval '1 day'),
  ('90000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000009', 'Q9', now() - interval '1 day', now() + interval '1 day'),
  ('90000000-0000-0000-0000-000000000066', 'b0000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000006', 'Closed', now() - interval '2 day', now() - interval '1 day');
insert into public.quiz_questions (id, quiz_id, position, question_text, options, correct_option, marks) values
  ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000006', 1, '1+1', '["1","2","3","4"]', 1, 1),
  ('91000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000006', 2, '2+2', '["2","3","4","5"]', 2, 2),
  ('91000000-0000-0000-0000-000000000009', '90000000-0000-0000-0000-000000000009', 1, '3+3', '["6","7","8","9"]', 0, 1);

insert into public.fees (id, student_id, month, amount) values
  ('f0000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000001', '2026-11', 1000),
  ('f0000000-0000-0000-0000-000000000002', '51000000-0000-0000-0000-000000000002', '2026-11', 1500);

-- Auth sets app_metadata in an UPDATE after the INSERT; role must follow it.
insert into auth.users (id, email, raw_app_meta_data) values
  ('00000000-0000-0000-0000-0000000000ff', 't-late@tuition.local', '{}');
update auth.users set raw_app_meta_data = '{"role":"co_teacher","username":"t-late"}'
  where id = '00000000-0000-0000-0000-0000000000ff';
select is((select role from public.users where id = '00000000-0000-0000-0000-0000000000ff'), 'co_teacher', 'role syncs from app_metadata update');
select is((select username from public.users where id = '00000000-0000-0000-0000-0000000000ff'), 't-late', 'username syncs from app_metadata update');

-- ---------------------------------------------------------------------------
-- Student in std 6 (Asha)
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.homework), 1, 'student sees only own batch homework');
select is((select count(*)::int from public.materials), 1, 'student sees only own batch materials');
select is((select count(*)::int from public.announcements), 2, 'student sees own batch + all-batch announcements');
select is((select count(*)::int from public.quizzes), 2, 'student sees only own batch quizzes');
select is((select count(*)::int from public.quiz_questions), 0, 'student cannot read quiz_questions (answers) directly');
select is((select count(*)::int from public.quiz_questions_for_student('90000000-0000-0000-0000-000000000006')), 2, 'student gets own quiz questions via function');
select is((select count(*)::int from public.quiz_questions_for_student('90000000-0000-0000-0000-000000000009')), 0, 'student gets nothing for another batch quiz');
select is((select count(*)::int from public.fees), 1, 'student sees only own fees');
select is((select count(*)::int from public.students), 1, 'student sees only own student row');
select is((select count(*)::int from public.users), 1, 'student sees only own user row');
select throws_ok(
  $$ insert into public.homework (batch_id, subject_id, title, due_date) values ('b0000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000006', 'hack', current_date) $$,
  '42501', null, 'student cannot create homework');
select throws_ok(
  $$ update public.users set role = 'admin' where id = auth.uid() $$,
  '42501', null, 'student cannot change own role');
select lives_ok(
  $$ update public.users set language = 'hi' where id = auth.uid() $$,
  'student can change own language');
select is(
  public.submit_quiz('90000000-0000-0000-0000-000000000006', '{"91000000-0000-0000-0000-000000000001": 1, "91000000-0000-0000-0000-000000000002": 0}'),
  '{"score": 1, "total": 3}'::jsonb, 'submit_quiz grades by marks');
select throws_ok(
  $$ select public.submit_quiz('90000000-0000-0000-0000-000000000006', '{}') $$,
  '23505', 'already_attempted', 'second attempt rejected');
select throws_ok(
  $$ select public.submit_quiz('90000000-0000-0000-0000-000000000066', '{}') $$,
  '22023', 'quiz_closed', 'closed quiz rejected');
select throws_ok(
  $$ select public.submit_quiz('90000000-0000-0000-0000-000000000009', '{}') $$,
  'P0002', 'quiz_not_found', 'other batch quiz rejected');
select is(
  (select correct_option from public.quiz_review('90000000-0000-0000-0000-000000000006') where id = '91000000-0000-0000-0000-000000000002'),
  2, 'review shows correct answer after submit');
select throws_ok(
  $$ select public.mark_fee_paid('f0000000-0000-0000-0000-000000000001') $$,
  '42501', 'forbidden', 'student cannot mark fees paid');
select throws_ok(
  $$ insert into public.audit_log (actor_id, action, entity) values (auth.uid(), 'create', 'x') $$,
  '42501', null, 'student cannot write audit log');

-- ---------------------------------------------------------------------------
-- Inactive student
-- ---------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.homework), 0, 'inactive student sees no homework');

-- ---------------------------------------------------------------------------
-- Co-teacher
-- ---------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ insert into public.materials (batch_id, subject_id, title, type, url) values ('b0000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000009', 'New', 'pdf', 'https://example.com/new') $$,
  'co-teacher can create materials');
select throws_ok(
  $$ insert into public.homework (batch_id, subject_id, title, due_date) values ('b0000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000006', 'x', current_date) $$,
  '42501', null, 'co-teacher cannot create homework');
select is((select count(*)::int from public.homework), 2, 'co-teacher reads all homework');
update public.fees set amount = 1; -- RLS silently filters every row
reset role;
select is((select count(*)::int from public.fees where amount = 1), 0, 'co-teacher cannot update fees');

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
set local role authenticated;
select matches(
  (public.mark_fee_paid('f0000000-0000-0000-0000-000000000001')).receipt_no,
  '^RCPT-\d{4}-0001$', 'first receipt number');
select matches(
  (public.mark_fee_paid('f0000000-0000-0000-0000-000000000002')).receipt_no,
  '^RCPT-\d{4}-0002$', 'second receipt number increments');
select matches(
  (public.mark_fee_paid('f0000000-0000-0000-0000-000000000001')).receipt_no,
  '^RCPT-\d{4}-0001$', 're-marking keeps the receipt number');
select is(public.generate_fees('2026-12'), 2, 'generate_fees creates rows for active students only');
select is(public.generate_fees('2026-12'), 0, 'generate_fees is idempotent');

-- ---------------------------------------------------------------------------
-- Anonymous visitor
-- ---------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;
select lives_ok(
  $$ insert into public.enquiries (name, phone, standard, message) values ('Parent', '9876543210', 7, 'Hi') $$,
  'anon can submit an enquiry');
select is((select count(*)::int from public.enquiries), 0, 'anon cannot read enquiries');

select * from finish();
rollback;
