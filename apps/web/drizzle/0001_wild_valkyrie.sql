DO $$ BEGIN
 ALTER TABLE "categories" ADD COLUMN "description" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;