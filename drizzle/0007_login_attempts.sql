CREATE TABLE "login_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier_hash" text NOT NULL,
	"ip_hash" text NOT NULL,
	"success" boolean DEFAULT false NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "login_attempt_identifier_created_idx" ON "login_attempt" USING btree ("identifier_hash","created_at");
--> statement-breakpoint
CREATE INDEX "login_attempt_ip_created_idx" ON "login_attempt" USING btree ("ip_hash","created_at");
--> statement-breakpoint
CREATE INDEX "login_attempt_created_idx" ON "login_attempt" USING btree ("created_at");
