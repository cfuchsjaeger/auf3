-- Auf 3: Gruppen verlassen und Einladungen vorab ansehen.
-- Supabase vergibt für neue Funktionen per Default-Privileges Ausführungsrechte an anon.
-- Deshalb wird hier ausdrücklich entzogen und nur authenticated freigegeben.

-- Vorschau einer Einladung: Name und Größe der Gruppe, ohne beizutreten.
-- Gibt keine Zeile zurück, wenn der Code nicht existiert.
create or replace function public.crew_preview(p_invite_code text)
returns table (crew_id uuid, name text, member_count int, already_member boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then perform fail('not_authenticated'); end if;
  return query
    select c.id, c.name,
           (select count(*)::int from crew_members m where m.crew_id = c.id),
           exists (select 1 from crew_members m where m.crew_id = c.id and m.user_id = auth.uid())
    from crews c
    where c.invite_code = upper(btrim(coalesce(p_invite_code, '')));
end $$;

-- Gruppe verlassen. Die letzte Person löscht die Gruppe samt Verlauf.
-- Verlässt der Gründer eine Gruppe mit weiteren Mitgliedern, übernimmt das am längsten dabei.
create or replace function public.leave_crew(p_crew uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := require_user();
  my_role crew_role;
  successor uuid;
begin
  select role into my_role from crew_members where crew_id = p_crew and user_id = uid for update;
  if not found then perform fail('not_member'); end if;

  delete from crew_members where crew_id = p_crew and user_id = uid;

  if not exists (select 1 from crew_members where crew_id = p_crew) then
    delete from crews where id = p_crew;
    return;
  end if;

  if my_role = 'owner' and not exists (select 1 from crew_members where crew_id = p_crew and role = 'owner') then
    select user_id into successor from crew_members where crew_id = p_crew order by joined_at, user_id limit 1;
    update crew_members set role = 'owner' where crew_id = p_crew and user_id = successor;
  end if;
end $$;

-- created_by verweist auf den Gründer. Damit er die App verlassen kann, ohne die Gruppe zu blockieren,
-- darf die Referenz beim Löschen des Profils leer werden.
alter table public.crews alter column created_by drop not null;
alter table public.crews drop constraint if exists crews_created_by_fkey;
alter table public.crews add constraint crews_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

revoke execute on function public.crew_preview(text), public.leave_crew(uuid) from public, anon;
grant execute on function public.crew_preview(text), public.leave_crew(uuid) to authenticated;
