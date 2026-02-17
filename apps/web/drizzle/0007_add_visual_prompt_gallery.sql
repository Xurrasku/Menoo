CREATE TABLE IF NOT EXISTS "visual_prompt_gallery" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" uuid NOT NULL,
  "prompt" text NOT NULL,
  "preview_image_data_url" text NOT NULL,
  "source_asset_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "visual_prompt_gallery" ADD CONSTRAINT "visual_prompt_gallery_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "visual_prompt_gallery" ADD CONSTRAINT "visual_prompt_gallery_source_asset_id_visual_assets_id_fk" FOREIGN KEY ("source_asset_id") REFERENCES "public"."visual_assets"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
