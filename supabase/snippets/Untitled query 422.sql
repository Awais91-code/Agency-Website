insert into public.user_roles (user_id, role)
values ('b1a953ff-f597-40ba-b188-2c3dbe9aae13', 'super_admin')
on conflict (user_id)
do update set
  role = excluded.role,
  assigned_at = now();