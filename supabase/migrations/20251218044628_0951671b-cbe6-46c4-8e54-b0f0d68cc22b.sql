-- Add dump_zip_path column to dump_packs table for desktop app compatibility
ALTER TABLE public.dump_packs 
ADD COLUMN IF NOT EXISTS dump_zip_path text;

-- Add comment explaining the column
COMMENT ON COLUMN public.dump_packs.dump_zip_path IS 'Path to the dump zip file uploaded by the desktop app';