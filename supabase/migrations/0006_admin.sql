-- Cari id pengguna dari email. Hanya service role (server) yang boleh memanggil.
create function user_id_by_email(e text) returns uuid language sql stable security definer set search_path = public, auth as
$$ select id from auth.users where lower(email) = lower(e) limit 1 $$;
revoke all on function user_id_by_email(text) from public, anon, authenticated;
grant execute on function user_id_by_email(text) to service_role;
