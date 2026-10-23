CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'MANAGER', 'TENANT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."billing_status" AS ENUM('PAID', 'PENDING');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "full_name" text NOT NULL,
  "role" "user_role" NOT NULL,
  "phone" text
);

CREATE TABLE IF NOT EXISTS "pg_properties" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" uuid NOT NULL,
  "name" text NOT NULL,
  "address" text NOT NULL,
  "coordinates" geometry(Point, 4326) NOT NULL DEFAULT ST_GeomFromText('POINT(0 0)', 4326),
  "amenities" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "images" text[] NOT NULL DEFAULT '{}'::text[]
);

CREATE TABLE IF NOT EXISTS "rooms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pg_id" uuid NOT NULL,
  "room_number" text NOT NULL,
  "price" numeric(10, 2) NOT NULL,
  "capacity" integer NOT NULL,
  "current_occupancy" integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "tenants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "pg_id" uuid NOT NULL,
  "room_id" uuid NOT NULL,
  "rent_status" text NOT NULL,
  "last_payment_date" date
);

CREATE TABLE IF NOT EXISTS "billing" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "amount" numeric(10, 2) NOT NULL,
  "due_date" date NOT NULL,
  "status" "billing_status" NOT NULL DEFAULT 'PENDING',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "pg_properties"
    ADD CONSTRAINT "pg_properties_owner_id_profiles_id_fk"
    FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "rooms"
    ADD CONSTRAINT "rooms_pg_id_pg_properties_id_fk"
    FOREIGN KEY ("pg_id") REFERENCES "public"."pg_properties"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tenants"
    ADD CONSTRAINT "tenants_user_id_profiles_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tenants"
    ADD CONSTRAINT "tenants_pg_id_pg_properties_id_fk"
    FOREIGN KEY ("pg_id") REFERENCES "public"."pg_properties"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tenants"
    ADD CONSTRAINT "tenants_room_id_rooms_id_fk"
    FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "billing"
    ADD CONSTRAINT "billing_tenant_id_tenants_id_fk"
    FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
