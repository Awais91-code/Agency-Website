insert into public.user_roles (user_id, role)
values ('1630508f-9a74-467a-a2e3-4c15bf56e7d8', 'super_admin')
on conflict (user_id)
do update set
  role = excluded.role,
  assigned_at = now();