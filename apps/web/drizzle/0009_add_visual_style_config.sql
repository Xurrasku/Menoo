ALTER TABLE "visual_prompt_gallery" ADD COLUMN IF NOT EXISTS "style_config" jsonb;

ALTER TABLE "visual_assets" ADD COLUMN IF NOT EXISTS "prompt_gallery_id" uuid;
ALTER TABLE "visual_assets" ADD COLUMN IF NOT EXISTS "style_config" jsonb;

DO $$ BEGIN
  ALTER TABLE "visual_assets" ADD CONSTRAINT "visual_assets_prompt_gallery_id_fkey" FOREIGN KEY ("prompt_gallery_id") REFERENCES "visual_prompt_gallery"("id") ON DELETE set null;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
