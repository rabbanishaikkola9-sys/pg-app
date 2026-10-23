-- ─── Extensions ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- postgis is optional — only enable if the binary is installed.
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS "postgis";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'postgis extension not available — skipping (distance features will fall back to non-geo).';
END $$;

-- ─── Enums ─────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'MANAGER', 'TENANT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."billing_status" AS ENUM('PAID', 'PENDING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."ticket_status" AS ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."ticket_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."notification_channel" AS ENUM('EMAIL', 'SMS', 'PUSH', 'IN_APP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Drop obsolete users table from 0000 (if present and empty) ───
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    DROP TABLE IF EXISTS "users" CASCADE;
  END IF;
END $$;

-- ─── Profiles ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "full_name" text NOT NULL,
  "email" text NOT NULL,
  "password_hash" text,
  "role" "user_role" NOT NULL,
  "phone" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "password_hash" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;

UPDATE "profiles" SET "email" = id::text || '@pgapp.local' WHERE "email" IS NULL;
ALTER TABLE "profiles" ALTER COLUMN "email" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "profiles" ADD CONSTRAINT "profiles_email_unique" UNIQUE ("email");
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;

-- ─── PG Properties ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "pg_properties" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "address" text NOT NULL,
  "city" text NOT NULL DEFAULT '',
  "state" text NOT NULL DEFAULT '',
  "pincode" text NOT NULL DEFAULT '',
  "amenities" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "images" text[] NOT NULL DEFAULT '{}'::text[],
  "total_rooms" integer NOT NULL DEFAULT 0,
  "occupied_rooms" integer NOT NULL DEFAULT 0,
  "rent_range_min" numeric(10, 2),
  "rent_range_max" numeric(10, 2),
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "pg_properties" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "pg_properties" ADD COLUMN IF NOT EXISTS "city" text NOT NULL DEFAULT '';
ALTER TABLE "pg_properties" ADD COLUMN IF NOT EXISTS "state" text NOT NULL DEFAULT '';
ALTER TABLE "pg_properties" ADD COLUMN IF NOT EXISTS "pincode" text NOT NULL DEFAULT '';
ALTER TABLE "pg_properties" ADD COLUMN IF NOT EXISTS "total_rooms" integer NOT NULL DEFAULT 0;
ALTER TABLE "pg_properties" ADD COLUMN IF NOT EXISTS "occupied_rooms" integer NOT NULL DEFAULT 0;
ALTER TABLE "pg_properties" ADD COLUMN IF NOT EXISTS "rent_range_min" numeric(10, 2);
ALTER TABLE "pg_properties" ADD COLUMN IF NOT EXISTS "rent_range_max" numeric(10, 2);
ALTER TABLE "pg_properties" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;
ALTER TABLE "pg_properties" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "pg_properties" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;

-- ─── Rooms ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "rooms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pg_id" uuid NOT NULL,
  "room_number" text NOT NULL,
  "price" numeric(10, 2) NOT NULL,
  "capacity" integer NOT NULL,
  "current_occupancy" integer NOT NULL DEFAULT 0
);

-- ─── Tenants ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "tenants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "pg_id" uuid NOT NULL,
  "room_id" uuid NOT NULL,
  "rent_status" text NOT NULL,
  "last_payment_date" date,
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "joined_at" timestamp with time zone DEFAULT now() NOT NULL;

-- ─── Bookings ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "bookings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "renter_id" uuid NOT NULL,
  "pg_id" uuid NOT NULL,
  "room_id" uuid NOT NULL,
  "status" "booking_status" NOT NULL DEFAULT 'PENDING',
  "move_in_date" date NOT NULL,
  "message" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── Reviews ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pg_id" uuid NOT NULL,
  "renter_id" uuid NOT NULL,
  "rating" integer NOT NULL,
  "comment" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── Billing ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "billing" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "amount" numeric(10, 2) NOT NULL,
  "due_date" date NOT NULL,
  "status" "billing_status" NOT NULL DEFAULT 'PENDING',
  "paid_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "billing" ADD COLUMN IF NOT EXISTS "paid_at" timestamp with time zone;

-- ─── Notifications ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "channel" "notification_channel" NOT NULL DEFAULT 'IN_APP',
  "target_role" "user_role",
  "target_user_id" uuid,
  "is_global" boolean NOT NULL DEFAULT false,
  "read_at" timestamp with time zone,
  "sent_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" uuid
);
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "read_at" timestamp with time zone;

-- ─── Support Tickets ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "subject" text NOT NULL,
  "description" text NOT NULL,
  "status" "ticket_status" NOT NULL DEFAULT 'OPEN',
  "priority" "ticket_priority" NOT NULL DEFAULT 'MEDIUM',
  "raised_by" uuid NOT NULL,
  "assigned_to" uuid,
  "pg_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "resolved_at" timestamp with time zone
);

-- ─── System Settings ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "system_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" text NOT NULL UNIQUE,
  "value" text NOT NULL,
  "description" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_by" uuid
);

-- ─── Foreign Keys ──────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE "pg_properties" ADD CONSTRAINT "pg_properties_owner_id_profiles_id_fk"
    FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "rooms" ADD CONSTRAINT "rooms_pg_id_pg_properties_id_fk"
    FOREIGN KEY ("pg_id") REFERENCES "public"."pg_properties"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "tenants" ADD CONSTRAINT "tenants_user_id_profiles_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "tenants" ADD CONSTRAINT "tenants_pg_id_pg_properties_id_fk"
    FOREIGN KEY ("pg_id") REFERENCES "public"."pg_properties"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "tenants" ADD CONSTRAINT "tenants_room_id_rooms_id_fk"
    FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_renter_id_profiles_id_fk"
    FOREIGN KEY ("renter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_pg_id_pg_properties_id_fk"
    FOREIGN KEY ("pg_id") REFERENCES "public"."pg_properties"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_rooms_id_fk"
    FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_pg_id_pg_properties_id_fk"
    FOREIGN KEY ("pg_id") REFERENCES "public"."pg_properties"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_renter_id_profiles_id_fk"
    FOREIGN KEY ("renter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "billing" ADD CONSTRAINT "billing_tenant_id_tenants_id_fk"
    FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_target_user_id_profiles_id_fk"
    FOREIGN KEY ("target_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_by_profiles_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_raised_by_profiles_id_fk"
    FOREIGN KEY ("raised_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_profiles_id_fk"
    FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_pg_id_pg_properties_id_fk"
    FOREIGN KEY ("pg_id") REFERENCES "public"."pg_properties"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_profiles_id_fk"
    FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Indexes ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "idx_pg_properties_owner" ON "pg_properties" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_rooms_pg" ON "rooms" ("pg_id");
CREATE INDEX IF NOT EXISTS "idx_bookings_renter" ON "bookings" ("renter_id");
CREATE INDEX IF NOT EXISTS "idx_bookings_pg" ON "bookings" ("pg_id");
CREATE INDEX IF NOT EXISTS "idx_tenants_user" ON "tenants" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_billing_tenant" ON "billing" ("tenant_id");
