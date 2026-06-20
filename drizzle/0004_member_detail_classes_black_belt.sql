ALTER TABLE "member" ADD COLUMN IF NOT EXISTS "curp" text;
--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN IF NOT EXISTS "blood_type" text;
--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN IF NOT EXISTS "special_care_notes" text;
--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN IF NOT EXISTS "emergency_phone" text;
--> statement-breakpoint
DROP INDEX IF EXISTS "member_class_assignment_active_member_uq";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "member_class_assignment_active_member_class_uq" ON "member_class_assignment" USING btree ("member_id","class_id") WHERE "member_class_assignment"."ended_at" IS NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "black_belt_league_result" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "event_name" text NOT NULL,
  "event_date" date,
  "category" text,
  "result" text,
  "score" numeric(6, 2),
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "black_belt_league_result" ADD CONSTRAINT "black_belt_league_result_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "black_belt_league_result" ADD CONSTRAINT "black_belt_league_result_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "black_belt_league_result_org_idx" ON "black_belt_league_result" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "black_belt_league_result_member_idx" ON "black_belt_league_result" USING btree ("member_id");
