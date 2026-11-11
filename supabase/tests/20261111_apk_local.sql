-- Only synthetic local data. Never run this fixture on Supabase.
do $$begin if current_database()<>'aimade_apk_qa' then raise exception 'Local APK QA only';end if;end$$;
create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb,unique(bucket_id,name));
alter table storage.objects enable row level security;
grant usage on schema storage to anon,authenticated;
grant select,insert,update,delete on storage.objects to anon,authenticated;
create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
insert into auth.users values('00000000-0000-4000-8000-000000000001',now()),('00000000-0000-4000-8000-000000000002',now()),('00000000-0000-4000-8000-000000000003',null);
alter table works add constraint works_details_v2 check(jsonb_typeof(details)='object');
insert into works(id,owner,title,description,category) values('00000000-0000-4000-8000-000000000020','00000000-0000-4000-8000-000000000002','APK synthetic QA','This is a synthetic local fixture, not a real published application.','app');
