CREATE TYPE "public"."ad_tone" AS ENUM('moss', 'marigold', 'ink');--> statement-breakpoint
CREATE TYPE "public"."app_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."legal_slug" AS ENUM('terms', 'privacy', 'disclaimer');--> statement-breakpoint
CREATE TABLE "ad_banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"image_url" text,
	"image_public_id" text,
	"image_alt" text DEFAULT '' NOT NULL,
	"target_url" text NOT NULL,
	"tone" "ad_tone" DEFAULT 'moss' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ad_banners_title_len" CHECK (char_length("ad_banners"."title") between 1 and 80),
	CONSTRAINT "ad_banners_subtitle_len" CHECK ("ad_banners"."subtitle" is null or char_length("ad_banners"."subtitle") <= 160),
	CONSTRAINT "ad_banners_image_alt_len" CHECK (char_length("ad_banners"."image_alt") <= 160),
	CONSTRAINT "ad_banners_target_valid" CHECK (char_length("ad_banners"."target_url") <= 2048 and ("ad_banners"."target_url" ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$' or "ad_banners"."target_url" ~ '^/([^/[:space:]][^[:space:]]*)?$'))
);
--> statement-breakpoint
CREATE TABLE "app_download_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_download_links_app_position_key" UNIQUE("app_id","position"),
	CONSTRAINT "app_download_links_id_app_key" UNIQUE("id","app_id"),
	CONSTRAINT "app_download_links_position_range" CHECK ("app_download_links"."position" between 0 and 2),
	CONSTRAINT "app_download_links_label_len" CHECK (char_length("app_download_links"."label") between 1 and 40),
	CONSTRAINT "app_download_links_url_valid" CHECK (char_length("app_download_links"."url") <= 2048 and "app_download_links"."url" ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$')
);
--> statement-breakpoint
CREATE TABLE "app_recommendations" (
	"app_id" uuid NOT NULL,
	"recommended_app_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	CONSTRAINT "app_recommendations_pkey" PRIMARY KEY("app_id","position"),
	CONSTRAINT "app_recommendations_app_target_key" UNIQUE("app_id","recommended_app_id"),
	CONSTRAINT "app_recommendations_position_range" CHECK ("app_recommendations"."position" between 0 and 2),
	CONSTRAINT "app_recommendations_not_self" CHECK ("app_recommendations"."app_id" <> "app_recommendations"."recommended_app_id")
);
--> statement-breakpoint
CREATE TABLE "app_screenshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"url" text NOT NULL,
	"public_id" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_screenshots_app_position_key" UNIQUE("app_id","position"),
	CONSTRAINT "app_screenshots_position_range" CHECK ("app_screenshots"."position" between 0 and 7),
	CONSTRAINT "app_screenshots_size_positive" CHECK ("app_screenshots"."width" > 0 and "app_screenshots"."height" > 0)
);
--> statement-breakpoint
CREATE TABLE "apps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"summary" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"version" text NOT NULL,
	"size" text NOT NULL,
	"checksum_sha256" text,
	"icon_url" text,
	"icon_public_id" text,
	"status" "app_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "apps_slug_format" CHECK ("apps"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length("apps"."slug") <= 80),
	CONSTRAINT "apps_name_len" CHECK (char_length("apps"."name") between 1 and 60),
	CONSTRAINT "apps_summary_len" CHECK (char_length("apps"."summary") between 1 and 140),
	CONSTRAINT "apps_description_len" CHECK (char_length("apps"."description") <= 20000),
	CONSTRAINT "apps_version_len" CHECK (char_length("apps"."version") between 1 and 32),
	CONSTRAINT "apps_size_len" CHECK (char_length("apps"."size") between 1 and 32),
	CONSTRAINT "apps_checksum_format" CHECK ("apps"."checksum_sha256" is null or "apps"."checksum_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "apps_published_has_date" CHECK ("apps"."status" <> 'published' or "apps"."published_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "admin_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_audit_logs_action_len" CHECK (char_length("admin_audit_logs"."action") between 1 and 60),
	CONSTRAINT "admin_audit_logs_entity_type_len" CHECK (char_length("admin_audit_logs"."entity_type") between 1 and 40),
	CONSTRAINT "admin_audit_logs_meta_size" CHECK (pg_column_size("admin_audit_logs"."meta") <= 8192)
);
--> statement-breakpoint
CREATE TABLE "download_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"app_id" uuid NOT NULL,
	"link_id" uuid NOT NULL,
	"step" smallint DEFAULT 1 NOT NULL,
	"step_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "download_sessions_token_format" CHECK ("download_sessions"."token_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "download_sessions_step_range" CHECK ("download_sessions"."step" between 1 and 3),
	CONSTRAINT "download_sessions_completed_at_last_step" CHECK ("download_sessions"."completed_at" is null or "download_sessions"."step" = 3)
);
--> statement-breakpoint
CREATE TABLE "legal_pages" (
	"slug" "legal_slug" PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content_md" text DEFAULT '' NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legal_pages_title_len" CHECK (char_length("legal_pages"."title") between 1 and 120),
	CONSTRAINT "legal_pages_content_len" CHECK (char_length("legal_pages"."content_md") <= 100000)
);
--> statement-breakpoint
ALTER TABLE "app_download_links" ADD CONSTRAINT "app_download_links_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_recommendations" ADD CONSTRAINT "app_recommendations_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_recommendations" ADD CONSTRAINT "app_recommendations_recommended_app_id_apps_id_fk" FOREIGN KEY ("recommended_app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_screenshots" ADD CONSTRAINT "app_screenshots_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "download_sessions" ADD CONSTRAINT "download_sessions_link_app_fk" FOREIGN KEY ("link_id","app_id") REFERENCES "public"."app_download_links"("id","app_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ad_banners_active_order_idx" ON "ad_banners" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "apps_slug_key" ON "apps" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "apps_published_idx" ON "apps" USING btree ("published_at" DESC NULLS LAST) WHERE "apps"."status" = 'published' and "apps"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "admin_audit_logs_created_idx" ON "admin_audit_logs" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "download_sessions_token_hash_key" ON "download_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "download_sessions_expires_idx" ON "download_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "download_sessions_app_idx" ON "download_sessions" USING btree ("app_id","created_at");