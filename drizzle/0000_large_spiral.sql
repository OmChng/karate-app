CREATE TYPE "public"."attendance_status" AS ENUM('present', 'late', 'absent', 'excused');--> statement-breakpoint
CREATE TYPE "public"."class_instructor_role" AS ENUM('instructor', 'assistant_instructor');--> statement-breakpoint
CREATE TYPE "public"."class_status" AS ENUM('scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('active', 'paused', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'transfer', 'card', 'other');--> statement-breakpoint
CREATE TYPE "public"."promotion_status" AS ENUM('recommended', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'organization_admin', 'dojo_admin', 'instructor', 'assistant_instructor', 'finance_staff', 'member', 'parent');--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"locale" text DEFAULT 'es-MX' NOT NULL,
	"timezone" text DEFAULT 'America/Mexico_City' NOT NULL,
	"currency" text DEFAULT 'MXN' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "dojo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"parent_dojo_id" uuid,
	"name" text NOT NULL,
	"code" text,
	"address" jsonb DEFAULT '{}'::jsonb,
	"timezone" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_role_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"dojo_id" uuid,
	"role" "user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"phone" text,
	"password_hash" text,
	"name" text NOT NULL,
	"locale" text DEFAULT 'es-MX' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"phone_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "account" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_token" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"dojo_id" uuid NOT NULL,
	"user_id" uuid,
	"avatar_file_id" uuid,
	"code" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"date_of_birth" date,
	"gender" text,
	"email" text,
	"phone" text,
	"address" jsonb DEFAULT '{}'::jsonb,
	"status" "member_status" DEFAULT 'active' NOT NULL,
	"joined_at" date DEFAULT current_date NOT NULL,
	"notes" text,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "guardian" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"relationship" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "member_guardian" (
	"member_id" uuid NOT NULL,
	"guardian_id" uuid NOT NULL,
	"relationship" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	CONSTRAINT "member_guardian_member_id_guardian_id_pk" PRIMARY KEY("member_id","guardian_id")
);
--> statement-breakpoint
CREATE TABLE "rank_definition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"level" integer NOT NULL,
	"min_age" integer,
	"min_months_at_previous" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rank" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"rank_definition_id" uuid NOT NULL,
	"awarded_at" date NOT NULL,
	"awarded_by" uuid,
	"is_current" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"target_rank_definition_id" uuid NOT NULL,
	"status" "promotion_status" DEFAULT 'recommended' NOT NULL,
	"recommended_by" uuid,
	"approved_by" uuid,
	"exam_date" date,
	"score" numeric(5, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_instructor" (
	"class_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "class_instructor_role" DEFAULT 'instructor' NOT NULL,
	CONSTRAINT "class_instructor_class_id_user_id_pk" PRIMARY KEY("class_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "class" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"dojo_id" uuid NOT NULL,
	"name" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"recurrence_rule" text,
	"capacity" integer,
	"rank_min_level" integer,
	"status" "class_status" DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"status" "attendance_status" NOT NULL,
	"marked_by" uuid,
	"marked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"dojo_id" uuid,
	"member_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'MXN' NOT NULL,
	"method" "payment_method" NOT NULL,
	"period_start" date,
	"period_end" date,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reference" text,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "payment_amount_nonneg" CHECK ("payment"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "announcement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"dojo_id" uuid,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"published_at" timestamp with time zone,
	"audience_role" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"dojo_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"location" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "file" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"uploaded_by" uuid,
	"key" text NOT NULL,
	"content_type" text,
	"size_bytes" integer,
	"original_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" uuid,
	"before" jsonb DEFAULT '{}'::jsonb,
	"after" jsonb DEFAULT '{}'::jsonb,
	"ip" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dojo" ADD CONSTRAINT "dojo_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dojo" ADD CONSTRAINT "dojo_parent_dojo_id_dojo_id_fk" FOREIGN KEY ("parent_dojo_id") REFERENCES "public"."dojo"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignment" ADD CONSTRAINT "user_role_assignment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignment" ADD CONSTRAINT "user_role_assignment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignment" ADD CONSTRAINT "user_role_assignment_dojo_id_dojo_id_fk" FOREIGN KEY ("dojo_id") REFERENCES "public"."dojo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_dojo_id_dojo_id_fk" FOREIGN KEY ("dojo_id") REFERENCES "public"."dojo"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_avatar_file_id_file_id_fk" FOREIGN KEY ("avatar_file_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian" ADD CONSTRAINT "guardian_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian" ADD CONSTRAINT "guardian_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_guardian" ADD CONSTRAINT "member_guardian_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_guardian" ADD CONSTRAINT "member_guardian_guardian_id_guardian_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "public"."guardian"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank_definition" ADD CONSTRAINT "rank_definition_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank" ADD CONSTRAINT "rank_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank" ADD CONSTRAINT "rank_rank_definition_id_rank_definition_id_fk" FOREIGN KEY ("rank_definition_id") REFERENCES "public"."rank_definition"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank" ADD CONSTRAINT "rank_awarded_by_user_id_fk" FOREIGN KEY ("awarded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion" ADD CONSTRAINT "promotion_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion" ADD CONSTRAINT "promotion_target_rank_definition_id_rank_definition_id_fk" FOREIGN KEY ("target_rank_definition_id") REFERENCES "public"."rank_definition"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion" ADD CONSTRAINT "promotion_recommended_by_user_id_fk" FOREIGN KEY ("recommended_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion" ADD CONSTRAINT "promotion_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_instructor" ADD CONSTRAINT "class_instructor_class_id_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."class"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_instructor" ADD CONSTRAINT "class_instructor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class" ADD CONSTRAINT "class_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class" ADD CONSTRAINT "class_dojo_id_dojo_id_fk" FOREIGN KEY ("dojo_id") REFERENCES "public"."dojo"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_class_id_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."class"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_user_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_dojo_id_dojo_id_fk" FOREIGN KEY ("dojo_id") REFERENCES "public"."dojo"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_dojo_id_dojo_id_fk" FOREIGN KEY ("dojo_id") REFERENCES "public"."dojo"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_dojo_id_dojo_id_fk" FOREIGN KEY ("dojo_id") REFERENCES "public"."dojo"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_uq" ON "organization" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "dojo_org_active_idx" ON "dojo" USING btree ("organization_id","active");--> statement-breakpoint
CREATE INDEX "dojo_org_idx" ON "dojo" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "user_role_user_org_idx" ON "user_role_assignment" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_role_unique" ON "user_role_assignment" USING btree ("user_id","organization_id","dojo_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_uq" ON "user" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "user_phone_uq" ON "user" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "member_org_dojo_status_idx" ON "member" USING btree ("organization_id","dojo_id","status");--> statement-breakpoint
CREATE INDEX "member_org_name_idx" ON "member" USING btree ("organization_id","last_name","first_name");--> statement-breakpoint
CREATE INDEX "member_org_active_idx" ON "member" USING btree ("organization_id") WHERE "member"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "guardian_org_idx" ON "guardian" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rank_def_org_level_uq" ON "rank_definition" USING btree ("organization_id","level");--> statement-breakpoint
CREATE INDEX "rank_def_org_idx" ON "rank_definition" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "rank_member_idx" ON "rank" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rank_member_current_uq" ON "rank" USING btree ("member_id") WHERE "rank"."is_current" = true;--> statement-breakpoint
CREATE INDEX "promotion_member_idx" ON "promotion" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "promotion_status_idx" ON "promotion" USING btree ("status");--> statement-breakpoint
CREATE INDEX "class_org_dojo_starts_idx" ON "class" USING btree ("organization_id","dojo_id","starts_at");--> statement-breakpoint
CREATE INDEX "class_starts_idx" ON "class" USING btree ("starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_class_member_uq" ON "attendance" USING btree ("class_id","member_id");--> statement-breakpoint
CREATE INDEX "attendance_member_marked_idx" ON "attendance" USING btree ("member_id","marked_at");--> statement-breakpoint
CREATE INDEX "attendance_class_status_idx" ON "attendance" USING btree ("class_id","status");--> statement-breakpoint
CREATE INDEX "payment_org_paid_idx" ON "payment" USING btree ("organization_id","paid_at");--> statement-breakpoint
CREATE INDEX "payment_member_paid_idx" ON "payment" USING btree ("member_id","paid_at");--> statement-breakpoint
CREATE INDEX "announcement_org_published_idx" ON "announcement" USING btree ("organization_id","published_at");--> statement-breakpoint
CREATE INDEX "event_org_starts_idx" ON "event" USING btree ("organization_id","starts_at");--> statement-breakpoint
CREATE INDEX "file_org_idx" ON "file" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_org_created_idx" ON "audit_log" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_log" USING btree ("entity","entity_id");