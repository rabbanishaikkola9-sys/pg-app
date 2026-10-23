DO $$ BEGIN
  CREATE TYPE "public"."ticket_status" AS ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."ticket_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."notification_channel" AS ENUM('EMAIL', 'SMS', 'PUSH', 'IN_APP');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

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

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "channel" "notification_channel" NOT NULL DEFAULT 'IN_APP',
  "target_role" "user_role",
  "target_user_id" uuid,
  "is_global" boolean NOT NULL DEFAULT false,
  "sent_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" uuid
);

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

CREATE TABLE IF NOT EXISTS "system_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" text NOT NULL UNIQUE,
  "value" text NOT NULL,
  "description" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_by" uuid
);

DO $$ BEGIN
  ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_target_user_id_profiles_id_fk"
    FOREIGN KEY ("target_user_id") REFERENCES "public"."profiles"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_created_by_profiles_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "support_tickets"
    ADD CONSTRAINT "support_tickets_raised_by_profiles_id_fk"
    FOREIGN KEY ("raised_by") REFERENCES "public"."profiles"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "support_tickets"
    ADD CONSTRAINT "support_tickets_assigned_to_profiles_id_fk"
    FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "support_tickets"
    ADD CONSTRAINT "support_tickets_pg_id_pg_properties_id_fk"
    FOREIGN KEY ("pg_id") REFERENCES "public"."pg_properties"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "system_settings"
    ADD CONSTRAINT "system_settings_updated_by_profiles_id_fk"
    FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
