CREATE TABLE "admins" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_len" CHECK (char_length("admins"."email") between 3 and 254)
);
