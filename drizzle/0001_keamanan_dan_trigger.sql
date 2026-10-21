-- =============================================================================
-- Migrasi kustom: trigger, role aplikasi, Row Level Security, dan hak akses.
-- Aturan untuk setiap tabel baru di masa depan:
--   1) ENABLE ROW LEVEL SECURITY
--   2) policy untuk devnest_app
--   3) GRANT eksplisit hanya yang dibutuhkan
--   4) REVOKE dari anon dan authenticated
-- `pnpm db:check` memeriksa keempatnya.
-- =============================================================================

-- ---- Fungsi trigger (search_path dikosongkan agar tidak bisa dibelokkan) ----
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.apps_guard() RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Slug permanen: tidak boleh berubah setelah dibuat.
  IF TG_OP = 'UPDATE' AND NEW.slug IS DISTINCT FROM OLD.slug THEN
    RAISE EXCEPTION 'apps.slug tidak boleh diubah' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  -- Tanggal terbit diisi otomatis saat pertama kali dipublikasikan.
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER apps_guard BEFORE INSERT OR UPDATE ON public.apps
  FOR EACH ROW EXECUTE FUNCTION public.apps_guard();
--> statement-breakpoint
CREATE TRIGGER apps_set_updated_at BEFORE UPDATE ON public.apps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER app_download_links_set_updated_at BEFORE UPDATE ON public.app_download_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER ad_banners_set_updated_at BEFORE UPDATE ON public.ad_banners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER legal_pages_set_updated_at BEFORE UPDATE ON public.legal_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint

-- ---- Role aplikasi: hanya untuk dipakai server Next.js saat berjalan ----
-- Dibuat tanpa kemampuan login. Password diatur manual di SQL Editor (lihat panduan).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'devnest_app') THEN
    CREATE ROLE devnest_app NOLOGIN;
  END IF;
END
$$;
--> statement-breakpoint
ALTER ROLE devnest_app SET statement_timeout = '15s';
--> statement-breakpoint
ALTER ROLE devnest_app SET idle_in_transaction_session_timeout = '15s';
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO devnest_app;
--> statement-breakpoint

-- ---- Row Level Security: aktif di semua tabel, hanya devnest_app yang punya policy ----
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'apps', 'app_download_links', 'app_screenshots', 'app_recommendations',
    'ad_banners', 'legal_pages', 'download_sessions', 'admin_audit_logs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY devnest_app_all ON public.%I AS PERMISSIVE FOR ALL TO devnest_app USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END
$$;
--> statement-breakpoint

-- ---- Hak akses devnest_app: seminimal mungkin ----
-- apps: tidak ada DELETE, hanya hapus lunak lewat kolom deleted_at.
GRANT SELECT, INSERT, UPDATE ON public.apps TO devnest_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.app_download_links, public.app_screenshots, public.app_recommendations,
  public.ad_banners, public.download_sessions
TO devnest_app;
--> statement-breakpoint
-- legal_pages: baris dibuat migrasi, aplikasi hanya membaca dan mengubah isinya.
GRANT SELECT, UPDATE ON public.legal_pages TO devnest_app;
--> statement-breakpoint
-- admin_audit_logs: hanya bisa ditambah dan dibaca (tidak bisa diubah atau dihapus).
GRANT SELECT, INSERT ON public.admin_audit_logs TO devnest_app;
--> statement-breakpoint

-- ---- Tutup akses lewat Supabase Data API (anon dan authenticated) ----
DO $$
DECLARE
  r text;
  t text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      FOREACH t IN ARRAY ARRAY[
        'apps', 'app_download_links', 'app_screenshots', 'app_recommendations',
        'ad_banners', 'legal_pages', 'download_sessions', 'admin_audit_logs'
      ]
      LOOP
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', t, r);
      END LOOP;
      EXECUTE format('REVOKE ALL ON FUNCTION public.set_updated_at() FROM %I', r);
      EXECUTE format('REVOKE ALL ON FUNCTION public.apps_guard() FROM %I', r);
      -- Tabel baru di masa depan tidak otomatis terbuka ke API.
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', r);
    END IF;
  END LOOP;
END
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.apps_guard() FROM PUBLIC;
--> statement-breakpoint

-- ---- Data referensi: tiga halaman legal (isi diedit dari halaman admin) ----
INSERT INTO public.legal_pages (slug, title, content_md) VALUES
  ('terms', 'Syarat Layanan', ''),
  ('privacy', 'Kebijakan Privasi', ''),
  ('disclaimer', 'Disclaimer', '')
ON CONFLICT (slug) DO NOTHING;