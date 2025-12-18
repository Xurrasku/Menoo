DO $$ BEGIN
 CREATE TYPE "public"."restaurant_size" AS ENUM('small', 'medium', 'large');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurants" ADD COLUMN "size" "restaurant_size";
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
