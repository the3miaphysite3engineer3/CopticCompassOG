drop policy if exists "Admins can delete content releases" on public.content_releases;

create policy "Admins can delete content releases"
on public.content_releases
for delete
to authenticated
using (public.is_admin());
