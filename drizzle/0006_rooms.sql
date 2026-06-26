CREATE TABLE "room" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"dojo_id" uuid NOT NULL,
	"name" text NOT NULL,
	"capacity" integer,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "class" ADD COLUMN "room_id" uuid;
--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_dojo_id_dojo_id_fk" FOREIGN KEY ("dojo_id") REFERENCES "public"."dojo"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "class" ADD CONSTRAINT "class_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "room_org_dojo_active_idx" ON "room" USING btree ("organization_id","dojo_id","active");
--> statement-breakpoint
CREATE INDEX "room_dojo_idx" ON "room" USING btree ("dojo_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "room_dojo_name_active_uq" ON "room" USING btree ("dojo_id","name") WHERE "room"."deleted_at" IS NULL;
--> statement-breakpoint
CREATE INDEX "class_room_idx" ON "class" USING btree ("room_id");
