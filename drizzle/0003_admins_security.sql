-- Keamanan tabel admins: RLS aktif, aplikasi hanya boleh membaca,
-- tidak ada akses dari Supabase Data API. Baris ditambah pemilik lewat `pnpm admin:add`.
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY devnest_app_select ON public.admins AS PERMISSIVE FOR SELECT TO devnest_app USING (true);
--> statement-breakpoint
GRANT SELECT ON public.admins TO devnest_app;
--> statement-breakpoint
DO $$
DECLARE
  r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON TABLE public.admins FROM %I', r);
    END IF;
  END LOOP;
END
$$;