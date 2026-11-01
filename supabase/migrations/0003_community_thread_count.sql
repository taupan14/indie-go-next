-- Jumlah thread per komunitas, dijaga trigger yang sama dengan penghitung lain
alter table communities add column if not exists thread_count int not null default 0;
update communities c set thread_count = (select count(*) from threads t where t.community_id = c.id);
create trigger t_thread_cnt after insert or delete on threads for each row execute function bump('communities', 'community_id', 'thread_count');
