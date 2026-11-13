-- Supabase Auth inserts the auth user and then sets app_metadata in a separate
-- UPDATE, so the insert-only trigger saw no role and defaulted to 'student'.
-- Keep public.users in sync whenever app_metadata changes. Only the service
-- role can write app_metadata, so this does not let users pick their role.

create function public.sync_user_app_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.users
     set role = coalesce(new.raw_app_meta_data ->> 'role', role),
         username = coalesce(new.raw_app_meta_data ->> 'username', username),
         phone = coalesce(new.raw_app_meta_data ->> 'phone', phone)
   where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_metadata_updated
  after update of raw_app_meta_data on auth.users
  for each row
  when (old.raw_app_meta_data is distinct from new.raw_app_meta_data)
  execute function public.sync_user_app_metadata();

revoke execute on function public.sync_user_app_metadata() from public, anon, authenticated;

-- Repair any users created before this fix.
update public.users u
   set role = coalesce(a.raw_app_meta_data ->> 'role', u.role),
       username = coalesce(a.raw_app_meta_data ->> 'username', u.username),
       phone = coalesce(a.raw_app_meta_data ->> 'phone', u.phone)
  from auth.users a
 where a.id = u.id;
