begin;
do $$ begin
 if has_table_privilege('anon','public.sparky_appearance_preferences','SELECT') or has_table_privilege('authenticated','public.sparky_appearance_preferences','UPDATE') then raise exception 'appearance exposed'; end if;
 if not (select rowsecurity from pg_tables where schemaname='public' and tablename='sparky_appearance_preferences') then raise exception 'RLS missing'; end if;
end $$;
insert into public.sparky_appearance_preferences(account_key,palette,mode) values(repeat('e',64),'beatrice','dark');
update public.sparky_appearance_preferences set palette='ocean',mode='light' where account_key=repeat('e',64);
do $$ begin
 if (select palette from public.sparky_appearance_preferences where account_key=repeat('e',64))<>'ocean' then raise exception 'persistence failed'; end if;
end $$;
rollback;
