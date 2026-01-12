-- Add 'maxi' to restaurant_size enum
DO $$ BEGIN
 ALTER TYPE "public"."restaurant_size" ADD VALUE IF NOT EXISTS 'maxi';
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurants" ADD COLUMN "design_url" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurants" ADD COLUMN "design_description" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
