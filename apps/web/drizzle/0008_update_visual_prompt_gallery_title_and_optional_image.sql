DO $$ BEGIN
 ALTER TABLE "visual_prompt_gallery" ADD COLUMN "title" varchar(120);
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
UPDATE "visual_prompt_gallery"
SET "title" = COALESCE(NULLIF(trim("title"), ''), 'Prompt guardado')
WHERE "title" IS NULL OR trim("title") = '';
--> statement-breakpoint
ALTER TABLE "visual_prompt_gallery"
ALTER COLUMN "title" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "visual_prompt_gallery"
ALTER COLUMN "preview_image_data_url" DROP NOT NULL;
