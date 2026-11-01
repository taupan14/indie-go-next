-- Privasi profil
alter table profiles add column if not exists hide_communities boolean not null default false;
grant update (hide_communities) on profiles to authenticated;

-- Kebijakan hapus akun: thread dan komentar tetap ada, penulis menjadi null ("Akun dihapus")
alter table threads alter column author_id drop not null;
alter table comments alter column author_id drop not null;
alter table threads  drop constraint threads_author_id_fkey,  add constraint threads_author_id_fkey  foreign key (author_id) references profiles(id) on delete set null;
alter table comments drop constraint comments_author_id_fkey, add constraint comments_author_id_fkey foreign key (author_id) references profiles(id) on delete set null;
alter table audit_logs drop constraint audit_logs_actor_id_fkey, add constraint audit_logs_actor_id_fkey foreign key (actor_id) references profiles(id) on delete set null;
-- Admin komunitas tidak bisa dihapus selama masih menjadi admin (FK communities.admin_id tetap membatasi)
