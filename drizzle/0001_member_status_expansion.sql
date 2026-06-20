ALTER TYPE "public"."member_status" RENAME TO "member_status_old";--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM(
  'active',
  'temporary_leave',
  'permanent_leave',
  'recovery',
  'sick'
);
--> statement-breakpoint
ALTER TABLE "member" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "member"
  ALTER COLUMN "status" TYPE "public"."member_status"
  USING (
    CASE "status"::text
      WHEN 'paused' THEN 'temporary_leave'
      WHEN 'withdrawn' THEN 'permanent_leave'
      ELSE "status"::text
    END
  )::"public"."member_status";
--> statement-breakpoint
ALTER TABLE "member" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
DROP TYPE "public"."member_status_old";
