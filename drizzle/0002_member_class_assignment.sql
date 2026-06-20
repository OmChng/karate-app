CREATE TABLE "member_class_assignment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "class_id" uuid NOT NULL,
  "assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
  "ended_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "member_class_assignment" ADD CONSTRAINT "member_class_assignment_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_class_assignment" ADD CONSTRAINT "member_class_assignment_class_id_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."class"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "member_class_assignment_member_idx" ON "member_class_assignment" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "member_class_assignment_class_idx" ON "member_class_assignment" USING btree ("class_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_class_assignment_active_member_uq" ON "member_class_assignment" USING btree ("member_id") WHERE "member_class_assignment"."ended_at" IS NULL;--> statement-breakpoint
INSERT INTO "member_class_assignment" ("member_id", "class_id", "assigned_at")
SELECT DISTINCT ON ("attendance"."member_id") "attendance"."member_id", "attendance"."class_id", now()
FROM "attendance"
ORDER BY "attendance"."member_id", "attendance"."marked_at" DESC
ON CONFLICT DO NOTHING;
